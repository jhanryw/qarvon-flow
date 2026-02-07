import { useMemo, useState } from "react";
import { useTasksBoard, useTaskMutations, type TaskStatus, type ServiceType } from "@/hooks/useTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "ideia", label: "Ideia" },
  { key: "editando", label: "Editando" },
  { key: "editado", label: "Editado" },
  { key: "enviado", label: "Enviado" },
  { key: "aprovado", label: "Aprovado" },
  { key: "agendado", label: "Agendado" },
];

type ClientOption = { id: string; name: string };
type ProfileOption = { id: string; nome: string };

async function fetchClients(): Promise<ClientOption[]> {
  const { data, error } = await supabase.from("clients").select("id,name").order("name");
  if (error) throw error;
  return (data ?? []) as ClientOption[];
}

async function fetchProfiles(): Promise<ProfileOption[]> {
  const { data, error } = await supabase.from("profiles").select("id,nome").order("nome");
  if (error) throw error;
  return (data ?? []) as ProfileOption[];
}

type CalendarRow = {
  id: string;
  title: string;
  status: string;
  service_type: string;
  due_date: string;
  client_name: string | null;
  assignee_name: string | null;
};

async function fetchCalendar(): Promise<CalendarRow[]> {
  const { data, error } = await supabase
    .from("tasks_calendar")
    .select("id,title,status,service_type,due_date,client_name,assignee_name")
    .order("due_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarRow[];
}

export function OperacionalView() {
  const [tab, setTab] = useState<"kanban" | "calendario">("kanban");

  // filtros
  const [clientId, setClientId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");

  const clientsQ = useQuery({ queryKey: ["clients"], queryFn: fetchClients });
  const profilesQ = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const tasksQ = useTasksBoard({
    clientId: clientId || undefined,
    assigneeId: assigneeId || undefined,
    serviceType: (serviceType || undefined) as ServiceType | undefined,
  });

  const { updateStatus } = useTaskMutations();

  const columns = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    for (const s of STATUSES) grouped[s.key] = [];
    for (const t of tasksQ.data ?? []) grouped[t.status]?.push(t);
    return grouped;
  }, [tasksQ.data]);

  // calendário
  const calQ = useQuery({ queryKey: ["tasks_calendar"], queryFn: fetchCalendar });
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarRow[]>();
    for (const t of calQ.data ?? []) {
      const key = t.due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [calQ.data]);

  const selectedKey = selected ? selected.toISOString().slice(0, 10) : "";
  const list = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  const daysWithTasks = useMemo(() => {
    return Array.from(byDay.keys()).map((d) => new Date(d + "T00:00:00"));
  }, [byDay]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Top controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex rounded-lg border p-1 w-fit bg-muted/30">
          <button
            className={`px-3 py-2 text-sm rounded-md ${tab === "kanban" ? "bg-background shadow-sm" : "opacity-70"}`}
            onClick={() => setTab("kanban")}
          >
            Kanban
          </button>
          <button
            className={`px-3 py-2 text-sm rounded-md ${tab === "calendario" ? "bg-background shadow-sm" : "opacity-70"}`}
            onClick={() => setTab("calendario")}
          >
            Calendário
          </button>
        </div>

        {/* filtros (usados no Kanban; pode reaproveitar pro calendário depois) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full md:w-auto">
          <select className="border rounded-lg p-2" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Todos os clientes</option>
            {(clientsQ.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select className="border rounded-lg p-2" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Todos os responsáveis</option>
            {(profilesQ.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>

          <select className="border rounded-lg p-2" value={serviceType} onChange={(e) => setServiceType(e.target.value as any)}>
            <option value="">Todos os serviços</option>
            <option value="social">Social</option>
            <option value="traffic">Tráfego</option>
            <option value="editor">Editor</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {tab === "kanban" ? (
        <>
          {tasksQ.isLoading && <div>Carregando...</div>}
          {tasksQ.error && <div className="text-sm text-red-600">Erro ao carregar tasks.</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATUSES.map((col) => (
              <div key={col.key} className="rounded-xl border bg-muted/30 p-3 space-y-3 min-h-[240px]">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{col.label}</div>
                  <div className="text-xs opacity-70">{(columns[col.key] ?? []).length}</div>
                </div>

                <div className="space-y-2">
                  {(columns[col.key] ?? []).map((t) => (
                    <div key={t.id} className="rounded-xl border bg-background p-3 space-y-2 hover:shadow-sm transition">
                      <div className="text-sm font-semibold">{t.title}</div>
                      <div className="text-xs opacity-70">
                        {t.client_name ? `Cliente: ${t.client_name}` : "Sem cliente"} •{" "}
                        {t.assignee_name ? `Resp: ${t.assignee_name}` : "Sem responsável"}
                      </div>

                      <select
                        className="border rounded-lg p-2 text-xs w-full"
                        value={t.status}
                        onChange={(e) => updateStatus.mutate({ taskId: t.id, status: e.target.value as TaskStatus })}
                        disabled={updateStatus.isPending}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.key} value={s.key}>
                            Mover para: {s.label}
                          </option>
                        ))}
                      </select>

                      {t.due_date && <div className="text-xs">Entrega: {t.due_date}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {calQ.isLoading && <div>Carregando...</div>}
          {calQ.error && <div className="text-sm text-red-600">Erro ao carregar calendário.</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="border rounded-xl p-3 bg-background">
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={setSelected}
                modifiers={{ hasTasks: daysWithTasks }}
                modifiersClassNames={{ hasTasks: "has-tasks-day" }}
              />
              <div className="text-xs opacity-70 mt-2">Dias com entregas aparecem marcados.</div>
            </div>

            <div className="border rounded-xl p-4 space-y-3 bg-background">
              <div className="font-semibold text-sm">Entregas em: {selectedKey || "Selecione um dia"}</div>

              {list.length === 0 ? (
                <div className="text-sm opacity-70">Nenhuma task com entrega nesse dia.</div>
              ) : (
                <div className="space-y-2">
                  {list.map((t) => (
                    <div key={t.id} className="rounded-xl border p-3">
                      <div className="text-sm font-semibold">{t.title}</div>
                      <div className="text-xs opacity-70">
                        {t.client_name ? `Cliente: ${t.client_name}` : "Sem cliente"} •{" "}
                        {t.assignee_name ? `Resp: ${t.assignee_name}` : "Sem responsável"} •{" "}
                        {t.service_type} • {t.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <style>{`
            .has-tasks-day {
              background: hsl(var(--muted));
              border-radius: 10px;
            }
          `}</style>
        </>
      )}
    </div>
  );
}

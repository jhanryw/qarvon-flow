import { useMemo, useState } from "react";
import { useTasksBoard, useTaskMutations, type TaskStatus, type ServiceType } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";

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

export default function Kanban() {
  const [clientId, setClientId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [serviceType, setServiceType] = useState<ServiceType | "">("");

  const { data, isLoading, error } = useTasksBoard({
    clientId: clientId || undefined,
    assigneeId: assigneeId || undefined,
    serviceType: (serviceType || undefined) as ServiceType | undefined,
  });

  const { updateStatus } = useTaskMutations();

  const columns = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    for (const s of STATUSES) grouped[s.key] = [];
    for (const t of data ?? []) grouped[t.status]?.push(t);
    return grouped;
  }, [data]);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [filtersReady, setFiltersReady] = useState(false);

  useMemo(() => {
    if (filtersReady) return;
    Promise.all([fetchClients(), fetchProfiles()])
      .then(([c, p]) => {
        setClients(c);
        setProfiles(p);
        setFiltersReady(true);
      })
      .catch(() => setFiltersReady(true));
  }, [filtersReady]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Operacional, Kanban</h1>
          <p className="text-sm opacity-70">Filtro por cliente, responsável e tipo de serviço.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full md:w-auto">
          <select className="border rounded-lg p-2" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Todos os clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select className="border rounded-lg p-2" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Todos os responsáveis</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
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

      {isLoading && <div>Carregando...</div>}
      {error && <div className="text-red-600 text-sm">Erro ao carregar tasks.</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUSES.map((col) => (
          <div key={col.key} className="border rounded-xl p-3 space-y-3 min-h-[200px]">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{col.label}</div>
              <div className="text-xs opacity-70">{(columns[col.key] ?? []).length}</div>
            </div>

            <div className="space-y-2">
              {(columns[col.key] ?? []).map((t) => (
                <div key={t.id} className="border rounded-xl p-3 space-y-2">
                  <div className="text-sm font-semibold">{t.title}</div>

                  <div className="text-xs opacity-70">
                    {t.client_name ? `Cliente: ${t.client_name}` : "Sem cliente"} •{" "}
                    {t.assignee_name ? `Resp: ${t.assignee_name}` : "Sem responsável"}
                  </div>

                  <div className="flex items-center gap-2">
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
                  </div>

                  {t.due_date && <div className="text-xs">Entrega: {t.due_date}</div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

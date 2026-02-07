import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type CalendarRow = {
  id: string;
  title: string;
  status: string;
  service_type: string;
  due_date: string; // YYYY-MM-DD
  client_id: string | null;
  client_name: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_avatar: string | null;
};

async function fetchCalendar(): Promise<CalendarRow[]> {
  const { data, error } = await supabase
    .from("tasks_calendar")
    .select("*")
    .order("due_date", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CalendarRow[];
}

export default function Calendar() {
  const q = useQuery({ queryKey: ["tasks_calendar"], queryFn: fetchCalendar });
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarRow[]>();
    for (const t of q.data ?? []) {
      const key = t.due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [q.data]);

  const selectedKey = selected ? selected.toISOString().slice(0, 10) : "";
  const list = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  const daysWithTasks = useMemo(() => {
    return Array.from(byDay.keys()).map((d) => new Date(d + "T00:00:00"));
  }, [byDay]);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Operacional, Calendário</h1>
        <p className="text-sm opacity-70">Clique em um dia para ver as entregas.</p>
      </div>

      {q.isLoading && <div>Carregando...</div>}
      {q.error && <div className="text-red-600 text-sm">Erro ao carregar calendário.</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="border rounded-xl p-3">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={setSelected}
            modifiers={{ hasTasks: daysWithTasks }}
            modifiersClassNames={{ hasTasks: "has-tasks-day" }}
          />
          <div className="text-xs opacity-70 mt-2">Dias com entregas aparecem marcados.</div>
        </div>

        <div className="border rounded-xl p-4 space-y-3">
          <div className="font-semibold">
            Entregas em: {selectedKey || "Selecione um dia"}
          </div>

          {list.length === 0 ? (
            <div className="text-sm opacity-70">Nenhuma task com entrega nesse dia.</div>
          ) : (
            <div className="space-y-2">
              {list.map((t) => (
                <div key={t.id} className="border rounded-xl p-3">
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

      {/* estilo simples pros dias marcados */}
      <style>{`
        .has-tasks-day {
          outline: 2px solid currentColor;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TaskStatus =
  | "ideia"
  | "editando"
  | "editado"
  | "enviado"
  | "aprovado"
  | "agendado";

export type ServiceType = "social" | "traffic" | "editor";

export type TasksBoardRow = {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  service_type: ServiceType;
  assignee_id: string | null;
  due_date: string | null; // YYYY-MM-DD
  created_at: string;

  client_name: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  assignee_avatar: string | null;
};

export type TasksBoardFilters = {
  clientId?: string;
  assigneeId?: string;
  serviceType?: ServiceType;
  status?: TaskStatus;
};

async function fetchTasksBoard(filters: TasksBoardFilters): Promise<TasksBoardRow[]> {
  let q = supabase.from("tasks_board").select("*").order("created_at", { ascending: false });

  if (filters.clientId) q = q.eq("client_id", filters.clientId);
  if (filters.assigneeId) q = q.eq("assignee_id", filters.assigneeId);
  if (filters.serviceType) q = q.eq("service_type", filters.serviceType);
  if (filters.status) q = q.eq("status", filters.status);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TasksBoardRow[];
}

export function useTasksBoard(filters: TasksBoardFilters) {
  return useQuery({
    queryKey: ["tasks_board", filters],
    queryFn: () => fetchTasksBoard(filters),
  });
}

type UpdateTaskStatusInput = { taskId: string; status: TaskStatus };
type UpdateTaskAssigneeInput = { taskId: string; assigneeId: string | null };
type UpdateTaskDueDateInput = { taskId: string; dueDate: string | null };

export function useTaskMutations() {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (input: UpdateTaskStatusInput) => {
      const { error } = await supabase.from("tasks").update({ status: input.status }).eq("id", input.taskId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks_board"] });
      await qc.invalidateQueries({ queryKey: ["tasks_calendar"] });
    },
  });

  const updateAssignee = useMutation({
    mutationFn: async (input: UpdateTaskAssigneeInput) => {
      const { error } = await supabase.from("tasks").update({ assignee_id: input.assigneeId }).eq("id", input.taskId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks_board"] });
      await qc.invalidateQueries({ queryKey: ["tasks_calendar"] });
    },
  });

  const updateDueDate = useMutation({
    mutationFn: async (input: UpdateTaskDueDateInput) => {
      const { error } = await supabase.from("tasks").update({ due_date: input.dueDate }).eq("id", input.taskId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks_board"] });
      await qc.invalidateQueries({ queryKey: ["tasks_calendar"] });
    },
  });

  return { updateStatus, updateAssignee, updateDueDate };
}

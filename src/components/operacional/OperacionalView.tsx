function OperacionalView() {

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { supabase } from "@/integrations/supabase/client";
import {
  useTasksBoard,
  useTaskMutations,
  type TaskStatus,
  type ServiceType,
} from "@/hooks/useTasks";

const STATUSES: { key: string; label: string }[] = [
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
  const { data, error } = await supabase
    .from("clients")
    .select("id,name")
    .order("name");
  if (error) throw error;
  return (data ?? []) as ClientOption[];
}

async function fetchProfiles(): Promise<ProfileOption[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,nome")
    .order("nome");
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
}}

export { OperacionalView };
export default OperacionalView;

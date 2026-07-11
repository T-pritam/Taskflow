import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";

const TASK_SELECT = `
  id, title, description, section_id, status, priority, due_date,
  assignee_id, created_by, restricted_to_role, created_at, updated_at,
  section:sections ( id, name ),
  assignee:profiles!tasks_assignee_id_fkey ( id, full_name, email, avatar_url ),
  creator:profiles!tasks_created_by_fkey ( id, full_name, email ),
  task_labels ( label:labels ( id, name, color ) )
`;

function normalize(row) {
  return {
    ...row,
    labels: (row.task_labels ?? []).map((tl) => tl.label).filter(Boolean),
  };
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select(TASK_SELECT)
      .order("created_at", { ascending: false });

    if (error) console.error("Failed to load tasks", error);
    setTasks((data ?? []).map(normalize));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function fetchOne(taskId) {
    const { data, error } = await supabase
      .from("tasks")
      .select(TASK_SELECT)
      .eq("id", taskId)
      .single();
    if (error) throw error;
    return normalize(data);
  }

  async function syncLabels(taskId, labelIds) {
    const { data: current, error: readError } = await supabase
      .from("task_labels")
      .select("label_id")
      .eq("task_id", taskId);
    if (readError) throw readError;

    const currentIds = (current ?? []).map((r) => r.label_id);
    const toAdd = labelIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !labelIds.includes(id));

    if (toAdd.length > 0) {
      const { error } = await supabase
        .from("task_labels")
        .insert(toAdd.map((label_id) => ({ task_id: taskId, label_id })));
      if (error) throw error;
    }
    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("task_labels")
        .delete()
        .eq("task_id", taskId)
        .in("label_id", toRemove);
      if (error) throw error;
    }
  }

  async function createTask(fields, labelIds = []) {
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...fields, created_by: user.id })
      .select("id")
      .single();
    if (error) throw error;

    if (labelIds.length > 0) await syncLabels(data.id, labelIds);

    const created = await fetchOne(data.id);
    setTasks((prev) => [created, ...prev]);
    return created;
  }

  async function updateTask(taskId, fields, labelIds) {
    const { data, error } = await supabase
      .from("tasks")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select("id");
    if (error) throw error;
    if (data.length === 0) throw new Error("You don't have permission to edit this task");

    if (labelIds) await syncLabels(taskId, labelIds);

    const updated = await fetchOne(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    return updated;
  }

  async function updateStatus(taskId, status) {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));

    const { data, error } = await supabase
      .from("tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select("id");

    if (error || data.length === 0) {
      setTasks(previous);
      throw error ?? new Error("You don't have permission to move this task");
    }
  }

  async function deleteTask(taskId) {
    const { data, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .select("id");
    if (error) throw error;
    if (data.length === 0) throw new Error("Only an admin or the creator can delete this task");
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  return {
    tasks,
    loading,
    reload: load,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
  };
}

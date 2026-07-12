import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ACTIVITY_SELECT = `
  id, action, field, old_value, new_value, created_at,
  actor:profiles!task_activity_actor_id_fkey ( id, full_name, email, avatar_url )
`;

export function useActivity(taskId) {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!taskId) {
      setActivity([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("task_activity")
      .select(ACTIVITY_SELECT)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) console.error("Failed to load activity", error);
    setActivity(data ?? []);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  return { activity, loading, reload: load };
}

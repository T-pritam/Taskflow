import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role")
      .order("created_at", { ascending: true });

    if (error) console.error("Failed to load members", error);
    setMembers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateRole(memberId, role) {
    const { error } = await supabase.from("profiles").update({ role }).eq("id", memberId);
    if (error) throw error;
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
  }

  return { members, loading, reload: load, updateRole };
}

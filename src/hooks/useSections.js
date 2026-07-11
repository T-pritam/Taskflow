import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";

export function useSections() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("sections")
      .select("id, name, position")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) console.error("Failed to load sections", error);
    setSections(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createSection(name) {
    const { data, error } = await supabase
      .from("sections")
      .insert({ name, position: sections.length, created_by: user.id })
      .select("id, name, position")
      .single();

    if (error) throw error;
    setSections((prev) => [...prev, data]);
    return data;
  }

  return { sections, loading, reload: load, createSection };
}

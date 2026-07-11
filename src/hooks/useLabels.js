import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useLabels() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("labels")
      .select("id, name, color")
      .order("name", { ascending: true });

    if (error) console.error("Failed to load labels", error);
    setLabels(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createLabel(name) {
    const { data, error } = await supabase
      .from("labels")
      .insert({ name })
      .select("id, name, color")
      .single();

    if (error) throw error;
    setLabels((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    return data;
  }

  return { labels, loading, reload: load, createLabel };
}

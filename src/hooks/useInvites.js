import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("invites")
      .select("id, email, role, status, invited_by, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) console.error("Failed to load invites", error);
    setInvites(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function revokeInvite(id) {
    const { data, error } = await supabase.from("invites").delete().eq("id", id).select("id");
    if (error) throw error;
    if (data.length === 0) throw new Error("You can't revoke this invite");
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  async function resendInvite({ email, role }) {
    const { error } = await supabase.functions.invoke("invite-member", {
      body: { email, role },
    });
    if (error) throw error;
  }

  return { invites, loading, reload: load, revokeInvite, resendInvite };
}

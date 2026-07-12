import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, task_id, message, read, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) console.error("Failed to load notifications", error);
    setNotifications(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [user, load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(notificationId) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);
    if (error) throw error;

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);
    if (error) throw error;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return { notifications, unreadCount, loading, reload: load, markRead, markAllRead };
}

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";

const COMMENT_SELECT = `
  id, body, mentioned_user_ids, created_at,
  author:profiles!comments_author_id_fkey ( id, full_name, email, avatar_url )
`;

export function useComments(taskId) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!taskId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) console.error("Failed to load comments", error);
    setComments(data ?? []);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addComment(body, mentionedUserIds = []) {
    const { data, error } = await supabase
      .from("comments")
      .insert({
        task_id: taskId,
        author_id: user.id,
        body,
        mentioned_user_ids: mentionedUserIds,
      })
      .select(COMMENT_SELECT)
      .single();

    if (error) throw error;
    setComments((prev) => [...prev, data]);
    return data;
  }

  return { comments, loading, reload: load, addComment };
}

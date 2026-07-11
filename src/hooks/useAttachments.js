import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";

const BUCKET = "task-files";

function pathFor(taskId, fileName) {
  return `${taskId}/${crypto.randomUUID()}-${fileName}`;
}

export function useAttachments(taskId) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!taskId) {
      setAttachments([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("task_attachments")
      .select("id, file_path, file_name, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) console.error("Failed to load attachments", error);
    setAttachments(data ?? []);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(file, forTaskId = taskId) {
    const path = pathFor(forTaskId, file.name);

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("task_attachments")
      .insert({
        task_id: forTaskId,
        file_path: path,
        file_name: file.name,
        uploaded_by: user.id,
      })
      .select("id, file_path, file_name, created_at")
      .single();

    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw error;
    }

    if (forTaskId === taskId) setAttachments((prev) => [...prev, data]);
    return data;
  }

  async function remove(attachment) {
    const { error } = await supabase
      .from("task_attachments")
      .delete()
      .eq("id", attachment.id);
    if (error) throw error;

    await supabase.storage.from(BUCKET).remove([attachment.file_path]);
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
  }

  async function getSignedUrl(filePath) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60);
    if (error) throw error;
    return data.signedUrl;
  }

  return { attachments, loading, reload: load, upload, remove, getSignedUrl };
}

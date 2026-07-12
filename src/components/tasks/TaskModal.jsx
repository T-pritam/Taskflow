import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/authStore";
import { useComments } from "@/hooks/useComments";
import { useActivity } from "@/hooks/useActivity";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CommentBox from "@/components/comments/CommentBox";
import CommentList from "@/components/comments/CommentList";
import ActivityFeed from "@/components/activity/ActivityFeed";
import TaskForm from "./TaskForm";

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export default function TaskModal({
  open,
  onOpenChange,
  task,
  sections,
  labels,
  members,
  onCreateLabel,
  createTask,
  updateTask,
  deleteTask,
}) {
  const { profile, isAdmin, user } = useAuth();
  const isEdit = Boolean(task);
  const { comments, loading: commentsLoading, addComment } = useComments(task?.id);
  const { activity, loading: activityLoading, reload: reloadActivity } = useActivity(task?.id);

  const canDelete = isEdit && (isAdmin || task.created_by === profile?.id);

  async function handleAddComment(body, mentionedUserIds) {
    const result = await addComment(body, mentionedUserIds);
    reloadActivity();
    return result;
  }

  async function handleSubmit(fields, labelIds) {
    if (isEdit) {
      const updated = await updateTask(task.id, fields, labelIds);
      toast.success("Task updated");
      return updated;
    }
    const created = await createTask(fields, labelIds ?? []);
    toast.success("Task created");
    return created;
  }

  async function handleDelete() {
    try {
      await deleteTask(task.id);
      toast.success("Task deleted");
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleShare() {
    try {
      const { data: existing, error: readError } = await supabase
        .from("task_shares")
        .select("token")
        .eq("task_id", task.id)
        .limit(1)
        .maybeSingle();
      if (readError) throw readError;

      let token = existing?.token;
      if (!token) {
        const { data, error } = await supabase
          .from("task_shares")
          .insert({ task_id: task.id, created_by: user.id })
          .select("token")
          .single();
        if (error) throw error;
        token = data.token;
      }

      const url = `${APP_URL}/share/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pr-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle>{isEdit ? "Task details" : "New task"}</DialogTitle>
            {isEdit && (
              <Button type="button" variant="outline" size="sm" onClick={handleShare}>
                <Link2 className="size-4" />
                Share
              </Button>
            )}
          </div>
          <DialogDescription>
            {isEdit
              ? "Update the task, or leave a comment for the people following it."
              : "Add a task to the board."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <TaskForm
            task={task}
            sections={sections}
            labels={labels}
            members={members}
            onCreateLabel={onCreateLabel}
            onSubmit={handleSubmit}
            onSaved={() => onOpenChange(false)}
            onDelete={canDelete ? handleDelete : undefined}
            onCancel={() => onOpenChange(false)}
          />

          {isEdit && (
            <div className="flex flex-col gap-4 border-t pt-4">
              <h3 className="text-sm font-medium">Comments</h3>
              <CommentList comments={comments} loading={commentsLoading} />
              <CommentBox members={members} onSubmit={handleAddComment} />
            </div>
          )}

          {isEdit && (
            <div className="flex flex-col gap-4 border-t pt-4">
              <h3 className="text-sm font-medium">Activity</h3>
              <ActivityFeed
                activity={activity}
                loading={activityLoading}
                members={members}
                sections={sections}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

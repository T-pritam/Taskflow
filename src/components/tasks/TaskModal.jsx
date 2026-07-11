import { toast } from "sonner";
import { useAuth } from "@/store/authStore";
import { useComments } from "@/hooks/useComments";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CommentBox from "@/components/comments/CommentBox";
import CommentList from "@/components/comments/CommentList";
import TaskForm from "./TaskForm";

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
  const { profile, isAdmin } = useAuth();
  const isEdit = Boolean(task);
  const { comments, loading: commentsLoading, addComment } = useComments(task?.id);

  const canDelete = isEdit && (isAdmin || task.created_by === profile?.id);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pr-10">
          <DialogTitle>{isEdit ? "Task details" : "New task"}</DialogTitle>
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
              <CommentBox members={members} onSubmit={addComment} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

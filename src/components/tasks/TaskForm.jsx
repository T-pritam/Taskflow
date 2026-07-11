import { useState } from "react";
import { Download, Loader2, Lock, Paperclip, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/authStore";
import { useAttachments } from "@/hooks/useAttachments";
import { fromDateInputValue, toDateInputValue } from "@/lib/date";
import {
  canEditAllFields,
  PRIORITIES,
  PRIORITY_LABELS,
  ROLE_LABELS,
  ROLES,
  STATUS_LABELS,
  STATUSES,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import LabelSelect from "./LabelSelect";

const NONE = "none";
const fromNone = (v) => (v === NONE ? null : v);
const toNone = (v) => v ?? NONE;

export default function TaskForm({
  task,
  sections,
  labels,
  members,
  onCreateLabel,
  onSubmit,
  onSaved,
  onDelete,
  onCancel,
}) {
  const { profile, isAdmin } = useAuth();
  const isEdit = Boolean(task);

  const canEditAll = isEdit ? canEditAllFields(task, profile) : true;
  const locked = isEdit && !canEditAll;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [sectionId, setSectionId] = useState(toNone(task?.section_id));
  const [status, setStatus] = useState(task?.status ?? "todo");
  const [priority, setPriority] = useState(toNone(task?.priority));
  const [dueDate, setDueDate] = useState(task?.due_date ? new Date(task.due_date) : null);
  const [assigneeId, setAssigneeId] = useState(toNone(task?.assignee_id));
  const [restrictedToRole, setRestrictedToRole] = useState(toNone(task?.restricted_to_role));
  const [labelIds, setLabelIds] = useState(task?.labels?.map((l) => l.id) ?? []);

  const [pendingFiles, setPendingFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { attachments, upload, remove, getSignedUrl } = useAttachments(task?.id);

  const canEditFiles = canEditAll;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    const fields = locked
      ? { status }
      : {
          title: title.trim(),
          description: description.trim() || null,
          section_id: fromNone(sectionId),
          status,
          priority: fromNone(priority),
          due_date: dueDate ? dueDate.toISOString() : null,
          assignee_id: fromNone(assigneeId),
          restricted_to_role: isAdmin ? fromNone(restrictedToRole) : null,
        };

    try {
      const saved = await onSubmit(fields, locked ? undefined : labelIds);

      if (!isEdit && pendingFiles.length > 0 && saved?.id) {
        for (const file of pendingFiles) {
          await upload(file, saved.id);
        }
      }
      setPendingFiles([]);
      onSaved?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadNow(file) {
    try {
      await upload(file);
      toast.success(`Uploaded ${file.name}`);
    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleFilesPicked(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    if (isEdit) files.forEach(handleUploadNow);
    else setPendingFiles((prev) => [...prev, ...files]);
  }

  async function handleDownload(attachment) {
    try {
      const url = await getSignedUrl(attachment.file_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function handleRemoveAttachment(attachment) {
    try {
      await remove(attachment);
      toast.success("Attachment removed");
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {locked && (
        <div className="text-muted-foreground bg-muted flex items-start gap-2 rounded-md p-3 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>
            You can only change the status of this task. It was created by{" "}
            {task.creator?.full_name || task.creator?.email || "someone else"}.
          </p>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          disabled={locked}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          disabled={locked}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more detail…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="section">Section</Label>
          <Select value={sectionId} onValueChange={setSectionId} disabled={locked}>
            <SelectTrigger id="section" className="w-full">
              <SelectValue placeholder="No section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No section</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={setPriority} disabled={locked}>
            <SelectTrigger id="priority" className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>None</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="due-date">Due date</Label>
          <div className="flex gap-2">
            <Input
              id="due-date"
              type="date"
              className="flex-1"
              disabled={locked}
              value={toDateInputValue(dueDate)}
              onChange={(e) => setDueDate(fromDateInputValue(e.target.value))}
            />
            {dueDate && !locked && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDueDate(null)}
                aria-label="Clear due date"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="assignee">Assignee</Label>
          <Select value={assigneeId} onValueChange={setAssigneeId} disabled={locked}>
            <SelectTrigger id="assignee" className="w-full">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Unassigned</SelectItem>
              {members
                .filter((m) => m.role)
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <div className="grid gap-2">
            <Label htmlFor="restrict">Restrict to role</Label>
            <Select value={restrictedToRole} onValueChange={setRestrictedToRole}>
              <SelectTrigger id="restrict" className="w-full">
                <SelectValue placeholder="Visible to everyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Visible to everyone</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]} only
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label>Labels</Label>
        <LabelSelect
          labels={labels}
          value={labelIds}
          onChange={setLabelIds}
          onCreate={onCreateLabel}
          disabled={locked}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="files">Attachments</Label>
        {canEditFiles && (
          <Input id="files" type="file" multiple onChange={handleFilesPicked} />
        )}

        {pendingFiles.length > 0 && (
          <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
            {pendingFiles.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center gap-2">
                <Paperclip className="size-3.5" />
                <span className="truncate">{file.name}</span>
                <span className="text-xs">(uploads on save)</span>
              </li>
            ))}
          </ul>
        )}

        {attachments.length > 0 && (
          <ul className="flex flex-col gap-1">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="size-3.5 shrink-0" />
                  <span className="truncate">{a.file_name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(a)}
                    aria-label={`Download ${a.file_name}`}
                  >
                    <Download className="size-4" />
                  </Button>
                  {canEditFiles && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAttachment(a)}
                      aria-label={`Remove ${a.file_name}`}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {!canEditFiles && attachments.length === 0 && (
          <p className="text-muted-foreground text-sm">No attachments.</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        {isEdit && onDelete ? (
          <Button type="button" variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </div>
      </div>
    </form>
  );
}

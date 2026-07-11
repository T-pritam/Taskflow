import { CalendarClock, Lock } from "lucide-react";
import { formatShortDate, isPast } from "@/lib/date";
import { cn, initialsOf } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PriorityBadge from "./PriorityBadge";

export default function TaskCard({ task, onClick, dragging }) {
  const overdue = task.due_date && isPast(task.due_date) && task.status !== "done";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "bg-card hover:border-muted-foreground/30 flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left shadow-xs transition",
        dragging && "ring-primary/40 shadow-md ring-2"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-snug font-medium">{task.title}</p>
        {task.restricted_to_role && (
          <Lock className="text-muted-foreground mt-0.5 size-3.5 shrink-0" aria-label="Restricted" />
        )}
      </div>

      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <Badge key={label.id} variant="secondary" className="text-xs font-normal">
              {label.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />

        {task.due_date && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs",
              overdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
            )}
          >
            <CalendarClock className="size-3" />
            {formatShortDate(task.due_date)}
          </span>
        )}

        {task.assignee && (
          <Avatar className="ml-auto size-6">
            <AvatarImage src={task.assignee.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="text-[10px]">{initialsOf(task.assignee)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

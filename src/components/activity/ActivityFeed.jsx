import { formatDate, timeAgo } from "@/lib/date";
import { initialsOf } from "@/lib/utils";
import { PRIORITY_LABELS, ROLE_LABELS, STATUS_LABELS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function describe(entry, nameOf, sectionOf) {
  const { action, field, old_value, new_value } = entry;

  if (action === "created") return "created this task";
  if (action === "commented") return "left a comment";
  if (action === "assigned") return `assigned ${nameOf(new_value)}`;
  if (action === "unassigned") return `unassigned ${nameOf(old_value)}`;

  switch (field) {
    case "status":
      return `changed status from ${STATUS_LABELS[old_value] ?? old_value} to ${STATUS_LABELS[new_value] ?? new_value}`;
    case "priority":
      if (!new_value) return "cleared the priority";
      if (!old_value) return `set priority to ${PRIORITY_LABELS[new_value] ?? new_value}`;
      return `changed priority from ${PRIORITY_LABELS[old_value] ?? old_value} to ${PRIORITY_LABELS[new_value] ?? new_value}`;
    case "title":
      return `renamed the task to “${new_value}”`;
    case "description":
      return "edited the description";
    case "due_date":
      if (!new_value) return "cleared the due date";
      return `set the due date to ${formatDate(new_value)}`;
    case "section_id":
      if (!new_value) return "removed the section";
      return `moved the task to ${sectionOf(new_value)}`;
    case "restricted_to_role":
      if (!new_value) return "made the task visible to everyone";
      return `restricted the task to ${ROLE_LABELS[new_value] ?? new_value}`;
    default:
      return `updated the ${field ?? "task"}`;
  }
}

export default function ActivityFeed({ activity, loading, members = [], sections = [] }) {
  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading activity…</p>;
  }

  if (activity.length === 0) {
    return <p className="text-muted-foreground text-sm">No activity yet.</p>;
  }

  const nameOf = (id) => {
    const m = members.find((member) => member.id === id);
    return m ? m.full_name || m.email : "someone";
  };
  const sectionOf = (id) => sections.find((section) => section.id === id)?.name ?? "a section";

  return (
    <ul className="flex flex-col gap-4">
      {activity.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <Avatar className="size-7 shrink-0">
            <AvatarImage src={entry.actor?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="text-xs">{initialsOf(entry.actor)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm wrap-break-word">
              <span className="font-medium">
                {entry.actor?.full_name || entry.actor?.email || "Someone"}
              </span>{" "}
              {describe(entry, nameOf, sectionOf)}
            </p>
            <span className="text-muted-foreground text-xs">{timeAgo(entry.created_at)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

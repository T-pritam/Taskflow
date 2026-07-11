import { Lock } from "lucide-react";
import { formatDate, isPast } from "@/lib/date";
import { cn, initialsOf } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PriorityBadge from "./PriorityBadge";

const NO_SECTION = "__none__";

function groupBySection(tasks, sections) {
  const groups = new Map();
  for (const section of sections) groups.set(section.id, { section, tasks: [] });
  groups.set(NO_SECTION, { section: { id: NO_SECTION, name: "No section" }, tasks: [] });

  for (const task of tasks) {
    const key = task.section_id && groups.has(task.section_id) ? task.section_id : NO_SECTION;
    groups.get(key).tasks.push(task);
  }

  return [...groups.values()].filter((g) => g.tasks.length > 0);
}

export default function ListView({ tasks, sections, onOpenTask }) {
  const groups = groupBySection(tasks, sections);

  return (
    <div className="flex flex-col gap-8">
      {groups.map(({ section, tasks: sectionTasks }) => (
        <div key={section.id} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">
            {section.name}
            <span className="text-muted-foreground ml-2 font-normal">{sectionTasks.length}</span>
          </h2>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-24">Priority</TableHead>
                  <TableHead className="hidden w-40 md:table-cell">Assignee</TableHead>
                  <TableHead className="hidden w-32 sm:table-cell">Due</TableHead>
                  <TableHead className="hidden w-48 lg:table-cell">Labels</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionTasks.map((task) => {
                  const overdue =
                    task.due_date && isPast(task.due_date) && task.status !== "done";

                  return (
                    <TableRow
                      key={task.id}
                      onClick={() => onOpenTask(task)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{task.title}</span>
                          {task.restricted_to_role && (
                            <Lock className="text-muted-foreground size-3.5" aria-label="Restricted" />
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{STATUS_LABELS[task.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={task.priority} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {task.assignee ? (
                          <span className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarImage src={task.assignee.avatar_url ?? undefined} alt="" />
                              <AvatarFallback className="text-[10px]">
                                {initialsOf(task.assignee)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-sm">
                              {task.assignee.full_name || task.assignee.email}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {task.due_date ? (
                          <span
                            className={cn(
                              "text-sm",
                              overdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                            )}
                          >
                            {formatDate(task.due_date)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="flex flex-wrap gap-1">
                          {task.labels?.map((label) => (
                            <Badge key={label.id} variant="secondary" className="font-normal">
                              {label.name}
                            </Badge>
                          ))}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}

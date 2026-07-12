export const ROLES = ["admin", "project_manager", "developer"];

export const ROLE_LABELS = {
  admin: "Admin",
  project_manager: "Project Manager",
  developer: "Developer",
};

export const STATUSES = ["todo", "backlog", "in_progress", "done"];

export const STATUS_LABELS = {
  todo: "To Do",
  backlog: "Backlog",
  in_progress: "In Progress",
  done: "Done",
};

export const PRIORITIES = ["p1", "p2", "p3"];

export const PRIORITY_LABELS = { p1: "P1", p2: "P2", p3: "P3" };

export const PRIORITY_RANK = { p1: 0, p2: 1, p3: 2 };

export function byPriority(a, b) {
  return (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
}

export function invitableRoles(role) {
  if (role === "admin") return ["project_manager", "developer"];
  if (role === "project_manager") return ["developer"];
  return [];
}

export function canEditAllFields(task, profile) {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  return task?.created_by === profile.id;
}

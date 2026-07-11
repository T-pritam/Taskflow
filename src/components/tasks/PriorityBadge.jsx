import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS } from "@/lib/constants";

const STYLES = {
  p1: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  p2: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  p3: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
};

export default function PriorityBadge({ priority }) {
  if (!priority) return null;
  return (
    <Badge variant="outline" className={STYLES[priority]}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const map: Record<TaskStatus, string> = {
  "Not Started": "bg-zinc-100 text-ink-muted ring-zinc-200",
  "In Progress": "bg-sky-50 text-sky-900 ring-sky-200/80",
  Completed: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",
  Blocked: "bg-amber-50 text-amber-900 ring-amber-200/80",
};

export function TaskStatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        map[status],
        className,
      )}
    >
      {status}
    </span>
  );
}

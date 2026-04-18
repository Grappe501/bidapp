import { cn } from "@/lib/utils";
import type { SubmissionWorkflowStatus } from "@/types";

const map: Record<SubmissionWorkflowStatus, string> = {
  "Not Started": "bg-zinc-100 text-ink-muted ring-zinc-200",
  "In Progress": "bg-sky-50 text-sky-900 ring-sky-200/80",
  Ready: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",
  Blocked: "bg-amber-50 text-amber-900 ring-amber-200/80",
  Completed: "bg-zinc-900 text-white ring-zinc-700",
};

export function WorkflowStatusBadge({
  status,
  className,
}: {
  status: SubmissionWorkflowStatus;
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

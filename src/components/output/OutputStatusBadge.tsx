import { cn } from "@/lib/utils";
import type { OutputStatus } from "@/types";

const styles: Record<OutputStatus, string> = {
  Draft: "bg-zinc-100 text-ink-muted ring-zinc-200",
  "In Progress": "bg-amber-50 text-amber-900 ring-amber-200/80",
  Ready: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",
  Validated: "bg-sky-50 text-sky-900 ring-sky-200/80",
  Locked: "bg-zinc-900 text-white ring-zinc-700",
};

export function OutputStatusBadge({
  status,
  className,
}: {
  status: OutputStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}

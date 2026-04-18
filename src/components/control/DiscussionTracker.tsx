import { Badge } from "@/components/ui/Badge";
import type { DiscussionItem } from "@/types";

type DiscussionTrackerProps = {
  items: DiscussionItem[];
};

export function DiscussionTracker({ items }: DiscussionTrackerProps) {
  const readyish = items.filter(
    (i) => i.status === "Ready" || i.status === "Validated" || i.status === "Submitted",
  ).length;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-zinc-50/80 px-4 py-3">
      <span className="text-sm font-medium text-ink">Discussion readiness</span>
      <Badge variant="neutral" className="tabular-nums">
        {readyish} / {items.length} deliverables on track
      </Badge>
      <span className="text-xs text-ink-muted">
        Post-award artifacts; align now with proposal promises.
      </span>
    </div>
  );
}

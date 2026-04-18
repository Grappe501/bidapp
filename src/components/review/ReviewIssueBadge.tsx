import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { ReviewIssueStatus, ReviewSeverity } from "@/types";

const severityClass: Record<ReviewSeverity, string> = {
  Low: "border-zinc-200 bg-zinc-50 text-ink-muted",
  Moderate: "border-amber-200/90 bg-amber-50/80 text-amber-950",
  High: "border-orange-200 bg-orange-50 text-orange-950",
  Critical: "border-red-200 bg-red-50 text-red-950",
};

export function SeverityBadge({ severity }: { severity: ReviewSeverity }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
        severityClass[severity],
      )}
    >
      {severity}
    </span>
  );
}

export function ReviewStatusBadge({ status }: { status: ReviewIssueStatus }) {
  if (status === "Resolved") {
    return <Badge variant="emphasis">Resolved</Badge>;
  }
  if (status === "Dismissed") {
    return <Badge variant="muted">Dismissed</Badge>;
  }
  if (status === "In Review") {
    return <Badge variant="warning">In review</Badge>;
  }
  return <Badge variant="neutral">Open</Badge>;
}

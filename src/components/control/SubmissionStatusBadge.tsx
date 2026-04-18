import { Badge } from "@/components/ui/Badge";
import type { SubmissionItemStatus } from "@/types";

function variantForStatus(status: SubmissionItemStatus): "muted" | "neutral" | "emphasis" {
  if (status === "Submitted" || status === "Validated") return "emphasis";
  if (status === "In Progress" || status === "Ready") return "neutral";
  return "muted";
}

export function SubmissionStatusBadge({ status }: { status: SubmissionItemStatus }) {
  return (
    <Badge variant={variantForStatus(status)} className="font-normal">
      {status}
    </Badge>
  );
}

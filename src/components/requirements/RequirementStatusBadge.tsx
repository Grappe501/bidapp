import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { formatRequirementStatusLabel } from "@/lib/display-format";
import type { RequirementStatus } from "@/types";

const STATUS_VARIANT: Record<RequirementStatus, BadgeVariant> = {
  "Not Reviewed": "muted",
  Extracted: "neutral",
  Approved: "emphasis",
  "In Progress": "neutral",
  Covered: "emphasis",
  Partial: "warning",
  Blocked: "warning",
  Unresolved: "warning",
};

export function RequirementStatusBadge({
  status,
}: {
  status: RequirementStatus;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {formatRequirementStatusLabel(status)}
    </Badge>
  );
}

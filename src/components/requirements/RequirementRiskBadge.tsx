import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { formatRequirementRiskLabel } from "@/lib/display-format";
import type { RequirementRiskLevel } from "@/types";

const RISK_VARIANT: Record<RequirementRiskLevel, BadgeVariant> = {
  Low: "muted",
  Moderate: "neutral",
  High: "warning",
  Critical: "emphasis",
};

export function RequirementRiskBadge({ risk }: { risk: RequirementRiskLevel }) {
  return (
    <Badge variant={RISK_VARIANT[risk]}>
      {formatRequirementRiskLabel(risk)}
    </Badge>
  );
}

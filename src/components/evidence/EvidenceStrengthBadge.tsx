import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { formatEvidenceSupportStrengthLabel } from "@/lib/display-format";
import type { EvidenceSupportStrength } from "@/types";

const STRENGTH_VARIANT: Record<EvidenceSupportStrength, BadgeVariant> = {
  Weak: "muted",
  Moderate: "neutral",
  Strong: "emphasis",
};

export function EvidenceStrengthBadge({
  strength,
}: {
  strength: EvidenceSupportStrength;
}) {
  return (
    <Badge variant={STRENGTH_VARIANT[strength]}>
      {formatEvidenceSupportStrengthLabel(strength)}
    </Badge>
  );
}

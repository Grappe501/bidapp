import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { formatEvidenceTypeLabel } from "@/lib/display-format";
import type { EvidenceType } from "@/types";

const TYPE_VARIANT: Partial<Record<EvidenceType, BadgeVariant>> = {
  "Verified Fact": "emphasis",
  "Vendor Claim": "neutral",
  "Internal Assumption": "warning",
  "Proposal Intent": "neutral",
  "Inferred Conclusion": "warning",
  "Compliance Reference": "emphasis",
  "Pricing Reference": "neutral",
  "Operational Reference": "muted",
  Other: "muted",
};

export function EvidenceTypeBadge({ type }: { type: EvidenceType }) {
  return (
    <Badge variant={TYPE_VARIANT[type] ?? "neutral"}>
      {formatEvidenceTypeLabel(type)}
    </Badge>
  );
}

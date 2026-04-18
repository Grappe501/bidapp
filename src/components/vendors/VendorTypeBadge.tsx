import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { formatVendorCategoryLabel } from "@/lib/display-format";
import type { VendorCategory } from "@/types";

const CAT_VARIANT: Partial<Record<VendorCategory, BadgeVariant>> = {
  "Primary Platform": "emphasis",
  "Workflow Automation": "neutral",
  "Communication Automation": "neutral",
  "Financial Optimization": "neutral",
  "Clinical Layer": "muted",
  "Analytics Layer": "muted",
  "Integration Layer": "neutral",
  Other: "muted",
};

export function VendorTypeBadge({ category }: { category: VendorCategory }) {
  return (
    <Badge variant={CAT_VARIANT[category] ?? "neutral"}>
      {formatVendorCategoryLabel(category)}
    </Badge>
  );
}

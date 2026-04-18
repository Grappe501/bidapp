import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { formatVendorFitScoreLabel } from "@/lib/display-format";
import type { VendorFitScore } from "@/types";

const SCORE_VARIANT: Record<VendorFitScore, BadgeVariant> = {
  1: "muted",
  2: "muted",
  3: "neutral",
  4: "neutral",
  5: "emphasis",
};

export function VendorFitScoreBadge({ score }: { score: VendorFitScore }) {
  return (
    <Badge variant={SCORE_VARIANT[score]} className="tabular-nums">
      {formatVendorFitScoreLabel(score)}
    </Badge>
  );
}

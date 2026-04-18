import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { DraftMetadata, DraftSectionType } from "@/types";
import {
  pointsLabel,
  scoringCategoriesForSection,
  scoringStrength,
  type ScoreStrength,
} from "@/lib/drafting-utils";

type ScoringFeedbackCardProps = {
  sectionType: DraftSectionType;
  metadata: DraftMetadata | null;
};

function strengthBadge(s: ScoreStrength) {
  if (s === "Strong") return <Badge variant="emphasis">Strong</Badge>;
  if (s === "Moderate") return <Badge variant="neutral">Moderate</Badge>;
  return <Badge variant="neutral">Weak</Badge>;
}

export function ScoringFeedbackCard({
  sectionType,
  metadata,
}: ScoringFeedbackCardProps) {
  const cats = scoringCategoriesForSection(sectionType);
  const strength = scoringStrength(sectionType, metadata);

  return (
    <Card className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Scoring feedback</h2>
        {strengthBadge(strength)}
      </div>
      <p className="text-xs text-ink-muted">
        Alignment with the 1000-point model for this section&apos;s emphasis
        areas. This is guidance, not a prediction of actual scores.
      </p>
      <ul className="space-y-2 text-xs text-ink-muted">
        {cats.map((c) => (
          <li key={c.id} className="rounded border border-border bg-white px-2 py-1.5">
            <span className="font-medium text-ink">{c.name}</span> —{" "}
            {pointsLabel(c.weight)}
            <br />
            <span className="text-ink-muted">{c.description}</span>
          </li>
        ))}
      </ul>
      {metadata && metadata.riskFlags.length > 0 ? (
        <div className="text-xs">
          <p className="font-medium text-ink">Flags</p>
          <ul className="mt-1 list-inside list-disc text-ink-muted">
            {metadata.riskFlags.slice(0, 5).map((f) => (
              <li key={f.slice(0, 24)}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

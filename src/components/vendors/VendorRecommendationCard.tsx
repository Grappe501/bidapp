import { Card } from "@/components/ui/Card";
import { formatRecommendationConfidence } from "@/lib/competitor-display";
import type { CompetitorRecommendationConfidence } from "@/types";

type VendorRecommendationCardProps = {
  recommendedVendorName?: string;
  recommendationConfidence: CompetitorRecommendationConfidence;
  recommendedRationale: string[];
  decisionRisks: string[];
  scenarioNotes: string[];
};

export function VendorRecommendationCard({
  recommendedVendorName,
  recommendationConfidence,
  recommendedRationale,
  decisionRisks,
  scenarioNotes,
}: VendorRecommendationCardProps) {
  return (
    <Card className="space-y-4 p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Recommendation (decision support)
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Confidence:{" "}
          <span className="font-medium text-ink">
            {formatRecommendationConfidence(recommendationConfidence)}
          </span>
          {recommendedVendorName ? (
            <>
              {" "}
              — leading option:{" "}
              <span className="font-medium text-ink">{recommendedVendorName}</span>
            </>
          ) : null}
        </p>
      </div>
      {recommendedRationale.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-ink-subtle">Why</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-muted">
            {recommendedRationale.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {decisionRisks.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-amber-900/80">Caveats</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-amber-950/90">
            {decisionRisks.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {scenarioNotes.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-ink-subtle">If you switch vendor</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-muted">
            {scenarioNotes.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

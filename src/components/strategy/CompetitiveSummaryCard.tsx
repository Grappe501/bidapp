import { Card } from "@/components/ui/Card";
import type { StrategicSummary } from "@/lib/strategy-utils";

export function CompetitiveSummaryCard({
  summary,
  bidNumber,
}: {
  summary: StrategicSummary;
  bidNumber: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
        Strategic posture
      </p>
      <h2 className="mt-1 text-lg font-semibold text-ink">{bidNumber}</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Likely bidders in view:{" "}
        <span className="font-medium text-ink">{summary.likelyBidderCount}</span>
        . Monitoring:{" "}
        <span className="font-medium text-ink">{summary.monitoringCount}</span>.
        Positioning confidence:{" "}
        <span className="font-medium text-ink">{summary.positioningConfidence}</span>
        .
      </p>
      {summary.themeCoverageGaps.length > 0 ? (
        <p className="mt-3 text-xs text-amber-900">
          Theme gaps on scored volumes: {summary.themeCoverageGaps.join(", ")}.
        </p>
      ) : (
        <p className="mt-3 text-xs text-emerald-800">
          Active themes cover Experience, Solution, and Risk.
        </p>
      )}
    </Card>
  );
}

import { Card } from "@/components/ui/Card";
import type { VendorInterviewReadinessSummary } from "@/types";

export function VendorInterviewSummaryCard(props: {
  summary: VendorInterviewReadinessSummary;
}) {
  const { summary } = props;
  return (
    <Card className="space-y-2 border-amber-200/80 bg-amber-50/40 p-4">
      <h3 className="text-sm font-semibold text-ink">Interview readiness</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-muted sm:grid-cols-3">
        <div>
          <dt className="text-ink-subtle">P1 total</dt>
          <dd className="font-medium text-ink">{summary.p1Total}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">P1 unanswered</dt>
          <dd className="font-medium text-amber-900">{summary.p1Unanswered}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">P1 follow-up</dt>
          <dd className="font-medium text-amber-900">{summary.p1NeedsFollowUp}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Unresolved P1</dt>
          <dd className="font-medium text-ink">{summary.unresolvedP1}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Avg answer quality (0–5)</dt>
          <dd className="font-medium text-ink">
            {summary.avgScore != null ? summary.avgScore.toFixed(2) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Low-quality answers (≤2)</dt>
          <dd className="font-medium text-ink">{summary.lowQualityCount}</dd>
        </div>
      </dl>
    </Card>
  );
}

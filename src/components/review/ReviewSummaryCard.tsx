import { Card } from "@/components/ui/Card";
import { issueSummary } from "@/lib/review-utils";
import type { ReviewIssue } from "@/types";

type ReviewSummaryCardProps = {
  issues: ReviewIssue[];
  title: string;
  subtitle?: string;
};

export function ReviewSummaryCard({
  issues,
  title,
  subtitle,
}: ReviewSummaryCardProps) {
  const s = issueSummary(issues);

  return (
    <Card className="border-zinc-400/20 bg-zinc-50/60 p-5">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {subtitle ? (
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{subtitle}</p>
      ) : null}
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-muted">Active findings</dt>
          <dd className="font-semibold text-ink">{s.active}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Critical</dt>
          <dd className="font-semibold text-ink">{s.critical}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Resolved</dt>
          <dd className="font-semibold text-ink">{s.resolved}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Submission blockers</dt>
          <dd className="font-semibold text-ink">{s.submissionBlockers}</dd>
        </div>
      </dl>
    </Card>
  );
}

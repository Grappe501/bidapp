import { Card } from "@/components/ui/Card";
import { ReviewStatusBadge, SeverityBadge } from "@/components/review/ReviewIssueBadge";
import type { ReviewIssue } from "@/types";

export function ReviewIssueDetailCard({ issue }: { issue: ReviewIssue }) {
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">{issue.title}</h1>
          <p className="mt-1 text-xs text-ink-muted">
            {issue.issueType} · {issue.entityType}{" "}
            <code className="rounded bg-zinc-100 px-1">{issue.entityId}</code>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={issue.severity} />
          <ReviewStatusBadge status={issue.status} />
        </div>
      </div>
      <div>
        <h2 className="text-xs font-semibold text-ink-subtle">Why it matters</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {issue.description}
        </p>
      </div>
      <div>
        <h2 className="text-xs font-semibold text-ink-subtle">Suggested fix</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">{issue.suggestedFix}</p>
      </div>
      {issue.resolutionNotes ? (
        <div className="rounded-md border border-border bg-zinc-50/50 px-3 py-2">
          <h2 className="text-xs font-semibold text-ink-subtle">Notes</h2>
          <p className="mt-1 text-sm text-ink-muted">{issue.resolutionNotes}</p>
        </div>
      ) : null}
    </Card>
  );
}

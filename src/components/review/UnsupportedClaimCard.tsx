import { Card } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/review/ReviewIssueBadge";
import type { ReviewIssue } from "@/types";

type UnsupportedClaimCardProps = {
  issues: ReviewIssue[];
};

export function UnsupportedClaimCard({ issues }: UnsupportedClaimCardProps) {
  const rows = issues.filter(
    (i) =>
      i.issueType === "Unsupported Claim" &&
      (i.status === "Open" || i.status === "In Review"),
  );

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Unsupported claims</h2>
      <p className="text-xs text-ink-muted">
        Draft metadata flags, grounding policy gaps, and grounded prose review (excerpt +
        fix when available).
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No open unsupported-claim issues.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.slice(0, 10).map((i) => {
            const ex = i.groundedContext?.claimExcerpt?.trim();
            const body = ex || i.description.slice(0, 220);
            return (
              <li
                key={i.id}
                className="rounded-md border border-zinc-200/90 bg-zinc-50/80 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={i.severity} />
                  <span className="font-medium text-ink">{i.title}</span>
                </div>
                <p className="mt-1 text-xs leading-snug text-ink">{body}</p>
                {i.groundedContext?.proseReviewNote ? (
                  <p className="mt-1 text-[11px] text-ink-muted">
                    <span className="font-medium text-ink-subtle">Why:</span>{" "}
                    {i.groundedContext.proseReviewNote.slice(0, 200)}
                  </p>
                ) : null}
                {i.suggestedFix ? (
                  <p className="mt-1 text-[11px] text-ink-muted">
                    <span className="font-medium text-ink-subtle">Fix:</span>{" "}
                    {i.suggestedFix.slice(0, 200)}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

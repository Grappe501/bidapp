import { Card } from "@/components/ui/Card";
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
        From draft metadata flags and grounding policy violations.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No open unsupported-claim issues.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.slice(0, 8).map((i) => (
            <li key={i.id} className="rounded-md bg-zinc-50/80 px-3 py-2 text-ink-muted">
              <span className="font-medium text-ink">{i.title}</span>
              <span className="mt-1 block text-xs">{i.description.slice(0, 160)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

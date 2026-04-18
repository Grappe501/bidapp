import { Card } from "@/components/ui/Card";
import type { ReviewIssue } from "@/types";

type ContractExposureCardProps = {
  issues: ReviewIssue[];
};

export function ContractExposureCard({ issues }: ContractExposureCardProps) {
  const rows = issues.filter(
    (i) =>
      (i.issueType === "Contract Exposure" ||
        i.issueType === "Architecture Risk") &&
      (i.status === "Open" || i.status === "In Review"),
  );

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Contract &amp; architecture exposure</h2>
      <p className="text-xs text-ink-muted">
        High-stakes language and flow-down posture flagged by rules.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No open exposure issues.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((i) => (
            <li
              key={i.id}
              className="rounded-md border border-zinc-200 px-3 py-2"
            >
              <span className="font-medium text-ink">{i.title}</span>
              <span className="mt-1 block text-xs text-ink-muted">
                {i.severity} ·{" "}
                {i.description.length > 140
                  ? `${i.description.slice(0, 140)}…`
                  : i.description}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

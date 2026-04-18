import { Card } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/review/ReviewIssueBadge";
import type { ReviewIssue } from "@/types";

const CONTRACT_SENSITIVE_RE =
  /\b(sla|security|hipaa|phi|pii|breach|compliance|certif|contract|binding|warrant|indemnif|penalt|delivery|deadline|availability|uptime|integration|interface|api|commit|guarantee)\b/i;

type ContractExposureCardProps = {
  issues: ReviewIssue[];
};

function isContractAdjacent(i: ReviewIssue): boolean {
  if (i.issueType === "Contract Exposure" || i.issueType === "Architecture Risk") {
    return true;
  }
  if (i.issueType === "Draft Contradiction") {
    return CONTRACT_SENSITIVE_RE.test(
      `${i.title} ${i.description} ${i.groundedContext?.claimExcerpt ?? ""} ${i.groundedContext?.conflictsWith ?? ""}`,
    );
  }
  if (i.issueType === "Unsupported Claim") {
    return (
      i.severity === "Critical" ||
      i.severity === "High" ||
      CONTRACT_SENSITIVE_RE.test(
        `${i.description} ${i.groundedContext?.claimExcerpt ?? ""}`,
      )
    );
  }
  return false;
}

export function ContractExposureCard({ issues }: ContractExposureCardProps) {
  const rows = issues.filter(
    (i) =>
      isContractAdjacent(i) &&
      (i.status === "Open" || i.status === "In Review"),
  );

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Contract &amp; commitment risk</h2>
      <p className="text-xs text-ink-muted">
        Register exposures plus grounded contradictions and high-stakes unsupported
        claims.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No open items in this lane.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map((i) => (
            <li
              key={i.id}
              className="rounded-md border border-zinc-200 px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={i.severity} />
                <span className="font-medium text-ink">{i.title}</span>
                <span className="text-[10px] text-ink-subtle">{i.issueType}</span>
              </div>
              <span className="mt-1 block text-xs text-ink-muted">
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

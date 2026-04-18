import { Card } from "@/components/ui/Card";
import { linksForRequirement } from "@/lib/evidence-utils";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";

type RequirementCoverageAuditCardProps = {
  snapshot: BidReviewSnapshot | null;
  maxList?: number;
};

export function RequirementCoverageAuditCard({
  snapshot,
  maxList = 6,
}: RequirementCoverageAuditCardProps) {
  if (!snapshot) {
    return (
      <Card className="p-4 text-sm text-ink-muted">No snapshot loaded.</Card>
    );
  }

  const mand = snapshot.requirements.filter((r) => r.mandatory);
  const gaps = mand.filter((r) => {
    const links = linksForRequirement(snapshot.evidenceLinks, r.id);
    return (
      links.length === 0 ||
      r.status === "Unresolved" ||
      r.status === "Blocked"
    );
  });

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Requirement coverage</h2>
      <p className="text-xs text-ink-muted">
        Mandatory items without links or still unresolved in the matrix.
      </p>
      {gaps.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No mandatory gaps detected by current rules.
        </p>
      ) : (
        <ul className="space-y-2 text-sm">
          {gaps.slice(0, maxList).map((r) => (
            <li
              key={r.id}
              className="rounded-md border border-amber-200/60 bg-amber-50/40 px-3 py-2"
            >
              <span className="font-medium text-ink">{r.title.slice(0, 72)}</span>
              <span className="mt-1 block text-xs text-ink-muted">
                {r.status} ·{" "}
                {linksForRequirement(snapshot.evidenceLinks, r.id).length === 0
                  ? "no evidence links"
                  : "needs status lift"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

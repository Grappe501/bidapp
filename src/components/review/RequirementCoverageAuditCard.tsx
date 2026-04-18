import { Card } from "@/components/ui/Card";
import { linksForRequirement } from "@/lib/evidence-utils";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import type { Requirement } from "@/types";

type RequirementCoverageAuditCardProps = {
  snapshot: BidReviewSnapshot | null;
  maxList?: number;
};

function proofCounts(snapshot: BidReviewSnapshot) {
  const proof = snapshot.requirementProofById;
  if (!proof || Object.keys(proof).length === 0) return null;
  let strong = 0;
  let partial = 0;
  let weak = 0;
  let none = 0;
  for (const s of Object.values(proof)) {
    if (s.level === "strong") strong++;
    else if (s.level === "partial") partial++;
    else if (s.level === "weak") weak++;
    else none++;
  }
  return { strong, partial, weak, none, proof };
}

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
  const pc = proofCounts(snapshot);

  const legacyGaps = mand.filter((r) => {
    const links = linksForRequirement(snapshot.evidenceLinks, r.id);
    return (
      links.length === 0 ||
      r.status === "Unresolved" ||
      r.status === "Blocked"
    );
  });

  const proofGaps: Requirement[] = pc
    ? mand.filter((r) => {
        const s = pc.proof[r.id];
        return !s || s.level === "none" || s.level === "weak";
      })
    : [];

  const topGaps = (pc ? proofGaps : legacyGaps).slice(0, maxList);

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Requirement coverage</h2>
      <p className="text-xs text-ink-muted">
        {pc
          ? "Mandatory requirements vs. merged proof-graph support from attached grounding bundles."
          : "Mandatory items without links or still unresolved — attach bundles with requirementSupport or link evidence in the matrix."}
      </p>
      {pc ? (
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-md border border-emerald-200/80 bg-emerald-50/40 px-2 py-1.5">
            <p className="font-semibold tabular-nums text-ink">{pc.strong}</p>
            <p className="text-ink-subtle">Strong</p>
          </div>
          <div className="rounded-md border border-sky-200/80 bg-sky-50/40 px-2 py-1.5">
            <p className="font-semibold tabular-nums text-ink">{pc.partial}</p>
            <p className="text-ink-subtle">Partial</p>
          </div>
          <div className="rounded-md border border-amber-200/80 bg-amber-50/40 px-2 py-1.5">
            <p className="font-semibold tabular-nums text-ink">{pc.weak}</p>
            <p className="text-ink-subtle">Weak</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-zinc-50/80 px-2 py-1.5">
            <p className="font-semibold tabular-nums text-ink">{pc.none}</p>
            <p className="text-ink-subtle">No proof</p>
          </div>
        </div>
      ) : null}
      {topGaps.length === 0 ? (
        <p className="text-sm text-ink-muted">
          {pc
            ? "No mandatory weak/no-proof gaps in merged proof graph."
            : "No mandatory matrix gaps detected by legacy rules."}
        </p>
      ) : (
        <ul className="space-y-2 text-sm">
          {topGaps.map((r) => {
            const p = pc?.proof[r.id];
            const subtitle = p
              ? `Proof: ${p.level} · V${p.validation_mix.verified} VC${p.validation_mix.vendor_claim} U${p.validation_mix.unverified}`
              : `${r.status} · ${linksForRequirement(snapshot.evidenceLinks, r.id).length === 0 ? "no evidence links" : "needs status lift"}`;
            return (
              <li
                key={r.id}
                className="rounded-md border border-amber-200/60 bg-amber-50/40 px-3 py-2"
              >
                <span className="font-medium text-ink">{r.title.slice(0, 72)}</span>
                <span className="mt-1 block text-xs text-ink-muted">{subtitle}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

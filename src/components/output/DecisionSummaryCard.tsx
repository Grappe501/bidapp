import { Card } from "@/components/ui/Card";
import type { VendorDecisionSynthesis } from "@/types";
import { DecisionConfidenceBadge } from "./DecisionConfidenceBadge";

function labelForVendor(
  synthesis: VendorDecisionSynthesis,
  nameById: Record<string, string> | undefined,
): string | undefined {
  const id = synthesis.recommendedVendorId;
  if (!id) return undefined;
  if (nameById?.[id]) return nameById[id];
  return id;
}

export function DecisionSummaryCard(props: {
  synthesis: VendorDecisionSynthesis | null | undefined;
  /** Optional map vendor id → display name for the recommended row. */
  vendorNameById?: Record<string, string>;
}) {
  const { synthesis, vendorNameById } = props;
  if (!synthesis) {
    return (
      <Card className="space-y-2 border-zinc-200/80 bg-zinc-50/30 p-4">
        <h2 className="text-sm font-semibold text-ink">Decision synthesis</h2>
        <p className="text-xs text-ink-muted">
          Run vendor comparison (or wait for competitor analysis to load) to see a unified decision
          narrative.
        </p>
      </Card>
    );
  }

  const leadName = labelForVendor(synthesis, vendorNameById);

  return (
    <Card className="space-y-3 border-zinc-200/90 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Decision synthesis</h2>
        <DecisionConfidenceBadge confidence={synthesis.confidence} />
      </div>
      <p className="text-[11px] uppercase tracking-wide text-ink-subtle">
        {synthesis.recommendationType.replace(/_/g, " ")}
        {leadName ? ` · ${leadName}` : ""}
        {synthesis.overallScore != null ? ` · score ${synthesis.overallScore}` : ""}
      </p>
      <p className="text-sm leading-relaxed text-ink">{synthesis.decisionRationale}</p>
      <div className="grid gap-2 text-xs text-ink-muted sm:grid-cols-2">
        <div>
          <span className="font-medium text-ink">Pricing</span> — {synthesis.pricingAssessment}
        </div>
        <div>
          <span className="font-medium text-ink">Role fit</span> — {synthesis.roleFitAssessment}
        </div>
        <div>
          <span className="font-medium text-ink">Failure resilience</span> —{" "}
          {synthesis.failureResilience}
        </div>
        <div>
          <span className="font-medium text-ink">Malone dependency</span> —{" "}
          {synthesis.maloneDependency}
        </div>
        <div>
          <span className="font-medium text-ink">Claims</span> — {synthesis.claimConfidence}
        </div>
        <div>
          <span className="font-medium text-ink">Interview</span> — {synthesis.interviewReadiness}
        </div>
      </div>
      {synthesis.keyStrengths.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Strengths
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-ink">
            {synthesis.keyStrengths.slice(0, 5).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {synthesis.keyWeaknesses.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Weaknesses
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-amber-950/90">
            {synthesis.keyWeaknesses.slice(0, 5).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {synthesis.recommendedVendorStackIds && synthesis.recommendedVendorStackIds.length > 1 && (
        <p className="text-[11px] text-ink-muted">
          Multi-vendor stack:{" "}
          {synthesis.recommendedVendorStackIds.map((id) => vendorNameById?.[id] ?? id).join(", ")}
        </p>
      )}
    </Card>
  );
}

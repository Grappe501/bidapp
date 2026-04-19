import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { FinalReadinessGate } from "@/types";

export function FinalReadinessGateCard({ gate }: { gate: FinalReadinessGate }) {
  const tone =
    gate.overallState === "ready_to_submit"
      ? "success"
      : gate.overallState === "ready_with_risk"
        ? "risk"
        : gate.overallState === "blocked"
          ? "blocked"
          : "warn";

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 ring-1 ring-inset",
        tone === "success" && "ring-emerald-300/50 bg-emerald-50/20",
        tone === "risk" && "ring-amber-300/50 bg-amber-50/25",
        tone === "warn" && "ring-amber-200/60 bg-amber-50/15",
        tone === "blocked" && "ring-zinc-400/50 bg-zinc-50/95",
      )}
    >
      <div className="border-b border-border/60 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
          Final readiness gate · can we submit?
        </p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-ink">
          {gate.submissionRecommendation}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-subtle">
          State: {gate.overallState.replace(/_/g, " ")}
        </p>
      </div>

      <div className="grid gap-px bg-border/80 sm:grid-cols-2 lg:grid-cols-3">
        <GateBool label="Required artifacts" ok={gate.requiredArtifactsComplete} />
        <GateBool label="Pricing structure" ok={gate.pricingReady} />
        <GateBool label="Contract posture" ok={gate.contractReady} />
        <GateBool label="Grounding / proof" ok={gate.groundedReviewReady} />
        <GateBool label="Unsupported claims" ok={gate.unsupportedClaimsResolved} />
        <GateBool label="Risk mitigations" ok={gate.criticalRisksAddressed} />
        <GateBool label="Evaluator viability" ok={gate.evaluatorScoreViable} />
        <GateBool label="Redaction posture" ok={gate.redactionReady} />
        {gate.technicalProposalPacket?.applicable ? (
          <GateBool
            label="Technical Proposal Packet"
            ok={gate.technicalProposalPacket.readyForPacketAssembly}
          />
        ) : null}
        {gate.arbuySolicitation?.applicable ? (
          <GateBool label="ARBuy solicitation" ok={gate.arbuySolicitation.ready} />
        ) : null}
        <GateBool label="Vendor / stack decision" ok={gate.vendorStrategyViable} />
        <div className="bg-white px-4 py-3">
          <p className="text-xs font-semibold text-ink">Hard blockers</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {gate.blockerCount}
          </p>
        </div>
      </div>

      {gate.blockers.length > 0 && (
        <div className="border-t border-border/60 bg-white px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Blockers
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink">
            {gate.blockers.map((b) => (
              <li key={b.slice(0, 64)}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {gate.warnings.length > 0 && (
        <div className="border-t border-border/60 bg-zinc-50/50 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Warnings
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-muted">
            {gate.warnings.map((w) => (
              <li key={w.slice(0, 64)}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {gate.requiredActionsBeforeSubmit.length > 0 && (
        <div className="border-t border-border/60 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Required actions before submit
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {gate.requiredActionsBeforeSubmit.map((a) => (
              <li key={a.slice(0, 48)} className="flex gap-2">
                <span className="text-emerald-800" aria-hidden>
                  →
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function GateBool({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
        {label}
      </p>
      <p className={cn("mt-1 text-sm font-semibold", ok ? "text-emerald-900" : "text-amber-900")}>
        {ok ? "Pass" : "Gap"}
      </p>
    </div>
  );
}

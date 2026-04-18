import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { FinalValidationGateResult } from "@/lib/submission-utils";
import type { ReadinessScore } from "@/types";

export function SubmissionGateCard({
  gate,
  readiness,
  checklistComplete,
  criticalOpenCount,
  missingArtifactsCount,
  redactionUnresolved,
}: {
  gate: FinalValidationGateResult;
  readiness: ReadinessScore;
  checklistComplete: boolean;
  criticalOpenCount: number;
  missingArtifactsCount: number;
  redactionUnresolved: number;
}) {
  const pass = gate.status === "PASS";

  return (
    <Card
      className={cn(
        "p-6 ring-1 ring-inset",
        pass ? "ring-emerald-200/90 bg-emerald-50/25" : "ring-amber-200/90 bg-amber-50/30",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
            Final validation gate
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">
            {pass ? "PASS" : "FAIL"}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-muted">
            {pass
              ? "Execution steps from ARBuy onward may proceed after client approval and runbook discipline."
              : "Submission execution is frozen until every blocker below is cleared."}
          </p>
        </div>
        <div className="rounded-lg bg-white/60 px-4 py-3 text-center shadow-sm">
          <p className="text-xs text-ink-subtle">Readiness</p>
          <p className="text-3xl font-semibold tabular-nums text-ink">
            {readiness.overall}
          </p>
        </div>
      </div>

      <ul className="mt-6 grid gap-2 text-xs sm:grid-cols-2">
        <li className="flex justify-between gap-2 rounded-md bg-white/50 px-3 py-2">
          <span className="text-ink-muted">Submission checklist</span>
          <span className="font-medium text-ink">
            {checklistComplete ? "Complete" : "Gaps"}
          </span>
        </li>
        <li className="flex justify-between gap-2 rounded-md bg-white/50 px-3 py-2">
          <span className="text-ink-muted">Critical issues open</span>
          <span className="font-medium text-ink">{criticalOpenCount}</span>
        </li>
        <li className="flex justify-between gap-2 rounded-md bg-white/50 px-3 py-2">
          <span className="text-ink-muted">Required artifacts</span>
          <span className="font-medium text-ink">
            {missingArtifactsCount === 0 ? "Validated" : `${missingArtifactsCount} open`}
          </span>
        </li>
        <li className="flex justify-between gap-2 rounded-md bg-white/50 px-3 py-2">
          <span className="text-ink-muted">Redaction flags</span>
          <span className="font-medium text-ink">{redactionUnresolved} open</span>
        </li>
      </ul>

      {!pass && gate.blockers.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-medium text-ink">Blockers</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-ink-muted">
            {gate.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}

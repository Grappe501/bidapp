import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { ReadinessScore } from "@/types";

export function FinalReadinessBundleCard({
  readiness,
  clientSignOffReady,
  submissionAssemblyReady,
  blockedReasons,
}: {
  readiness: ReadinessScore;
  clientSignOffReady: boolean;
  submissionAssemblyReady: boolean;
  blockedReasons: string[];
}) {
  return (
    <Card
      className={cn(
        "p-6 ring-1 ring-inset",
        blockedReasons.length
          ? "ring-amber-200/90 bg-amber-50/30"
          : "ring-emerald-200/80 bg-emerald-50/20",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
        Final decision
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-ink-muted">Client sign-off readiness</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {clientSignOffReady ? "Ready" : "Not ready"}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Submission assembly readiness</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {submissionAssemblyReady ? "Ready" : "Blocked"}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink-muted">
        Overall readiness score:{" "}
        <span className="font-semibold tabular-nums text-ink">
          {readiness.overall}
        </span>
      </p>
      {blockedReasons.length > 0 ? (
        <ul className="mt-4 list-inside list-disc space-y-1 text-xs text-ink">
          {blockedReasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-emerald-900">
          No blocking items surfaced in this bundle. Proceed with executive review
          and manual ARBuy assembly.
        </p>
      )}
    </Card>
  );
}

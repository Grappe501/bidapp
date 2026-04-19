import { Card } from "@/components/ui/Card";
import type { EvaluatorSimulationResult } from "@/types";

export function ClientEvaluatorBrief({
  result,
}: {
  result: EvaluatorSimulationResult;
}) {
  const t = result.technical;
  const scored = [t.experience, t.solution, t.risk, t.interview];
  const strongest = scored.reduce((a, b) => (a.rawScore >= b.rawScore ? a : b));
  return (
    <Card className="border-zinc-200/90 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
        Evaluator view (summary)
      </p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
        Likely scoring posture
      </h2>
      <p className="mt-1 text-xs text-ink-muted">
        Simulation only — emphasizes proof and consistency, not prose polish. Cost competitiveness vs
        other bidders is not modeled.
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-zinc-50/50 px-3 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Technical total (est.)
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
            {t.totalTechnicalScore.toFixed(0)} / 700
          </dd>
        </div>
        <div className="rounded-lg border border-border bg-zinc-50/50 px-3 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Grand total (est.)
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-ink">
            {result.grandTotalScore.toFixed(0)} / 1,000
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2 text-sm text-ink">
        <p>
          <span className="font-medium text-ink">Relatively strongest volume: </span>
          {strongest.section} (~{strongest.rawScore.toFixed(1)}/10 reliability band in this model).
        </p>
        <p>
          <span className="font-medium text-ink">Largest scoring risk: </span>
          {result.topPointLossDrivers[0] ?? "Proof depth vs narrative confidence."}
        </p>
      </div>

      <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-ink-muted">
        {result.topPointLossDrivers.slice(0, 3).map((x) => (
          <li key={x.slice(0, 40)}>{x}</li>
        ))}
      </ul>
    </Card>
  );
}

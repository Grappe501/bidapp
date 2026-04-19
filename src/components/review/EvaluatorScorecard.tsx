import { Card } from "@/components/ui/Card";
import type { EvaluatorSimulationResult } from "@/types";

export function EvaluatorScorecard({
  result,
  compact = false,
}: {
  result: EvaluatorSimulationResult;
  compact?: boolean;
}) {
  const t = result.technical;
  const rows = [
    { label: "Experience (30%)", score: t.experience },
    { label: "Solution (30%)", score: t.solution },
    { label: "Risk (10%)", score: t.risk },
    { label: "Interview (30%)", score: t.interview },
    { label: "Cost (30% of grand total)", score: result.cost },
  ];

  const assessmentLabel: Record<EvaluatorSimulationResult["overallAssessment"], string> = {
    strong: "Strong competitive posture (simulation)",
    competitive: "Competitive / credible (simulation)",
    fragile: "Fragile — likely losing points in key areas",
    not_ready: "Not ready — major scoring risk",
  };

  return (
    <Card className="border-zinc-200/90 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
            Evaluator POV · Arkansas weighting
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
            Scoring simulation (700 technical + 300 cost)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
            Interpretive model aligned to 10 / 5 / 0 reliability bands — not a prediction of outcome.
            Polished prose without proof scores lower. Market cost position is not modeled.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Posture
          </p>
          <p className="text-sm font-semibold text-ink">
            {assessmentLabel[result.overallAssessment]}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50/90 text-xs text-ink-subtle">
              <th className="px-3 py-2 font-medium">Section</th>
              <th className="px-3 py-2 font-medium">Reliability (0–10)</th>
              <th className="px-3 py-2 font-medium">Weighted pts</th>
              <th className="px-3 py-2 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border/80">
                <td className="px-3 py-2.5 text-ink">{row.label}</td>
                <td className="px-3 py-2.5 tabular-nums text-ink-muted">
                  {row.score.rawScore.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 tabular-nums font-medium text-ink">
                  {row.score.weightedScore.toFixed(0)}
                </td>
                <td className="px-3 py-2.5 text-xs capitalize text-ink-muted">
                  {row.score.confidence}
                </td>
              </tr>
            ))}
            <tr className="bg-zinc-50/50 font-medium">
              <td className="px-3 py-2.5 text-ink">Technical total</td>
              <td className="px-3 py-2.5 text-ink-muted">—</td>
              <td className="px-3 py-2.5 tabular-nums text-ink">
                {t.totalTechnicalScore.toFixed(0)}
              </td>
              <td className="px-3 py-2.5 text-xs text-ink-muted">—</td>
            </tr>
            <tr className="font-semibold">
              <td className="px-3 py-2.5 text-ink">Grand total (est.)</td>
              <td className="px-3 py-2.5 text-ink-muted">—</td>
              <td className="px-3 py-2.5 tabular-nums text-ink">
                {result.grandTotalScore.toFixed(0)} / 1,000
              </td>
              <td className="px-3 py-2.5 text-xs text-ink-muted">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      {!compact && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Likely point-loss drivers
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-ink-muted">
              {result.topPointLossDrivers.slice(0, 5).map((x, i) => (
                <li key={`loss-${i}`}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Upgrade actions
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-relaxed text-ink-muted">
              {result.topUpgradeActions.slice(0, 5).map((x, i) => (
                <li key={`up-${i}`}>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}

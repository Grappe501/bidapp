import type { ScoringCategory } from "@/types";
import { SCORING_TOTAL_POINTS } from "@/data/mockScoringModel";

type SectionScoreBreakdownProps = {
  categories: ScoringCategory[];
};

export function SectionScoreBreakdown({ categories }: SectionScoreBreakdownProps) {
  const max = Math.max(...categories.map((c) => c.maxPoints), 1);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-ink">Points at stake</h3>
      <p className="text-xs text-ink-muted">
        Total evaluation model: {SCORING_TOTAL_POINTS} points. Wider bars carry
        more score risk in oral defense and cost realism.
      </p>
      <ul className="space-y-3">
        {categories.map((c) => {
          const pct = (c.maxPoints / max) * 100;
          const isCost = c.name === "Cost";
          return (
            <li key={c.id} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-ink">{c.name}</span>
                <span className="tabular-nums text-ink-muted">
                  {c.maxPoints} pts
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={
                    isCost
                      ? "h-full rounded-full bg-zinc-900"
                      : "h-full rounded-full bg-zinc-500"
                  }
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

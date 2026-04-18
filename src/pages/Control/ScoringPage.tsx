import { BidControlNav } from "@/components/control/BidControlNav";
import { ScoringModelCard } from "@/components/control/ScoringModelCard";
import { SectionConstraintCard } from "@/components/control/SectionConstraintCard";
import { SectionScoreBreakdown } from "@/components/control/SectionScoreBreakdown";
import { Card } from "@/components/ui/Card";
import {
  MOCK_SCORING_CATEGORIES,
  MOCK_SECTION_CONSTRAINTS,
  SCORING_TOTAL_POINTS,
} from "@/data/mockScoringModel";

export function ScoringPage() {
  const sorted = [...MOCK_SCORING_CATEGORIES].sort(
    (a, b) => b.maxPoints - a.maxPoints,
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <BidControlNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Scoring model & section discipline
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Evaluation for S000000479 is point-driven: Experience, Solution,
            Risk, Interview, and Cost must stay internally consistent across
            volumes, oral prep, and price. Cost carries the highest weight—treat
            workbook errors as existential risk.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="space-y-2 p-5 lg:col-span-1">
            <SectionScoreBreakdown categories={MOCK_SCORING_CATEGORIES} />
          </Card>
          <div className="space-y-4 lg:col-span-2">
            {sorted.map((c) => (
              <ScoringModelCard
                key={c.id}
                category={c}
                emphasize={c.name === "Cost" || c.name === "Interview"}
              />
            ))}
            <p className="text-center text-xs text-ink-subtle">
              Model total: {SCORING_TOTAL_POINTS} points · drafting phase will map
              narrative blocks to these factors.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Section constraints</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Two-page caps on scored technical sections—every sentence competes for
            evaluability.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {MOCK_SECTION_CONSTRAINTS.map((c) => (
              <SectionConstraintCard key={c.section} constraint={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

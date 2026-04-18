import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { CompetitiveSummaryCard } from "@/components/strategy/CompetitiveSummaryCard";
import { ScoringAdvantageCard } from "@/components/strategy/ScoringAdvantageCard";
import { StrategyActionPanel } from "@/components/strategy/StrategyActionPanel";
import { StrategySubNav } from "@/components/strategy/StrategySubNav";
import { ThreatMapCard } from "@/components/strategy/ThreatMapCard";
import { useStrategy } from "@/context/useStrategy";
import { useWorkspace } from "@/context/useWorkspace";

export function StrategyOverviewPage() {
  const { project } = useWorkspace();
  const { strategicSummary, winThemes, competitors } = useStrategy();
  const topId = strategicSummary.topThreats[0]?.id;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <StrategySubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Win strategy command center
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Bid-specific competitive framing for {project.bidNumber}: who likely
            shows up, how they may score, and how Malone + partners should win on
            substance — not noise.
          </p>
        </div>

        <CompetitiveSummaryCard summary={strategicSummary} bidNumber={project.bidNumber} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Win theme status</h2>
            <p className="mt-2 text-xs text-ink-muted">
              Active / approved:{" "}
              {strategicSummary.activeWinThemes.length} of {winThemes.length}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-ink-muted">
              {strategicSummary.activeWinThemes.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <span className="font-medium text-ink">P{t.priority}</span> {t.title}
                </li>
              ))}
            </ul>
            <Link
              to="/strategy/win-themes"
              className="mt-3 inline-block text-xs font-medium text-ink underline-offset-2 hover:underline"
            >
              Edit themes →
            </Link>
          </Card>
          <ScoringAdvantageCard summary={strategicSummary} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ThreatMapCard threats={strategicSummary.topThreats} />
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Evaluator concerns (snapshot)</h2>
            <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-ink-muted">
              {strategicSummary.majorEvaluatorConcerns.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <Link
              to="/strategy/evaluator-lens"
              className="mt-3 inline-block text-xs font-medium text-ink underline-offset-2 hover:underline"
            >
              Full lenses →
            </Link>
          </Card>
        </div>

        <StrategyActionPanel summary={strategicSummary} topCompetitorId={topId} />

        <p className="text-xs text-ink-subtle">
          {competitors.length} competitor archetypes in workspace — refine with sourced
          intelligence as it becomes available.
        </p>
      </div>
    </div>
  );
}

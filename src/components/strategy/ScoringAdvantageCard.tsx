import { Card } from "@/components/ui/Card";
import type { StrategicSummary } from "@/lib/strategy-utils";

export function ScoringAdvantageCard({ summary }: { summary: StrategicSummary }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink">Scoring advantage view</h3>
      <p className="mt-2 text-xs text-ink-muted">
        Advisory only — where disciplined narrative and evidence can earn separation.
      </p>
      <ul className="mt-4 space-y-2 text-xs text-ink-muted">
        {summary.strongestDifferentiators.map((d) => (
          <li key={d.id}>
            <span className="font-medium text-ink">{d.category}</span>: {d.title} —{" "}
            <span className="text-ink-subtle">{d.strength}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-ink-subtle">
        Win themes carrying multiple volumes:{" "}
        {summary.activeWinThemes.filter((t) => t.targetSections.length >= 4).length}{" "}
        active.
      </p>
    </Card>
  );
}

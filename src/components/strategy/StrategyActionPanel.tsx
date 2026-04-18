import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { StrategicSummary } from "@/lib/strategy-utils";

export function StrategyActionPanel({
  summary,
  topCompetitorId,
}: {
  summary: StrategicSummary;
  topCompetitorId?: string;
}) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink">Suggested next moves</h3>
      <ul className="mt-3 list-inside list-decimal space-y-2 text-xs text-ink-muted">
        <li>
          Review top threat profile
          {topCompetitorId ? (
            <>
              :{" "}
              <Link
                to={`/strategy/competitors/${encodeURIComponent(topCompetitorId)}`}
                className="font-medium text-ink underline-offset-2 hover:underline"
              >
                open detail
              </Link>
            </>
          ) : null}
        </li>
        <li>
          <Link to="/strategy/win-themes" className="text-ink underline-offset-2 hover:underline">
            Align win themes
          </Link>{" "}
          across Experience / Solution / Risk
          {summary.themeCoverageGaps.length
            ? ` (gaps: ${summary.themeCoverageGaps.join(", ")})`
            : ""}
        </li>
        <li>
          <Link
            to="/strategy/differentiation"
            className="text-ink underline-offset-2 hover:underline"
          >
            Stress-test differentiation matrix
          </Link>{" "}
          against evaluator lenses.
        </li>
        <li>
          <Link
            to="/strategy/evaluator-lens"
            className="text-ink underline-offset-2 hover:underline"
          >
            Re-read evaluator lenses
          </Link>{" "}
          before interview prep.
        </li>
      </ul>
    </Card>
  );
}

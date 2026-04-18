import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { ClientNextAction } from "@/lib/client-review-utils";
import type { ArchitectureOption, ReadinessScore } from "@/types";

/**
 * Top-of-page client review packet summary — presentation-oriented, not an internal dashboard tile.
 */
export function ClientReviewSummaryCard({
  bidNumber,
  projectTitle,
  readiness,
  readinessHeadlineText,
  recommendedOption,
  vendorStrategyLine,
  watchouts,
  nextActions,
}: {
  bidNumber: string;
  projectTitle: string;
  readiness: ReadinessScore;
  readinessHeadlineText: string;
  recommendedOption: ArchitectureOption | undefined;
  /** One-line Malone + stack posture for executives */
  vendorStrategyLine: string;
  watchouts: string[];
  nextActions: ClientNextAction[];
}) {
  return (
    <Card className="overflow-hidden border-zinc-200/90 p-0 shadow-sm">
      <div className="border-b border-border bg-gradient-to-b from-zinc-50/95 to-white px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-subtle">
          Client review packet · executive summary
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          {bidNumber}
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-muted">
          {projectTitle}
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
              Readiness
            </p>
            <p className="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight text-ink">
              {readiness.overall}
              <span className="text-lg font-medium text-ink-subtle">/100</span>
            </p>
          </div>
          <p className="max-w-xl flex-1 text-sm leading-relaxed text-ink">
            {readinessHeadlineText}
          </p>
        </div>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2">
        <div className="bg-white px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Strategic recommendation
          </p>
          <p className="mt-2 text-sm font-semibold leading-snug text-ink">
            {recommendedOption?.name ?? "Select a recommended option in Architecture"}
          </p>
          {recommendedOption?.summary ? (
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              {recommendedOption.summary}
            </p>
          ) : null}
          <Link
            to="/architecture"
            className="mt-3 inline-block text-xs font-medium text-ink underline-offset-2 hover:underline"
          >
            Open architecture workspace →
          </Link>
        </div>
        <div className="bg-white px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Primary vendor strategy
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink">{vendorStrategyLine}</p>
          <Link
            to="/vendors"
            className="mt-3 inline-block text-xs font-medium text-ink underline-offset-2 hover:underline"
          >
            Vendor roster →
          </Link>
        </div>
      </div>

      <div className="grid gap-px bg-border lg:grid-cols-2">
        <div className="bg-white px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Top watchouts
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-snug text-ink">
            {watchouts.map((w, i) => (
              <li key={i} className="text-ink">
                <span className="text-ink">{w}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-white px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Next actions
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-snug text-ink">
            {nextActions.map((a) => (
              <li key={a.id} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                <span>{a.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

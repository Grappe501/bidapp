import { Card } from "@/components/ui/Card";
import type { NarrativeAlignmentResult } from "@/types";
import { NarrativeMisalignmentTable } from "./NarrativeMisalignmentTable";

function stateLabel(s: NarrativeAlignmentResult["overallAlignment"]): string {
  switch (s) {
    case "strong":
      return "Strong — one coherent strategic story";
    case "acceptable":
      return "Acceptable — minor drift; tighten before lock";
    case "drifting":
      return "Drifting — sections diverge on vendor, risk, or pricing posture";
    case "misaligned":
      return "Misaligned — contradictions across volumes";
    default:
      return s;
  }
}

export function NarrativeAlignmentCard(props: {
  result: NarrativeAlignmentResult;
}) {
  const { result } = props;
  const tone =
    result.overallAlignment === "strong"
      ? "border-emerald-200/80 bg-emerald-50/30"
      : result.overallAlignment === "acceptable"
        ? "border-amber-200/80 bg-amber-50/25"
        : "border-rose-200/80 bg-rose-50/20";

  const topSections = Object.entries(result.sectionScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4)
    .map(([k, v]) => `${k.replace(/_/g, " ")} (${Math.round(v)})`);

  return (
    <Card className={`space-y-3 p-4 ${tone}`}>
      <div>
        <h2 className="text-sm font-semibold text-ink">Narrative alignment</h2>
        <p className="mt-1 text-xs text-ink-muted">{stateLabel(result.overallAlignment)}</p>
      </div>
      {topSections.length > 0 ? (
        <p className="text-[11px] text-ink-muted">
          Lowest section scores: {topSections.join(" · ")}
        </p>
      ) : null}
      {result.correctiveActions.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Top corrections
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-ink">
            {result.correctiveActions.slice(0, 5).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.criticalMisalignments.length > 0 ? (
        <NarrativeMisalignmentTable items={result.criticalMisalignments.slice(0, 8)} title="Priority issues" />
      ) : null}
      {result.warnings.length > 0 ? (
        <NarrativeMisalignmentTable
          items={result.warnings.slice(0, 8)}
          title="Other alignment notes"
          emptyLabel=""
        />
      ) : null}
    </Card>
  );
}

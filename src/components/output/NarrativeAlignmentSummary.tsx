import { Card } from "@/components/ui/Card";
import type { NarrativeAlignmentResult } from "@/types";

export function NarrativeAlignmentSummary(props: {
  result: NarrativeAlignmentResult;
  /** Shorter copy for client review. */
  compact?: boolean;
}) {
  const { result, compact } = props;
  return (
    <Card className="space-y-2 border-zinc-200/90 bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">Strategic story coherence</h2>
      <p className="text-xs text-ink-muted">
        Alignment:{" "}
        <span className="font-semibold capitalize text-ink">{result.overallAlignment}</span>
        {compact
          ? " — scored volumes vs canonical spine."
          : " — Executive Summary, Solution, Risk, and Interview should reflect the same evidence-backed recommendation with appropriate tone per section."}
      </p>
      {result.correctiveActions.length > 0 && (
        <ul className="list-inside list-disc space-y-1 text-[11px] text-ink">
          {result.correctiveActions.slice(0, compact ? 3 : 6).map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

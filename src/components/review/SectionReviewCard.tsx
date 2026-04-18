import { Card } from "@/components/ui/Card";
import { useDrafting } from "@/context/useDrafting";
import { SECTION_FOCUS } from "@/lib/drafting-utils";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import type { DraftSectionType } from "@/types";

type SectionReviewCardProps = {
  snapshot: BidReviewSnapshot | null;
};

function proofHealthLine(support: Record<string, { level: string }> | undefined) {
  if (!support || Object.keys(support).length === 0) {
    return "No proof data in bundle";
  }
  let strong = 0;
  let partial = 0;
  let weak = 0;
  let none = 0;
  for (const s of Object.values(support)) {
    if (s.level === "strong") strong++;
    else if (s.level === "partial") partial++;
    else if (s.level === "weak") weak++;
    else none++;
  }
  return `Proof: ${strong} strong · ${partial} partial · ${weak} weak · ${none} none`;
}

export function SectionReviewCard({ snapshot }: SectionReviewCardProps) {
  const { getSelectedBundle } = useDrafting();

  if (!snapshot) {
    return (
      <Card className="p-4 text-sm text-ink-muted">No snapshot loaded.</Card>
    );
  }

  const scored: DraftSectionType[] = ["Experience", "Solution", "Risk"];

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Scored sections</h2>
      <p className="text-xs text-ink-muted">
        Structural checks plus grounded review signals when prose review has been run.
      </p>
      <ul className="space-y-3 text-sm">
        {snapshot.draftSections
          .filter((s) => scored.includes(s.sectionType as DraftSectionType))
          .map((s) => {
            const v = snapshot.activeDraftBySection[s.id];
            const cap =
              SECTION_FOCUS[s.sectionType as DraftSectionType]?.maxPages ?? 2;
            const pages = v?.metadata.estimatedPages;
            const bundle = getSelectedBundle(s.id)?.payload;
            const pr = snapshot.groundedProseBySectionId?.[s.id];
            const structural =
              pages != null && pages > cap + 0.05
                ? "Over page guide"
                : !v
                  ? "Not drafted"
                  : !v.groundingBundleId
                    ? "No grounding bundle"
                    : "Within guardrails";
            const actions = pr?.improvement_actions.slice(0, 3) ?? [];
            return (
              <li
                key={s.id}
                className="space-y-2 rounded-md border border-border px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-ink">{s.sectionType}</span>
                  <span className="text-xs text-ink-muted">{structural}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-ink-muted">
                  {proofHealthLine(bundle?.requirementSupport)}
                </p>
                {pr ? (
                  <div className="text-[11px] text-ink-muted">
                    <span className="font-medium text-ink">Grounded review:</span>{" "}
                    confidence {pr.confidence} · unsupported{" "}
                    {pr.unsupported_claims.length} · contradictions{" "}
                    {pr.contradictions.length}
                  </div>
                ) : (
                  <p className="text-[11px] text-ink-subtle">
                    No grounded prose review on active version — run from drafting
                    studio.
                  </p>
                )}
                {actions.length > 0 ? (
                  <ul className="list-inside list-disc text-[11px] text-ink-muted">
                    {actions.map((a) => (
                      <li key={a.slice(0, 40)}>{a}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
      </ul>
    </Card>
  );
}

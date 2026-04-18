import { Card } from "@/components/ui/Card";
import { SECTION_FOCUS } from "@/lib/drafting-utils";
import type { BidReviewSnapshot } from "@/lib/review-rules-engine";
import type { DraftSectionType } from "@/types";

type SectionReviewCardProps = {
  snapshot: BidReviewSnapshot | null;
};

export function SectionReviewCard({ snapshot }: SectionReviewCardProps) {
  if (!snapshot) {
    return (
      <Card className="p-4 text-sm text-ink-muted">No snapshot loaded.</Card>
    );
  }

  const scored: DraftSectionType[] = ["Experience", "Solution", "Risk"];

  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-sm font-semibold text-ink">Scored sections</h2>
      <ul className="space-y-2 text-sm">
        {snapshot.draftSections
          .filter((s) => scored.includes(s.sectionType as DraftSectionType))
          .map((s) => {
            const v = snapshot.activeDraftBySection[s.id];
            const cap = SECTION_FOCUS[s.sectionType as DraftSectionType]?.maxPages ?? 2;
            const pages = v?.metadata.estimatedPages;
            const risk =
              pages != null && pages > cap + 0.05
                ? "Over page guide"
                : !v
                  ? "Not drafted"
                  : !v.groundingBundleId
                    ? "No grounding bundle"
                    : "Within guardrails";
            return (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <span className="font-medium text-ink">{s.sectionType}</span>
                <span className="text-xs text-ink-muted">{risk}</span>
              </li>
            );
          })}
      </ul>
    </Card>
  );
}

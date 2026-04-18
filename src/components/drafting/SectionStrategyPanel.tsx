import { Card } from "@/components/ui/Card";
import type { DraftSectionType } from "@/types";
import {
  pointsLabel,
  scoringCategoriesForSection,
  SECTION_FOCUS,
} from "@/lib/drafting-utils";

type SectionStrategyPanelProps = {
  sectionType: DraftSectionType;
};

export function SectionStrategyPanel({
  sectionType,
}: SectionStrategyPanelProps) {
  const focus = SECTION_FOCUS[sectionType];
  const categories = scoringCategoriesForSection(sectionType);

  return (
    <Card className="space-y-3 border-zinc-400/25 bg-zinc-50/50 p-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Section strategy</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Scoring-aware, page-disciplined drafting — not freeform generation.
        </p>
      </div>
      <div className="rounded-md border border-border bg-white px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
          {sectionType}
        </p>
        <p className="mt-1 text-sm text-ink">
          Max:{" "}
          <span className="font-semibold">{focus.maxPages} pages</span>
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Focus: {focus.focus}
        </p>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-ink">Scoring emphasis</h3>
        <ul className="mt-2 space-y-2 text-xs text-ink-muted">
          {categories.map((c) => (
            <li key={c.id} className="rounded border border-border/80 bg-white px-2 py-1.5">
              <span className="font-medium text-ink">{c.name}</span> —{" "}
              {pointsLabel(c.weight)} · {c.description}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

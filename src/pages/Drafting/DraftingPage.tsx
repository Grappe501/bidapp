import { BidControlNav } from "@/components/control/BidControlNav";
import { SectionSelector } from "@/components/drafting/SectionSelector";
import { Card } from "@/components/ui/Card";
import { useDrafting } from "@/context/useDrafting";
import { MOCK_PROJECT } from "@/data/mockProject";
import { SECTION_FOCUS } from "@/lib/drafting-utils";

export function DraftingPage() {
  const { sections, getActiveVersion } = useDrafting();

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <BidControlNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Drafting studio
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Grounded, score-aware volumes for{" "}
            <span className="font-medium text-ink">{MOCK_PROJECT.bidNumber}</span>.
            Each section respects page caps and the 1000-point model — with gaps
            surfaced, not hidden.
          </p>
        </div>

        <Card className="border-zinc-400/25 bg-zinc-50/50 px-4 py-3 text-sm text-ink-muted">
          <p>
            <span className="font-medium text-ink">Constraint engine:</span>{" "}
            Experience, Solution, and Risk volumes default to{" "}
            {SECTION_FOCUS.Experience.maxPages} pages; Executive Summary{" "}
            {SECTION_FOCUS["Executive Summary"].maxPages} page. Tie narrative to
            scoring categories from{" "}
            <a href="/control/scoring" className="text-ink underline">
              Bid control → Scoring
            </a>
            .
          </p>
        </Card>

        <SectionSelector
          sections={sections}
          getActiveVersion={getActiveVersion}
        />
      </div>
    </div>
  );
}

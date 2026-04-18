import { Link } from "react-router-dom";
import { BidControlNav } from "@/components/control/BidControlNav";
import { SectionSelector } from "@/components/drafting/SectionSelector";
import { Card } from "@/components/ui/Card";
import { useDrafting } from "@/context/useDrafting";
import { MOCK_PROJECT } from "@/data/mockProject";
import { DRAFTING_COPY } from "@/lib/drafting-copy";
import { SECTION_FOCUS } from "@/lib/drafting-utils";

export function DraftingPage() {
  const { sections, getActiveVersion, getSelectedBundle } = useDrafting();

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <BidControlNav />

        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Drafting studio
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">{MOCK_PROJECT.bidNumber}</span>
            {" — "}
            {DRAFTING_COPY.studioIntro}
          </p>
        </div>

        <Card className="border-zinc-300/30 bg-zinc-50/40 px-4 py-3 text-sm text-ink-muted">
          <p className="leading-relaxed">
            <span className="font-medium text-ink">Page constraints:</span>{" "}
            Experience, Solution, and Risk share a {SECTION_FOCUS.Experience.maxPages}
            -page cap; Executive Summary {SECTION_FOCUS["Executive Summary"].maxPages}.
            Align narrative to the model in{" "}
            <Link to="/control/scoring" className="text-ink underline underline-offset-2">
              Bid control → Scoring
            </Link>
            .
          </p>
        </Card>

        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            Sections
          </h2>
          <SectionSelector
            sections={sections}
            getActiveVersion={getActiveVersion}
            getSelectedBundle={getSelectedBundle}
          />
        </section>
      </div>
    </div>
  );
}

import { Card } from "@/components/ui/Card";
import {
  CANONICAL_EXECUTIVE_SUMMARY_S000000479_BODY,
  CANONICAL_EXECUTIVE_SUMMARY_S000000479_TITLE,
  CANONICAL_EXECUTIVE_SUMMARY_S000000479_WHY_WORKS,
} from "@/data/canonical-executive-summary-s000000479";
import {
  CANONICAL_INTERVIEW_SECTION_S000000479_BODY,
  CANONICAL_INTERVIEW_SECTION_S000000479_TITLE,
  CANONICAL_INTERVIEW_SECTION_S000000479_WHY_WINS,
} from "@/data/canonical-interview-section-s000000479";
import {
  CANONICAL_RISK_SECTION_S000000479_BODY,
  CANONICAL_RISK_SECTION_S000000479_TITLE,
  CANONICAL_RISK_SECTION_S000000479_WHY_WORKS,
} from "@/data/canonical-risk-section-s000000479";
import {
  CANONICAL_SOLUTION_SECTION_S000000479_BODY,
  CANONICAL_SOLUTION_SECTION_S000000479_TITLE,
  CANONICAL_SOLUTION_SECTION_S000000479_WHY_WINS,
  S000000479_BID_NUMBER,
} from "@/data/canonical-solution-section-s000000479";
import { copyTextToClipboard } from "@/lib/output-utils";
import {
  pointsLabel,
  scoringCategoriesForSection,
  SECTION_FOCUS,
  SECTION_SCORING_LENS,
} from "@/lib/drafting-utils";
import type { DraftSectionType } from "@/types";

type SectionStrategyPanelProps = {
  sectionType: DraftSectionType;
  /** When set to S000000479 and section matches, show canonical exemplar reference. */
  bidNumber?: string;
};

export function SectionStrategyPanel({
  sectionType,
  bidNumber,
}: SectionStrategyPanelProps) {
  const focus = SECTION_FOCUS[sectionType];
  const categories = scoringCategoriesForSection(sectionType);
  const showCanonicalSolution =
    sectionType === "Solution" && bidNumber === S000000479_BID_NUMBER;
  const showCanonicalRisk =
    sectionType === "Risk" && bidNumber === S000000479_BID_NUMBER;
  const showCanonicalInterview =
    sectionType === "Interview" && bidNumber === S000000479_BID_NUMBER;
  const showCanonicalExecutiveSummary =
    sectionType === "Executive Summary" && bidNumber === S000000479_BID_NUMBER;

  const copyCanonicalSolution = () =>
    void copyTextToClipboard(
      `${CANONICAL_SOLUTION_SECTION_S000000479_TITLE}\n\n${CANONICAL_SOLUTION_SECTION_S000000479_BODY}`,
    );

  const copyCanonicalRisk = () =>
    void copyTextToClipboard(
      `${CANONICAL_RISK_SECTION_S000000479_TITLE}\n\n${CANONICAL_RISK_SECTION_S000000479_BODY}`,
    );

  const copyCanonicalInterview = () =>
    void copyTextToClipboard(
      `${CANONICAL_INTERVIEW_SECTION_S000000479_TITLE}\n\n${CANONICAL_INTERVIEW_SECTION_S000000479_BODY}`,
    );

  const copyCanonicalExecutiveSummary = () =>
    void copyTextToClipboard(
      `${CANONICAL_EXECUTIVE_SUMMARY_S000000479_TITLE}\n\n${CANONICAL_EXECUTIVE_SUMMARY_S000000479_BODY}`,
    );

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
        <p className="mt-3 border-t border-border/70 pt-3 text-xs leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">Evaluator lens:</span>{" "}
          {SECTION_SCORING_LENS[sectionType]}
        </p>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-ink">Score categories (bid model)</h3>
        <ul className="mt-2 space-y-2 text-xs text-ink-muted">
          {categories.map((c) => (
            <li key={c.id} className="rounded border border-border/80 bg-white px-2 py-1.5">
              <span className="font-medium text-ink">{c.name}</span> —{" "}
              {pointsLabel(c.weight)} · {c.description}
            </li>
          ))}
        </ul>
      </div>

      {showCanonicalSolution ? (
        <details className="rounded-md border border-emerald-200/80 bg-emerald-50/40 px-3 py-2 text-xs">
          <summary className="cursor-pointer font-medium text-ink">
            Canonical Solution exemplar (S000000479 — ~2 pages)
          </summary>
          <p className="mt-2 leading-relaxed text-ink-muted">
            Reference narrative aligned to RFP + SRV-1 + pricing. Generation also receives this for
            structure; edit the draft to match grounding and your price sheet.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-ink-subtle">
            {CANONICAL_SOLUTION_SECTION_S000000479_WHY_WINS.map((w) => (
              <li key={w.slice(0, 40)}>{w}</li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-zinc-50"
            onClick={copyCanonicalSolution}
          >
            Copy full exemplar text
          </button>
        </details>
      ) : null}

      {showCanonicalRisk ? (
        <details className="rounded-md border border-amber-200/80 bg-amber-50/40 px-3 py-2 text-xs">
          <summary className="cursor-pointer font-medium text-ink">
            Canonical Risk Management Plan exemplar (S000000479 — ~2 pages)
          </summary>
          <p className="mt-2 leading-relaxed text-ink-muted">
            Complements the Solution volume: risk → mitigation → outcome, aligned to RFP hot spots and
            SRV-1 performance / termination. Generation receives this for structure; align claims to
            grounding.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-ink-subtle">
            {CANONICAL_RISK_SECTION_S000000479_WHY_WORKS.map((w) => (
              <li key={w.slice(0, 40)}>{w}</li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-zinc-50"
            onClick={copyCanonicalRisk}
          >
            Copy full exemplar text
          </button>
        </details>
      ) : null}

      {showCanonicalInterview ? (
        <details className="rounded-md border border-sky-200/90 bg-sky-50/50 px-3 py-2 text-xs">
          <summary className="cursor-pointer font-medium text-ink">
            Canonical Interview / oral defense exemplar (S000000479 — ~2 pages)
          </summary>
          <p className="mt-2 leading-relaxed text-ink-muted">
            Reinforces Solution + Risk; defends pricing and operations under Interview scoring (~30%).
            Generation receives this for structure; keep answers consistent with written volumes.
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-ink-subtle">
            {CANONICAL_INTERVIEW_SECTION_S000000479_WHY_WINS.map((w) => (
              <li key={w.slice(0, 40)}>{w}</li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-zinc-50"
            onClick={copyCanonicalInterview}
          >
            Copy full exemplar text
          </button>
        </details>
      ) : null}

      {showCanonicalExecutiveSummary ? (
        <details className="rounded-md border border-indigo-200/90 bg-indigo-50/40 px-3 py-2 text-xs">
          <summary className="cursor-pointer font-medium text-ink">
            Canonical Executive Summary (S000000479 — 1 page)
          </summary>
          <p className="mt-2 leading-relaxed text-ink-muted">
            Sets tone for the submission: aligns with Solution, Risk, and Interview; reflects pricing
            strategy without listing numbers; RFP + SRV-1 alignment.{" "}
            <span className="italic">Why AllCare should win — in about two minutes.</span>
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-ink-subtle">
            {CANONICAL_EXECUTIVE_SUMMARY_S000000479_WHY_WORKS.map((w) => (
              <li key={w.slice(0, 40)}>{w}</li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-zinc-50"
            onClick={copyCanonicalExecutiveSummary}
          >
            Copy full exemplar text
          </button>
        </details>
      ) : null}
    </Card>
  );
}

import { S000000479_BID_NUMBER } from "../data/canonical-rfp-s000000479";
import { CANONICAL_TECHNICAL_PROPOSAL_PACKET_S000000479 } from "../data/canonical-technical-proposal-packet-s000000479";
import type { BidReviewSnapshot } from "./review-rules-engine";
import type {
  SubmissionPackageChecklistRow,
  SubmissionPackageSummaryStats,
} from "./output-utils";
import type { TechnicalProposalPacketCompliance } from "../types/technical-proposal-packet";

const WORDS_PER_PAGE = 450;

/** Detect URLs / obvious external links in proposal text (packet: no links in proposal body). */
export function draftTextContainsExternalLinks(text: string): boolean {
  if (!text.trim()) return false;
  return /https?:\/\/|www\.\w/i.test(text);
}

export function estimatePagesFromWordCount(wordCount: number): number {
  return Math.round((wordCount / WORDS_PER_PAGE) * 10) / 10;
}

export function estimatePagesFromPlainText(text: string): number {
  const wc = text.trim().split(/\s+/).filter(Boolean).length;
  return estimatePagesFromWordCount(wc);
}

function pageCompliantForLimit(text: string | undefined, limit: number): boolean {
  if (!text?.trim()) return false;
  return estimatePagesFromPlainText(text) <= limit + 0.15;
}

/**
 * Core packet checklist: required rows in SUBMISSION_PACKAGE_ITEM_SPECS must be fit for assembly.
 * Pre-award / optional rows are reported in `issues` but do not block `coreChecklistComplete`.
 */
export function computeTechnicalProposalPacketCompliance(input: {
  bidNumber: string;
  checklistStats: SubmissionPackageSummaryStats;
  checklistRows: SubmissionPackageChecklistRow[];
  snapshot: BidReviewSnapshot;
  /** sectionId -> active draft body */
  activeDraftContentBySectionId: Record<string, string | undefined>;
}): TechnicalProposalPacketCompliance {
  const issues: string[] = [];
  const p = CANONICAL_TECHNICAL_PROPOSAL_PACKET_S000000479;

  if (input.bidNumber !== S000000479_BID_NUMBER) {
    return {
      applicable: false,
      structuredModelLoaded: false,
      draftingConstraintsActive: false,
      coreChecklistComplete: true,
      pageLimitsCompliant: true,
      noExternalLinksInScoredVolumes: true,
      readyForPacketAssembly: true,
      issues: [],
    };
  }

  const coreChecklistComplete =
    input.checklistStats.missingItems === 0 &&
    input.checklistStats.blockedItems === 0;

  if (!coreChecklistComplete) {
    issues.push(
      "Technical Proposal Packet: one or more required submission components are missing or not validated.",
    );
  }

  const limits = p.pageLimits;
  let pageLimitsCompliant = true;
  for (const st of ["Experience", "Solution", "Risk"] as const) {
    const sec = input.snapshot.draftSections.find((s) => s.sectionType === st);
    const body = sec
      ? input.activeDraftContentBySectionId[sec.id]
      : undefined;
    const lim = limits[st.toLowerCase() as keyof typeof limits];
    if (!body?.trim()) {
      pageLimitsCompliant = false;
      issues.push(`${st} volume missing or empty — cannot verify ${lim}-page limit.`);
      continue;
    }
    if (!pageCompliantForLimit(body, lim)) {
      pageLimitsCompliant = false;
      issues.push(
        `${st} exceeds ~${lim} page budget (${estimatePagesFromPlainText(body)} est. pages).`,
      );
    }
  }

  let noExternalLinksInScoredVolumes = true;
  for (const st of ["Experience", "Solution", "Risk"] as const) {
    const sec = input.snapshot.draftSections.find((s) => s.sectionType === st);
    const body = sec
      ? input.activeDraftContentBySectionId[sec.id]
      : undefined;
    if (body && draftTextContainsExternalLinks(body)) {
      noExternalLinksInScoredVolumes = false;
      issues.push(
        `${st} draft contains external links or URLs — Technical Proposal Packet requires proposal text without hyperlinks.`,
      );
    }
  }

  const preAwardRow = input.checklistRows.find((r) => r.specId === "eo-98-04");
  if (preAwardRow && !preAwardRow.fitForAssembly) {
    issues.push(
      "Pre-award: EO 98-04 disclosure form not validated — required before award (track for sign-off).",
    );
  }

  const readyForPacketAssembly =
    coreChecklistComplete &&
    pageLimitsCompliant &&
    noExternalLinksInScoredVolumes;

  return {
    applicable: true,
    structuredModelLoaded: true,
    draftingConstraintsActive: true,
    coreChecklistComplete,
    pageLimitsCompliant,
    noExternalLinksInScoredVolumes,
    readyForPacketAssembly,
    issues: issues.slice(0, 14),
  };
}

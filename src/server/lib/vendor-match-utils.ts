import {
  blendedNameSimilarity,
  normalizeForMatch,
} from "./string-similarity";

/** Minimal vendor row for matching (avoids circular imports with vendor.repo). */
export type VendorMatchRow = { id: string; name: string };

export type VendorMatchScoreBreakdown = {
  similarity: number;
  nameSignalBonus: number;
  shortNamePenalty: number;
  missingPharmacySignalPenalty: number;
  nearDuplicatePenalty: number;
};

export type VendorMatchCandidate = {
  vendorId: string;
  vendorName: string;
  score: number;
  scoreBreakdown: VendorMatchScoreBreakdown;
  accepted: boolean;
};

const FUZZY_ENTRY = 0.72;
const FUZZY_AMBIGUOUS_GAP = 0.045;
const FUZZY_RESOLVE_MIN = 0.9;
const FUZZY_RESOLVE_MIN_SPARSE = 0.93;

function scoreFuzzyCandidate(
  v: VendorMatchRow,
  profileName: string,
  displayName: string,
  nearDuplicatePenalty: number,
): { score: number; breakdown: VendorMatchScoreBreakdown } {
  const vn = normalizeForMatch(v.name);
  const sim = Math.max(
    blendedNameSimilarity(v.name, profileName),
    blendedNameSimilarity(v.name, displayName),
    blendedNameSimilarity(v.name, "AllCare Pharmacy"),
  );
  let nameSignalBonus = 0;
  let shortNamePenalty = 0;
  let missingPharmacySignalPenalty = 0;

  if (vn.includes("allcare")) nameSignalBonus += 0.04;
  if (/(pharm|pharmacy|\brx\b)/.test(vn)) nameSignalBonus += 0.03;
  else if (vn.includes("allcare")) missingPharmacySignalPenalty = 0.07;

  const compactLen = vn.replace(/\s/g, "").length;
  if (compactLen > 0 && compactLen < 10) shortNamePenalty = 0.06;

  const score = Math.max(
    0,
    Math.min(
      1,
      sim +
        nameSignalBonus -
        shortNamePenalty -
        missingPharmacySignalPenalty -
        nearDuplicatePenalty,
    ),
  );

  return {
    score,
    breakdown: {
      similarity: sim,
      nameSignalBonus,
      shortNamePenalty,
      missingPharmacySignalPenalty,
      nearDuplicatePenalty,
    },
  };
}

/**
 * Conservative fuzzy resolution with explainable per-candidate scores.
 * Requires AllCare-like name signal; does not auto-create vendors.
 */
export type FuzzyVendorResolution = {
  vendorId: string | null;
  confidence: "high" | "medium" | "low" | "none";
  matchType: "fuzzy" | "ambiguous" | "none";
  candidateCount: number;
  notes?: string;
  candidates: VendorMatchCandidate[];
};

export function resolveFuzzyVendorMatches(input: {
  vendors: VendorMatchRow[];
  profileName: string;
  displayName: string;
  pagesIngested?: number;
}): FuzzyVendorResolution {
  const vendors = input.vendors;
  const rawScores = vendors.map((v) => {
    const vn = normalizeForMatch(v.name);
    const simOnly = Math.max(
      blendedNameSimilarity(v.name, input.profileName),
      blendedNameSimilarity(v.name, input.displayName),
      blendedNameSimilarity(v.name, "AllCare Pharmacy"),
    );
    return { v, vn, simOnly };
  });

  const plausibleBase = rawScores.filter(
    (x) => x.vn.includes("allcare") && x.simOnly >= FUZZY_ENTRY,
  );
  if (plausibleBase.length === 0) {
    return {
      vendorId: null,
      confidence: "none",
      matchType: "none",
      candidateCount: 0,
      notes: "No AllCare-scoped vendor candidates above similarity threshold.",
      candidates: [],
    };
  }

  const sortedBySim = [...plausibleBase].sort((a, b) => b.simOnly - a.simOnly);
  const nearDupPenaltyById = new Map<string, number>();
  for (let i = 0; i < sortedBySim.length; i++) {
    const a = sortedBySim[i]!;
    for (let j = i + 1; j < sortedBySim.length; j++) {
      const b = sortedBySim[j]!;
      if (Math.abs(a.simOnly - b.simOnly) < 0.07) {
        nearDupPenaltyById.set(a.v.id, 0.05);
        nearDupPenaltyById.set(b.v.id, 0.05);
      }
    }
  }

  const scored = plausibleBase
    .map((x) => {
      const pen = nearDupPenaltyById.get(x.v.id) ?? 0;
      const { score, breakdown } = scoreFuzzyCandidate(
        x.v,
        input.profileName,
        input.displayName,
        pen,
      );
      return { v: x.v, vn: x.vn, score, breakdown };
    })
    .filter((x) => x.score >= FUZZY_ENTRY)
    .sort((a, b) => b.score - a.score);

  const candidateCount = scored.length;
  if (candidateCount === 0) {
    return {
      vendorId: null,
      confidence: "none",
      matchType: "none",
      candidateCount: 0,
      notes: "Candidates failed pharmacy / length gates after scoring.",
      candidates: [],
    };
  }

  const top = scored[0]!;
  const second = scored[1];
  const pages = input.pagesIngested ?? 10;
  const sparse = pages < 4;
  const resolveMin = sparse ? FUZZY_RESOLVE_MIN_SPARSE : FUZZY_RESOLVE_MIN;

  const buildCandidates = (winnerId: string | null): VendorMatchCandidate[] =>
    scored.slice(0, 8).map((s) => ({
      vendorId: s.v.id,
      vendorName: s.v.name,
      score: Math.round(s.score * 1000) / 1000,
      scoreBreakdown: {
        similarity: Math.round(s.breakdown.similarity * 1000) / 1000,
        nameSignalBonus: Math.round(s.breakdown.nameSignalBonus * 1000) / 1000,
        shortNamePenalty:
          Math.round(s.breakdown.shortNamePenalty * 1000) / 1000,
        missingPharmacySignalPenalty:
          Math.round(s.breakdown.missingPharmacySignalPenalty * 1000) / 1000,
        nearDuplicatePenalty:
          Math.round(s.breakdown.nearDuplicatePenalty * 1000) / 1000,
      },
      accepted: winnerId != null && s.v.id === winnerId,
    }));

  if (second && top.score - second.score < FUZZY_AMBIGUOUS_GAP) {
    return {
      vendorId: null,
      confidence: "low",
      matchType: "ambiguous",
      candidateCount,
      notes: "Top fuzzy candidates are too close; no automatic bind.",
      candidates: buildCandidates(null),
    };
  }

  if (candidateCount >= 3 && top.score < 0.94) {
    return {
      vendorId: null,
      confidence: "low",
      matchType: "ambiguous",
      candidateCount,
      notes: "Several plausible vendors without a decisive winner.",
      candidates: buildCandidates(null),
    };
  }

  if (top.score < resolveMin) {
    return {
      vendorId: null,
      confidence: "none",
      matchType: "none",
      candidateCount,
      notes: sparse
        ? "Sparse crawl: fuzzy score below conservative bind threshold."
        : "Fuzzy score below bind threshold.",
      candidates: buildCandidates(null),
    };
  }

  return {
    vendorId: top.v.id,
    confidence: "medium",
    matchType: "fuzzy",
    candidateCount,
    notes: "Single clear fuzzy winner after penalties.",
    candidates: buildCandidates(top.v.id),
  };
}

import type {
  CompetitorProfile,
  Differentiator,
  EvaluatorLens,
  StrategyCompetitorFilters,
  ThreatLevel,
  WinTheme,
} from "@/types";

const THREAT_ORDER: ThreatLevel[] = ["Critical", "High", "Moderate", "Low"];

export function filterCompetitors(
  competitors: CompetitorProfile[],
  filters: StrategyCompetitorFilters,
): CompetitorProfile[] {
  const q = filters.search.trim().toLowerCase();
  return competitors.filter((c) => {
    if (filters.threatLevel !== "all" && c.threatLevel !== filters.threatLevel) {
      return false;
    }
    if (filters.likelyStatus !== "all" && c.likelyStatus !== filters.likelyStatus) {
      return false;
    }
    if (filters.incumbent === "yes" && !c.incumbent) return false;
    if (filters.incumbent === "no" && c.incumbent) return false;
    if (q) {
      const hay = `${c.name} ${c.summary} ${c.competitorType}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export type StrategicSummary = {
  likelyBidderCount: number;
  monitoringCount: number;
  topThreats: CompetitorProfile[];
  activeWinThemes: WinTheme[];
  strongestDifferentiators: Differentiator[];
  majorEvaluatorConcerns: string[];
  positioningConfidence: "Low" | "Moderate" | "High";
  themeCoverageGaps: string[];
};

const SCORING_FOCUS = ["Experience", "Solution", "Risk"];

export function computeStrategicSummary(
  competitors: CompetitorProfile[],
  themes: WinTheme[],
  differentiators: Differentiator[],
  lenses: EvaluatorLens[],
): StrategicSummary {
  const likelyBidders = competitors.filter(
    (c) =>
      c.likelyStatus === "Likely Bidder" ||
      c.likelyStatus === "Strong Threat" ||
      c.likelyStatus === "Secondary Threat",
  );
  const monitoring = competitors.filter((c) => c.likelyStatus === "Monitoring");

  const topThreats = [...competitors]
    .filter((c) => c.likelyStatus !== "Monitoring")
    .sort(
      (a, b) =>
        THREAT_ORDER.indexOf(a.threatLevel) - THREAT_ORDER.indexOf(b.threatLevel),
    )
    .slice(0, 4);

  const activeWinThemes = themes
    .filter((t) => t.status === "Active" || t.status === "Approved")
    .sort((a, b) => a.priority - b.priority);

  const strongestDifferentiators = [...differentiators]
    .filter((d) => d.strength === "Strong")
    .slice(0, 5);

  const majorEvaluatorConcerns = lenses.flatMap((l) =>
    l.likelyConcerns.slice(0, 2),
  ).slice(0, 8);

  const covered = new Set(
    activeWinThemes.flatMap((t) => t.targetSections.map((s) => s.trim())),
  );
  const themeCoverageGaps = SCORING_FOCUS.filter((s) => !covered.has(s));

  const criticalOrHigh = competitors.filter(
    (c) => c.threatLevel === "Critical" || c.threatLevel === "High",
  ).length;
  const strongDiff = differentiators.filter((d) => d.strength === "Strong").length;
  let positioningConfidence: StrategicSummary["positioningConfidence"] = "Moderate";
  if (criticalOrHigh >= 3 && strongDiff < 4) positioningConfidence = "Low";
  if (criticalOrHigh <= 2 && strongDiff >= 5 && themeCoverageGaps.length === 0) {
    positioningConfidence = "High";
  }

  return {
    likelyBidderCount: likelyBidders.length,
    monitoringCount: monitoring.length,
    topThreats,
    activeWinThemes,
    strongestDifferentiators,
    majorEvaluatorConcerns,
    positioningConfidence,
    themeCoverageGaps,
  };
}

export function evidenceCharacterLabel(c: CompetitorProfile["evidenceCharacter"]) {
  switch (c) {
    case "Sourced":
      return "Observed / sourced";
    case "Inferred":
      return "Inferred";
    case "Judgment":
      return "Strategic judgment";
    default:
      return c;
  }
}

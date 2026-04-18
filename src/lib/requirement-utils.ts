import type {
  Requirement,
  RequirementRiskLevel,
  RequirementStatus,
  RequirementTagType,
  RequirementType,
} from "@/types";

export type MatrixFilters = {
  status: RequirementStatus | "all";
  type: RequirementType | "all";
  risk: RequirementRiskLevel | "all";
  tag: RequirementTagType | "all";
  mandatoryOnly: boolean;
  search: string;
};

export function filterRequirements(
  requirements: Requirement[],
  filters: MatrixFilters,
): Requirement[] {
  const q = filters.search.trim().toLowerCase();
  return requirements.filter((r) => {
    if (filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.type !== "all" && r.requirementType !== filters.type) {
      return false;
    }
    if (filters.risk !== "all" && r.riskLevel !== filters.risk) return false;
    if (filters.tag !== "all" && !r.tags.includes(filters.tag)) {
      return false;
    }
    if (filters.mandatoryOnly && !r.mandatory) return false;
    if (q) {
      const hay = `${r.title} ${r.summary} ${r.sourceFileName} ${r.sourceSection} ${r.verbatimText}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export type CoverageSummary = {
  total: number;
  mandatory: number;
  coveredCount: number;
  partialCount: number;
  unresolvedCount: number;
  criticalRiskCount: number;
};

export function computeCoverageSummary(
  requirements: Requirement[],
): CoverageSummary {
  return {
    total: requirements.length,
    mandatory: requirements.filter((r) => r.mandatory).length,
    coveredCount: requirements.filter((r) => r.status === "Covered").length,
    partialCount: requirements.filter((r) => r.status === "Partial").length,
    unresolvedCount: requirements.filter((r) => r.status === "Unresolved").length,
    criticalRiskCount: requirements.filter((r) => r.riskLevel === "Critical").length,
  };
}

export function sortFilesForExtractionPicker<
  T extends { category: string; name: string },
>(files: T[]): T[] {
  const rank = (cat: string): number => {
    if (cat === "Solicitation") return 0;
    if (cat === "Compliance") return 1;
    if (cat === "Pricing") return 2;
    return 3;
  };
  return [...files].sort((a, b) => {
    const dr = rank(a.category) - rank(b.category);
    if (dr !== 0) return dr;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

import type {
  ArchitectureComponentRole,
  ArchitectureOptionStatus,
  EvidenceSupportStrength,
  EvidenceType,
  EvidenceValidationStatus,
  FileProcessingStatus,
  RequirementRiskLevel,
  RequirementStatus,
  RequirementSupportSummaryLevel,
  RequirementTagType,
  VendorCategory,
  VendorDimensionRating,
  VendorFitScore,
  VendorStatus,
} from "@/types";

/** Single source of truth for ISO timestamps shown in tables and detail views. */
export function formatRecordDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Display label for file processing status (table + detail + badges). */
export function formatFileProcessingStatusLabel(
  status: FileProcessingStatus,
): string {
  return status;
}

/** Stable tag order for list vs detail so labels do not drift. */
export function sortTagsForDisplay(tags: string[]): string[] {
  return [...tags].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" }),
  );
}

export function formatRequirementStatusLabel(
  status: RequirementStatus,
): string {
  return status;
}

export function formatRequirementRiskLabel(
  risk: RequirementRiskLevel,
): string {
  return risk;
}

export function formatRequirementTagLabel(tag: RequirementTagType): string {
  return tag;
}

/** Percent of total 1000-pt model for scoring category cards. */
export function formatScoringCategoryWeightLabel(weight: number): string {
  const pct = Math.round(weight * 1000) / 10;
  return `${pct}% of total points`;
}

export function formatEvidenceTypeLabel(type: EvidenceType): string {
  return type;
}

export function formatEvidenceValidationLabel(
  status: EvidenceValidationStatus,
): string {
  return status;
}

/** Compliance matrix column — values None | Weak | Moderate | Strong. */
export function formatRequirementSupportMatrixLabel(
  level: RequirementSupportSummaryLevel,
): string {
  return level;
}

/** Requirement detail header — e.g. “No Support”, “Weak Support”. */
export function formatRequirementSupportDetailLabel(
  level: RequirementSupportSummaryLevel,
): string {
  switch (level) {
    case "None":
      return "No Support";
    case "Weak":
      return "Weak Support";
    case "Moderate":
      return "Moderate Support";
    case "Strong":
      return "Strong Support";
    default:
      return level;
  }
}

export function formatEvidenceSupportStrengthLabel(
  strength: EvidenceSupportStrength,
): string {
  return strength;
}

export function formatVendorCategoryLabel(category: VendorCategory): string {
  return category;
}

export function formatVendorStatusLabel(status: VendorStatus): string {
  return status;
}

export function formatArchitectureOptionStatusLabel(
  status: ArchitectureOptionStatus,
): string {
  return status;
}

export function formatArchitectureComponentRoleLabel(
  role: ArchitectureComponentRole,
): string {
  return role;
}

/** Elegant fit score presentation for tables and badges. */
export function formatVendorFitScoreLabel(score: VendorFitScore): string {
  return `${score} / 5`;
}

export function formatVendorDimensionLabel(
  value: VendorDimensionRating,
): string {
  return value;
}

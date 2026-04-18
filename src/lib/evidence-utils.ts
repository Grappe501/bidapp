import type {
  EvidenceItem,
  EvidenceSupportStrength,
  EvidenceType,
  EvidenceValidationStatus,
  RequirementEvidenceLink,
  RequirementSupportSummaryLevel,
} from "@/types";

const STRENGTH_RANK: Record<EvidenceSupportStrength, number> = {
  Weak: 1,
  Moderate: 2,
  Strong: 3,
};

export function computeRequirementSupportLevel(
  linksForRequirement: RequirementEvidenceLink[],
): RequirementSupportSummaryLevel {
  if (linksForRequirement.length === 0) return "None";
  let max = 0;
  for (const l of linksForRequirement) {
    max = Math.max(max, STRENGTH_RANK[l.supportStrength]);
  }
  if (max >= 3) return "Strong";
  if (max === 2) return "Moderate";
  return "Weak";
}

export function linksForRequirement(
  allLinks: RequirementEvidenceLink[],
  requirementId: string,
): RequirementEvidenceLink[] {
  return allLinks.filter((l) => l.requirementId === requirementId);
}

export function linksForEvidence(
  allLinks: RequirementEvidenceLink[],
  evidenceId: string,
): RequirementEvidenceLink[] {
  return allLinks.filter((l) => l.evidenceId === evidenceId);
}

export function countLinkedRequirements(
  allLinks: RequirementEvidenceLink[],
  evidenceId: string,
): number {
  const ids = new Set(
    linksForEvidence(allLinks, evidenceId).map((l) => l.requirementId),
  );
  return ids.size;
}

export function evidenceIsLinked(
  allLinks: RequirementEvidenceLink[],
  evidenceId: string,
): boolean {
  return linksForEvidence(allLinks, evidenceId).length > 0;
}

export type EvidenceExplorerFilters = {
  evidenceType: EvidenceType | "all";
  validationStatus: EvidenceValidationStatus | "all";
  sourceFileId: string | "all";
  linkStatus: "all" | "linked" | "unlinked";
  search: string;
};

export function filterEvidenceItems(
  items: EvidenceItem[],
  allLinks: RequirementEvidenceLink[],
  filters: EvidenceExplorerFilters,
): EvidenceItem[] {
  const q = filters.search.trim().toLowerCase();
  return items.filter((e) => {
    if (filters.evidenceType !== "all" && e.evidenceType !== filters.evidenceType) {
      return false;
    }
    if (
      filters.validationStatus !== "all" &&
      e.validationStatus !== filters.validationStatus
    ) {
      return false;
    }
    if (filters.sourceFileId !== "all" && e.sourceFileId !== filters.sourceFileId) {
      return false;
    }
    const linked = evidenceIsLinked(allLinks, e.id);
    if (filters.linkStatus === "linked" && !linked) return false;
    if (filters.linkStatus === "unlinked" && linked) return false;
    if (q) {
      const hay = `${e.title} ${e.excerpt} ${e.sourceSection} ${e.sourceFileName} ${e.notes}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function buildSupportLevelByRequirementId(
  requirements: { id: string }[],
  allLinks: RequirementEvidenceLink[],
): Record<string, RequirementSupportSummaryLevel> {
  const map: Record<string, RequirementSupportSummaryLevel> = {};
  for (const r of requirements) {
    map[r.id] = computeRequirementSupportLevel(linksForRequirement(allLinks, r.id));
  }
  return map;
}

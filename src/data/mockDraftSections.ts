import type { DraftSection } from "@/types";

/** Deterministic section shells for the seeded bid workspace (session + localStorage). */
export function createInitialDraftSections(projectId: string): DraftSection[] {
  const now = new Date().toISOString();
  const types = [
    "Experience",
    "Solution",
    "Risk",
    "Interview",
    "Executive Summary",
    "Architecture Narrative",
  ] as const;

  return types.map((sectionType, i) => ({
    id: `draft-sec-${projectId.slice(0, 8)}-${i + 1}`,
    projectId,
    sectionType,
    title: sectionType,
    status: "Not Started",
    activeVersionId: null,
    createdAt: now,
    updatedAt: now,
  }));
}

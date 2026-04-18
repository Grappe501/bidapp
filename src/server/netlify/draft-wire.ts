import type { DbDraftSection, DbDraftVersion } from "../repositories/draft.repo";
import type { DbGroundingBundle } from "../repositories/grounding.repo";
import type { DraftSection, DraftVersion, GroundingBundlePayload } from "@/types";

export function wireDraftSection(s: DbDraftSection): DraftSection {
  return {
    id: s.id,
    projectId: s.projectId,
    sectionType: s.sectionType,
    title: s.title,
    status: s.status,
    activeVersionId: s.activeVersionId,
    selectedGroundingBundleId: s.selectedGroundingBundleId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export function wireDraftVersion(v: DbDraftVersion): DraftVersion {
  return {
    id: v.id,
    sectionId: v.sectionId,
    content: v.content,
    groundingBundleId: v.groundingBundleId,
    metadata: v.metadata,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    note: v.note ?? undefined,
    locked: v.locked,
  };
}

export function wireGroundingBundle(b: DbGroundingBundle) {
  return {
    id: b.id,
    bundleType: b.bundleType,
    title: b.title,
    createdAt: b.createdAt,
    payload: b.bundlePayloadJson as GroundingBundlePayload,
  };
}

import { createContext } from "react";
import type {
  DraftMetadata,
  DraftSection,
  DraftStatus,
  DraftVersion,
  GroundingBundlePayload,
} from "@/types";

export type SelectedBundle = {
  id: string;
  payload: GroundingBundlePayload;
  /** When the bundle was chosen from the project list API (storage time). */
  listCreatedAt?: string;
};

export type DraftingContextValue = {
  sections: DraftSection[];
  versions: DraftVersion[];
  getSection: (id: string) => DraftSection | undefined;
  getVersionsForSection: (sectionId: string) => DraftVersion[];
  getActiveVersion: (sectionId: string) => DraftVersion | undefined;
  getSelectedBundle: (sectionId: string) => SelectedBundle | null;
  setSelectedBundle: (
    sectionId: string,
    bundle: SelectedBundle | null,
  ) => void | Promise<void>;
  saveNewVersion: (input: {
    sectionId: string;
    content: string;
    metadata: DraftMetadata;
    groundingBundleId: string | null;
  }) => void | Promise<void>;
  setActiveVersion: (
    sectionId: string,
    versionId: string,
  ) => void | Promise<void>;
  updateActiveContent: (
    sectionId: string,
    content: string,
  ) => void | Promise<void>;
  updateSectionStatus: (
    sectionId: string,
    status: DraftStatus,
  ) => void | Promise<void>;
  duplicateVersion: (
    sectionId: string,
    versionId: string,
  ) => void | Promise<void>;
  updateVersionNote: (
    sectionId: string,
    versionId: string,
    note: string,
  ) => void | Promise<void>;
  setVersionLocked: (
    sectionId: string,
    versionId: string,
    locked: boolean,
  ) => void | Promise<void>;
  /** When true, run grounded prose review immediately after a successful generate. */
  autoGroundedReviewAfterGenerate: boolean;
  setAutoGroundedReviewAfterGenerate: (value: boolean) => void;
};

export const DraftingContext = createContext<DraftingContextValue | null>(null);

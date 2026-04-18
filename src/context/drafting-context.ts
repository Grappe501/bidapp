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
  ) => void;
  saveNewVersion: (input: {
    sectionId: string;
    content: string;
    metadata: DraftMetadata;
    groundingBundleId: string | null;
  }) => void;
  setActiveVersion: (sectionId: string, versionId: string) => void;
  updateActiveContent: (sectionId: string, content: string) => void;
  updateSectionStatus: (sectionId: string, status: DraftStatus) => void;
};

export const DraftingContext = createContext<DraftingContextValue | null>(null);

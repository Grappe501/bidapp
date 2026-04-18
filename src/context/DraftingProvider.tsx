import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createInitialDraftSections } from "@/data/mockDraftSections";
import { MOCK_PROJECT } from "@/data/mockProject";
import type { DraftMetadata, DraftSection, DraftStatus, DraftVersion } from "@/types";
import {
  DraftingContext,
  type DraftingContextValue,
  type SelectedBundle,
} from "./drafting-context";

const STORAGE_KEY = "bidapp-drafting-v1";

type Persisted = {
  sections: DraftSection[];
  versions: DraftVersion[];
  bundleBySection: Record<string, SelectedBundle | null>;
};

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

function savePersisted(data: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function DraftingProvider({ children }: { children: ReactNode }) {
  const projectId = MOCK_PROJECT.id;

  const [sections, setSections] = useState<DraftSection[]>(() => {
    const p = loadPersisted();
    if (p?.sections?.length) return p.sections;
    return createInitialDraftSections(projectId);
  });

  const [versions, setVersions] = useState<DraftVersion[]>(() => {
    const p = loadPersisted();
    return p?.versions ?? [];
  });

  const [bundleBySection, setBundleBySection] = useState<
    Record<string, SelectedBundle | null>
  >(() => loadPersisted()?.bundleBySection ?? {});

  useEffect(() => {
    savePersisted({ sections, versions, bundleBySection });
  }, [sections, versions, bundleBySection]);

  const getSection = useCallback(
    (id: string) => sections.find((s) => s.id === id),
    [sections],
  );

  const getVersionsForSection = useCallback(
    (sectionId: string) =>
      [...versions].filter((v) => v.sectionId === sectionId),
    [versions],
  );

  const getActiveVersion = useCallback(
    (sectionId: string): DraftVersion | undefined => {
      const sec = sections.find((s) => s.id === sectionId);
      if (!sec?.activeVersionId) return undefined;
      return versions.find((v) => v.id === sec.activeVersionId);
    },
    [sections, versions],
  );

  const getSelectedBundle = useCallback(
    (sectionId: string) => bundleBySection[sectionId] ?? null,
    [bundleBySection],
  );

  const setSelectedBundle = useCallback(
    (sectionId: string, bundle: SelectedBundle | null) => {
      setBundleBySection((prev) => ({ ...prev, [sectionId]: bundle }));
    },
    [],
  );

  const saveNewVersion = useCallback(
    (input: {
      sectionId: string;
      content: string;
      metadata: DraftMetadata;
      groundingBundleId: string | null;
    }) => {
      const now = new Date().toISOString();
      const v: DraftVersion = {
        id: crypto.randomUUID(),
        sectionId: input.sectionId,
        content: input.content,
        groundingBundleId: input.groundingBundleId,
        metadata: input.metadata,
        createdAt: now,
      };
      setVersions((prev) => [...prev, v]);
      setSections((prev) =>
        prev.map((s) =>
          s.id === input.sectionId
            ? {
                ...s,
                activeVersionId: v.id,
                status:
                  s.status === "Not Started" ? "Drafting" : ("Needs Review" as const),
                updatedAt: now,
              }
            : s,
        ),
      );
    },
    [],
  );

  const setActiveVersion = useCallback(
    (sectionId: string, versionId: string) => {
      const now = new Date().toISOString();
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, activeVersionId: versionId, updatedAt: now }
            : s,
        ),
      );
    },
    [],
  );

  const updateActiveContent = useCallback(
    (sectionId: string, content: string) => {
      const sec = sections.find((s) => s.id === sectionId);
      if (!sec?.activeVersionId) return;
      const now = new Date().toISOString();
      setVersions((prev) =>
        prev.map((v) =>
          v.id === sec.activeVersionId ? { ...v, content } : v,
        ),
      );
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, updatedAt: now } : s,
        ),
      );
    },
    [sections],
  );

  const updateSectionStatus = useCallback(
    (sectionId: string, status: DraftStatus) => {
      const now = new Date().toISOString();
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, status, updatedAt: now } : s,
        ),
      );
    },
    [],
  );

  const value = useMemo<DraftingContextValue>(
    () => ({
      sections,
      versions,
      getSection,
      getVersionsForSection,
      getActiveVersion,
      getSelectedBundle,
      setSelectedBundle,
      saveNewVersion,
      setActiveVersion,
      updateActiveContent,
      updateSectionStatus,
    }),
    [
      sections,
      versions,
      getSection,
      getVersionsForSection,
      getActiveVersion,
      getSelectedBundle,
      setSelectedBundle,
      saveNewVersion,
      setActiveVersion,
      updateActiveContent,
      updateSectionStatus,
    ],
  );

  return (
    <DraftingContext.Provider value={value}>{children}</DraftingContext.Provider>
  );
}

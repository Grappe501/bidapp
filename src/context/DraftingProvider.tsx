import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createInitialDraftSections } from "@/data/mockDraftSections";
import { MOCK_PROJECT } from "@/data/mockProject";
import {
  fetchDraftingWorkspace,
  isFunctionsApiConfigured,
  postDuplicateDraftVersion,
  postPatchDraftVersionContent,
  postSaveDraftVersionInsert,
  postSetActiveDraftVersion,
  postSetDraftSectionBundle,
  postUpdateDraftSectionStatus,
  postUpdateDraftVersionMeta,
  type DraftingWorkspacePayload,
} from "@/lib/functions-api";
import type { DraftMetadata, DraftSection, DraftStatus, DraftVersion } from "@/types";
import {
  DraftingContext,
  type DraftingContextValue,
  type SelectedBundle,
} from "./drafting-context";

const STORAGE_PREFIX = "bidapp-drafting-v1";

type Persisted = {
  sections: DraftSection[];
  versions: DraftVersion[];
  bundleBySection: Record<string, SelectedBundle | null>;
};

function storageKey(projectId: string) {
  return `${STORAGE_PREFIX}-${projectId}`;
}

function sortVersions(list: DraftVersion[]): DraftVersion[] {
  return [...list].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function bundleMapFromWorkspace(
  sections: DraftSection[],
  bundles: DraftingWorkspacePayload["bundles"],
): Record<string, SelectedBundle | null> {
  const out: Record<string, SelectedBundle | null> = {};
  for (const s of sections) {
    const bid = s.selectedGroundingBundleId ?? null;
    if (!bid) {
      out[s.id] = null;
      continue;
    }
    const b = bundles.find((x) => x.id === bid);
    out[s.id] = b
      ? { id: b.id, payload: b.payload, listCreatedAt: b.createdAt }
      : null;
  }
  return out;
}

function loadPersisted(projectId: string): Persisted | null {
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

function savePersisted(projectId: string, data: Persisted) {
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

function initialDraftingState(projectId: string): Persisted {
  const p = loadPersisted(projectId);
  return {
    sections: p?.sections?.length
      ? p.sections
      : createInitialDraftSections(projectId),
    versions: sortVersions(p?.versions ?? []),
    bundleBySection: p?.bundleBySection ?? {},
  };
}

export function DraftingProvider({ children }: { children: ReactNode }) {
  const projectId = useMemo(
    () =>
      (import.meta.env.VITE_DEFAULT_PROJECT_ID as string | undefined)?.trim() ||
      MOCK_PROJECT.id,
    [],
  );

  const remoteEnabled = useMemo(() => isFunctionsApiConfigured(), []);

  const snapshot = useMemo(
    () => initialDraftingState(projectId),
    [projectId],
  );

  const [sections, setSections] = useState<DraftSection[]>(snapshot.sections);
  const [versions, setVersions] = useState<DraftVersion[]>(snapshot.versions);
  const [bundleBySection, setBundleBySection] = useState<
    Record<string, SelectedBundle | null>
  >(snapshot.bundleBySection);

  useEffect(() => {
    const next = initialDraftingState(projectId);
    setSections(next.sections);
    setVersions(next.versions);
    setBundleBySection(next.bundleBySection);
  }, [projectId]);

  useEffect(() => {
    if (!remoteEnabled) return;
    let cancelled = false;
    void fetchDraftingWorkspace(projectId).then((w) => {
      if (cancelled || !w) return;
      const bundleBy = bundleMapFromWorkspace(w.sections, w.bundles);
      const vs = sortVersions(w.versions);
      setSections(w.sections);
      setVersions(vs);
      setBundleBySection(bundleBy);
      savePersisted(projectId, {
        sections: w.sections,
        versions: vs,
        bundleBySection: bundleBy,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, remoteEnabled]);

  useEffect(() => {
    savePersisted(projectId, { sections, versions, bundleBySection });
  }, [sections, versions, bundleBySection, projectId]);

  const getSection = useCallback(
    (id: string) => sections.find((s) => s.id === id),
    [sections],
  );

  const getVersionsForSection = useCallback(
    (sectionId: string) =>
      sortVersions(versions.filter((v) => v.sectionId === sectionId)),
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
    async (sectionId: string, bundle: SelectedBundle | null) => {
      if (remoteEnabled) {
        try {
          const r = await postSetDraftSectionBundle({
            projectId,
            sectionId,
            bundleId: bundle?.id ?? null,
          });
          setSections((prev) =>
            prev.map((s) => (s.id === r.section.id ? r.section : s)),
          );
          setBundleBySection((prev) => ({ ...prev, [sectionId]: bundle }));
          return;
        } catch (e) {
          console.error("Remote bundle selection failed; keeping local only.", e);
        }
      }
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                selectedGroundingBundleId: bundle?.id ?? null,
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      );
      setBundleBySection((prev) => ({ ...prev, [sectionId]: bundle }));
    },
    [remoteEnabled, projectId],
  );

  const saveNewVersion = useCallback(
    async (input: {
      sectionId: string;
      content: string;
      metadata: DraftMetadata;
      groundingBundleId: string | null;
    }) => {
      const genMode = input.metadata.generationMode ?? null;
      if (remoteEnabled) {
        try {
          const r = await postSaveDraftVersionInsert({
            projectId,
            sectionId: input.sectionId,
            content: input.content,
            metadata: input.metadata,
            groundingBundleId: input.groundingBundleId,
            generationMode: genMode,
          });
          setVersions((prev) => [
            ...prev.filter((v) => v.id !== r.version.id),
            r.version,
          ]);
          setSections((prev) =>
            prev.map((s) => (s.id === r.section.id ? r.section : s)),
          );
          return;
        } catch (e) {
          console.error("Remote draft version save failed; using local store.", e);
        }
      }

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
                  s.status === "Not Started"
                    ? "Drafting"
                    : ("Needs Review" as const),
                updatedAt: now,
              }
            : s,
        ),
      );
    },
    [remoteEnabled, projectId],
  );

  const setActiveVersion = useCallback(
    async (sectionId: string, versionId: string) => {
      if (remoteEnabled) {
        try {
          const r = await postSetActiveDraftVersion({
            projectId,
            sectionId,
            versionId,
          });
          setSections((prev) =>
            prev.map((s) => (s.id === r.section.id ? r.section : s)),
          );
          return;
        } catch (e) {
          console.error("Remote set-active failed; using local store.", e);
        }
      }
      const now = new Date().toISOString();
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? { ...s, activeVersionId: versionId, updatedAt: now }
            : s,
        ),
      );
    },
    [remoteEnabled, projectId],
  );

  const updateActiveContent = useCallback(
    async (sectionId: string, content: string) => {
      const sec = sections.find((s) => s.id === sectionId);
      if (!sec?.activeVersionId) return;
      const activeVer = versions.find((v) => v.id === sec.activeVersionId);
      if (activeVer?.locked) return;

      if (remoteEnabled) {
        try {
          const r = await postPatchDraftVersionContent({
            projectId,
            versionId: sec.activeVersionId,
            content,
          });
          setVersions((prev) =>
            prev.map((v) => (v.id === r.version.id ? r.version : v)),
          );
          if (r.section) {
            const secRow = r.section;
            setSections((prev) =>
              prev.map((s) => (s.id === secRow.id ? secRow : s)),
            );
          }
          return;
        } catch (e) {
          console.error("Remote overwrite failed; using local store.", e);
        }
      }

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
    [remoteEnabled, projectId, sections, versions],
  );

  const updateSectionStatus = useCallback(
    async (sectionId: string, status: DraftStatus) => {
      if (remoteEnabled) {
        try {
          const r = await postUpdateDraftSectionStatus({
            projectId,
            sectionId,
            status,
          });
          setSections((prev) =>
            prev.map((s) => (s.id === r.section.id ? r.section : s)),
          );
          return;
        } catch (e) {
          console.error("Remote status update failed; using local store.", e);
        }
      }
      const now = new Date().toISOString();
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, status, updatedAt: now } : s,
        ),
      );
    },
    [remoteEnabled, projectId],
  );

  const duplicateVersion = useCallback(
    async (sectionId: string, versionId: string) => {
      const src = versions.find(
        (v) => v.id === versionId && v.sectionId === sectionId,
      );
      if (!src) return;

      if (remoteEnabled) {
        try {
          const note =
            src.note && src.note.trim()
              ? `Copy · ${src.note.trim().slice(0, 80)}`
              : "Duplicate version";
          const r = await postDuplicateDraftVersion({
            projectId,
            sectionId,
            sourceVersionId: versionId,
            note,
          });
          setVersions((prev) => [...prev, r.version]);
          setSections((prev) =>
            prev.map((s) => (s.id === r.section.id ? r.section : s)),
          );
          return;
        } catch (e) {
          console.error("Remote duplicate failed; using local store.", e);
        }
      }

      const now = new Date().toISOString();
      const v: DraftVersion = {
        ...src,
        id: crypto.randomUUID(),
        createdAt: now,
        locked: false,
        note:
          src.note && src.note.trim()
            ? `Copy · ${src.note.trim().slice(0, 80)}`
            : "Duplicate version",
      };
      setVersions((prev) => [...prev, v]);
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                activeVersionId: v.id,
                status:
                  s.status === "Not Started"
                    ? "Drafting"
                    : ("Needs Review" as const),
                updatedAt: now,
              }
            : s,
        ),
      );
    },
    [remoteEnabled, projectId, versions],
  );

  const updateVersionNote = useCallback(
    async (sectionId: string, versionId: string, note: string) => {
      const trimmed = note.trim().slice(0, 200);
      if (remoteEnabled) {
        try {
          const r = await postUpdateDraftVersionMeta({
            projectId,
            versionId,
            note: trimmed || null,
          });
          setVersions((prev) =>
            prev.map((v) => (v.id === r.version.id ? r.version : v)),
          );
          if (r.section) {
            const secRow = r.section;
            setSections((prev) =>
              prev.map((s) => (s.id === secRow.id ? secRow : s)),
            );
          }
          return;
        } catch (e) {
          console.error("Remote version note update failed; using local store.", e);
        }
      }
      const now = new Date().toISOString();
      setVersions((prev) =>
        prev.map((v) =>
          v.id === versionId && v.sectionId === sectionId
            ? { ...v, note: trimmed || undefined }
            : v,
        ),
      );
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, updatedAt: now } : s,
        ),
      );
    },
    [remoteEnabled, projectId],
  );

  const setVersionLocked = useCallback(
    async (sectionId: string, versionId: string, locked: boolean) => {
      if (remoteEnabled) {
        try {
          const r = await postUpdateDraftVersionMeta({
            projectId,
            versionId,
            locked,
          });
          setVersions((prev) =>
            prev.map((v) => (v.id === r.version.id ? r.version : v)),
          );
          if (r.section) {
            const secRow = r.section;
            setSections((prev) =>
              prev.map((s) => (s.id === secRow.id ? secRow : s)),
            );
          }
          return;
        } catch (e) {
          console.error("Remote lock update failed; using local store.", e);
        }
      }
      const now = new Date().toISOString();
      setVersions((prev) =>
        prev.map((v) =>
          v.id === versionId && v.sectionId === sectionId
            ? { ...v, locked }
            : v,
        ),
      );
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, updatedAt: now } : s,
        ),
      );
    },
    [remoteEnabled, projectId],
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
      duplicateVersion,
      updateVersionNote,
      setVersionLocked,
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
      duplicateVersion,
      updateVersionNote,
      setVersionLocked,
    ],
  );

  return (
    <DraftingContext.Provider value={value}>{children}</DraftingContext.Provider>
  );
}

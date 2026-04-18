import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProjectWorkspace } from "@/context/project-workspace-context";
import { applyIngestToProfile } from "@/lib/intelligence-utils";
import type {
  CompanyProfile,
  IntelligenceClassification,
  IntelligenceIngestEntry,
} from "@/types";
import { IntelligenceContext } from "./intelligence-context";

export function IntelligenceProvider({ children }: { children: ReactNode }) {
  const { workspace } = useProjectWorkspace();
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);

  useEffect(() => {
    if (workspace?.companyProfiles) {
      setProfiles(workspace.companyProfiles);
    }
  }, [workspace]);
  const [ingestEntries, setIngestEntries] = useState<IntelligenceIngestEntry[]>(
    () => [],
  );

  const addIngestEntry = useCallback(
    (input: {
      companyProfileId: string;
      classification: IntelligenceClassification;
      body: string;
      sourceUrl: string;
    }) => {
      const createdAt = new Date().toISOString();
      const entry: IntelligenceIngestEntry = {
        id: crypto.randomUUID(),
        companyProfileId: input.companyProfileId,
        classification: input.classification,
        body: input.body.trim(),
        sourceUrl: input.sourceUrl.trim(),
        createdAt,
      };
      setIngestEntries((prev) => [entry, ...prev]);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === input.companyProfileId
            ? applyIngestToProfile(p, entry)
            : p,
        ),
      );
    },
    [],
  );

  const updateProfileSummary = useCallback((id: string, summary: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, summary } : p)),
    );
  }, []);

  const value = useMemo(
    () => ({
      profiles,
      ingestEntries,
      addIngestEntry,
      updateProfileSummary,
    }),
    [profiles, ingestEntries, addIngestEntry, updateProfileSummary],
  );

  return (
    <IntelligenceContext.Provider value={value}>
      {children}
    </IntelligenceContext.Provider>
  );
}

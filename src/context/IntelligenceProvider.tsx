import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_COMPANY_PROFILES } from "@/data/mockCompanyProfiles";
import { applyIngestToProfile } from "@/lib/intelligence-utils";
import type {
  CompanyProfile,
  IntelligenceClassification,
  IntelligenceIngestEntry,
} from "@/types";
import { IntelligenceContext } from "./intelligence-context";

export function IntelligenceProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<CompanyProfile[]>(() => [
    ...MOCK_COMPANY_PROFILES,
  ]);
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

import { createContext } from "react";
import type {
  CompanyProfile,
  IntelligenceClassification,
  IntelligenceIngestEntry,
} from "@/types";

export type IntelligenceContextValue = {
  profiles: CompanyProfile[];
  ingestEntries: IntelligenceIngestEntry[];
  addIngestEntry: (input: {
    companyProfileId: string;
    classification: IntelligenceClassification;
    body: string;
    sourceUrl: string;
  }) => void;
  updateProfileSummary: (id: string, summary: string) => void;
};

export const IntelligenceContext = createContext<IntelligenceContextValue | null>(
  null,
);

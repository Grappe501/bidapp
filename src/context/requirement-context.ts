import { createContext } from "react";
import type { Requirement, RequirementCandidate } from "@/types";

export type RequirementContextValue = {
  requirements: Requirement[];
  pendingCandidatesByFile: Record<string, RequirementCandidate[]>;
  extractionRunFileIds: ReadonlySet<string>;
  runExtraction: (fileId: string) => void;
  approveCandidate: (
    fileId: string,
    candidateId: string,
    draft?: Partial<RequirementCandidate>,
  ) => void;
  rejectCandidate: (fileId: string, candidateId: string) => void;
  bulkApproveCandidates: (
    fileId: string,
    candidateIds: string[],
    getDraft?: (candidateId: string) => Partial<RequirementCandidate> | undefined,
  ) => void;
  updateRequirement: (id: string, patch: Partial<Requirement>) => void;
};

export const RequirementContext = createContext<RequirementContextValue | null>(
  null,
);

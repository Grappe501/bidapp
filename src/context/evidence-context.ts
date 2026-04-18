import { createContext } from "react";
import type {
  EvidenceItem,
  EvidenceSupportStrength,
  RequirementEvidenceLink,
} from "@/types";

export type LinkEvidenceInput = {
  requirementId: string;
  evidenceId: string;
  supportStrength: EvidenceSupportStrength;
  linkNote?: string;
};

export type EvidenceContextValue = {
  evidenceItems: EvidenceItem[];
  links: RequirementEvidenceLink[];
  linkEvidence: (input: LinkEvidenceInput) => void;
  unlink: (linkId: string) => void;
  updateLink: (
    linkId: string,
    patch: Partial<
      Pick<RequirementEvidenceLink, "supportStrength" | "linkNote">
    >,
  ) => void;
  updateEvidence: (id: string, patch: Partial<EvidenceItem>) => void;
};

export const EvidenceContext = createContext<EvidenceContextValue | null>(null);

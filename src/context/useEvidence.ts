import { useContext } from "react";
import { EvidenceContext, type EvidenceContextValue } from "./evidence-context";

export function useEvidence(): EvidenceContextValue {
  const ctx = useContext(EvidenceContext);
  if (!ctx) {
    throw new Error("useEvidence must be used within EvidenceProvider");
  }
  return ctx;
}

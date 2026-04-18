import { useContext } from "react";
import { IntelligenceContext } from "./intelligence-context";

export function useIntelligence() {
  const ctx = useContext(IntelligenceContext);
  if (!ctx) {
    throw new Error("useIntelligence must be used within IntelligenceProvider");
  }
  return ctx;
}

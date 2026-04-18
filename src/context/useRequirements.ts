import { useContext } from "react";
import {
  RequirementContext,
  type RequirementContextValue,
} from "./requirement-context";

export function useRequirements(): RequirementContextValue {
  const ctx = useContext(RequirementContext);
  if (!ctx) {
    throw new Error("useRequirements must be used within RequirementProvider");
  }
  return ctx;
}

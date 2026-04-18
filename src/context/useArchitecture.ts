import { useContext } from "react";
import {
  ArchitectureContext,
  type ArchitectureContextValue,
} from "./architecture-context";

export function useArchitecture(): ArchitectureContextValue {
  const ctx = useContext(ArchitectureContext);
  if (!ctx) {
    throw new Error("useArchitecture must be used within ArchitectureProvider");
  }
  return ctx;
}

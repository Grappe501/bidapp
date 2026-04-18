import { useContext } from "react";
import { DraftingContext } from "./drafting-context";

export function useDrafting() {
  const ctx = useContext(DraftingContext);
  if (!ctx) {
    throw new Error("useDrafting must be used within DraftingProvider");
  }
  return ctx;
}

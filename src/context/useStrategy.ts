import { useContext } from "react";
import { StrategyContext } from "./strategy-context";

export function useStrategy() {
  const ctx = useContext(StrategyContext);
  if (!ctx) {
    throw new Error("useStrategy must be used within StrategyProvider");
  }
  return ctx;
}

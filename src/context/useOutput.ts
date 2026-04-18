import { useContext } from "react";
import { OutputContext } from "./output-context";

export function useOutput() {
  const ctx = useContext(OutputContext);
  if (!ctx) {
    throw new Error("useOutput must be used within OutputProvider");
  }
  return ctx;
}

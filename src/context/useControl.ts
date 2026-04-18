import { useContext } from "react";
import { ControlContext } from "./control-context";

export function useControl() {
  const ctx = useContext(ControlContext);
  if (!ctx) {
    throw new Error("useControl must be used within ControlProvider");
  }
  return ctx;
}

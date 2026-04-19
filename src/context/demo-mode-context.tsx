import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { getDemoClientDisplayName, isDemoModeClient } from "@/lib/demo-mode";

export type DemoModeContextValue = {
  isDemoMode: boolean;
  demoClientDisplayName: string;
};

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<DemoModeContextValue>(
    () => ({
      isDemoMode: isDemoModeClient(),
      demoClientDisplayName: getDemoClientDisplayName(),
    }),
    [],
  );

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode(): DemoModeContextValue {
  const v = useContext(DemoModeContext);
  if (!v) {
    throw new Error("useDemoMode must be used within DemoModeProvider");
  }
  return v;
}

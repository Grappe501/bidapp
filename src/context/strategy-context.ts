import { createContext } from "react";
import type { StrategicSummary } from "@/lib/strategy-utils";
import type {
  CompetitorProfile,
  Differentiator,
  EvaluatorLens,
  WinTheme,
} from "@/types";

export type StrategyContextValue = {
  projectId: string;
  competitors: CompetitorProfile[];
  winThemes: WinTheme[];
  differentiators: Differentiator[];
  evaluatorLenses: EvaluatorLens[];
  strategicSummary: StrategicSummary;
  updateCompetitor: (id: string, patch: Partial<CompetitorProfile>) => void;
  updateWinTheme: (id: string, patch: Partial<WinTheme>) => void;
  updateDifferentiator: (id: string, patch: Partial<Differentiator>) => void;
  updateEvaluatorLens: (id: string, patch: Partial<EvaluatorLens>) => void;
};

export const StrategyContext = createContext<StrategyContextValue | null>(null);

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_COMPETITORS } from "@/data/mockCompetitors";
import { MOCK_DIFFERENTIATORS } from "@/data/mockDifferentiators";
import { MOCK_EVALUATOR_LENSES } from "@/data/mockEvaluatorLenses";
import { MOCK_PROJECT } from "@/data/mockProject";
import { MOCK_WIN_THEMES } from "@/data/mockWinThemes";
import { buildStrategicSummary } from "@/server/services/strategy.service";
import { StrategyContext } from "./strategy-context";
import type {
  CompetitorProfile,
  Differentiator,
  EvaluatorLens,
  WinTheme,
} from "@/types";

const STORAGE_KEY = "bidapp-strategy-v1";

type Persisted = {
  competitors: CompetitorProfile[];
  winThemes: WinTheme[];
  differentiators: Differentiator[];
  evaluatorLenses: EvaluatorLens[];
};

function loadPersisted(): Partial<Persisted> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<Persisted>;
  } catch {
    return null;
  }
}

function savePersisted(data: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function touch<T extends { updatedAt: string }>(row: T): T {
  return { ...row, updatedAt: new Date().toISOString() };
}

export function StrategyProvider({ children }: { children: ReactNode }) {
  const projectId = MOCK_PROJECT.id;
  const p = loadPersisted();

  const [competitors, setCompetitors] = useState<CompetitorProfile[]>(() =>
    p?.competitors?.length ? p.competitors : [...MOCK_COMPETITORS],
  );
  const [winThemes, setWinThemes] = useState<WinTheme[]>(() =>
    p?.winThemes?.length ? p.winThemes : [...MOCK_WIN_THEMES],
  );
  const [differentiators, setDifferentiators] = useState<Differentiator[]>(() =>
    p?.differentiators?.length ? p.differentiators : [...MOCK_DIFFERENTIATORS],
  );
  const [evaluatorLenses, setEvaluatorLenses] = useState<EvaluatorLens[]>(() =>
    p?.evaluatorLenses?.length ? p.evaluatorLenses : [...MOCK_EVALUATOR_LENSES],
  );

  useEffect(() => {
    savePersisted({
      competitors,
      winThemes,
      differentiators,
      evaluatorLenses,
    });
  }, [competitors, winThemes, differentiators, evaluatorLenses]);

  const strategicSummary = useMemo(
    () =>
      buildStrategicSummary(competitors, winThemes, differentiators, evaluatorLenses),
    [competitors, winThemes, differentiators, evaluatorLenses],
  );

  const updateCompetitor = useCallback((id: string, patch: Partial<CompetitorProfile>) => {
    setCompetitors((prev) =>
      prev.map((c) => (c.id === id ? touch({ ...c, ...patch }) : c)),
    );
  }, []);

  const updateWinTheme = useCallback((id: string, patch: Partial<WinTheme>) => {
    setWinThemes((prev) =>
      prev.map((t) => (t.id === id ? touch({ ...t, ...patch }) : t)),
    );
  }, []);

  const updateDifferentiator = useCallback(
    (id: string, patch: Partial<Differentiator>) => {
      setDifferentiators((prev) =>
        prev.map((d) => (d.id === id ? touch({ ...d, ...patch }) : d)),
      );
    },
    [],
  );

  const updateEvaluatorLens = useCallback(
    (id: string, patch: Partial<EvaluatorLens>) => {
      setEvaluatorLenses((prev) =>
        prev.map((l) => (l.id === id ? touch({ ...l, ...patch }) : l)),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      projectId,
      competitors,
      winThemes,
      differentiators,
      evaluatorLenses,
      strategicSummary,
      updateCompetitor,
      updateWinTheme,
      updateDifferentiator,
      updateEvaluatorLens,
    }),
    [
      projectId,
      competitors,
      winThemes,
      differentiators,
      evaluatorLenses,
      strategicSummary,
      updateCompetitor,
      updateWinTheme,
      updateDifferentiator,
      updateEvaluatorLens,
    ],
  );

  return (
    <StrategyContext.Provider value={value}>{children}</StrategyContext.Provider>
  );
}

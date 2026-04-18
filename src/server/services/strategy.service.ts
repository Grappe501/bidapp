import {
  computeStrategicSummary,
  type StrategicSummary,
} from "../../lib/strategy-utils";
import type {
  CompetitorProfile,
  Differentiator,
  EvaluatorLens,
  WinTheme,
} from "../../types";

export function buildStrategicSummary(
  competitors: CompetitorProfile[],
  themes: WinTheme[],
  differentiators: Differentiator[],
  lenses: EvaluatorLens[],
): StrategicSummary {
  return computeStrategicSummary(competitors, themes, differentiators, lenses);
}

export type { StrategicSummary };

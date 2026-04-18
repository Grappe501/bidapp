import type { WinTheme } from "../../types";

const DEFAULT_SECTIONS = [
  "Experience",
  "Solution",
  "Risk",
  "Architecture Narrative",
  "Executive Summary",
  "Interview Prep",
  "Discussion documents",
];

export function sortWinThemesByPriority(themes: WinTheme[]): WinTheme[] {
  return [...themes].sort((a, b) => a.priority - b.priority);
}

export function activeThemes(themes: WinTheme[]): WinTheme[] {
  return themes.filter((t) => t.status === "Active" || t.status === "Approved");
}

/** Sections with no active theme targeting them (advisory). */
export function suggestThemeCoverageGaps(themes: WinTheme[]): string[] {
  const active = activeThemes(themes);
  const covered = new Set(active.flatMap((t) => t.targetSections));
  return DEFAULT_SECTIONS.filter((s) => !covered.has(s));
}

export function suggestCrossCutThemes(themes: WinTheme[]): WinTheme[] {
  return activeThemes(themes).filter((t) => t.targetSections.length >= 4);
}

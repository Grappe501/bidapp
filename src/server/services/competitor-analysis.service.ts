import type { CompetitorProfile, ThreatLevel } from "@/types";

/**
 * Structured competitor profile helpers (curated data — not web scraping).
 */
export function summarizeCompetitorThreat(c: CompetitorProfile): string {
  return `${c.name}: ${c.threatLevel} · ${c.likelyStatus}${c.incumbent ? " · incumbent" : ""}`;
}

export function rankByThreatLevel(
  competitors: CompetitorProfile[],
): CompetitorProfile[] {
  const order: ThreatLevel[] = ["Critical", "High", "Moderate", "Low"];
  return [...competitors].sort(
    (a, b) => order.indexOf(a.threatLevel) - order.indexOf(b.threatLevel),
  );
}

export function aggregateCompetitorNotes(competitors: CompetitorProfile[]): string {
  return competitors
    .map((c) => {
      const b = c.evidenceBasis;
      const tail = b.length > 120 ? `${b.slice(0, 120)}…` : b;
      return `${c.name} (${c.evidenceCharacter}): ${tail}`;
    })
    .join("\n");
}

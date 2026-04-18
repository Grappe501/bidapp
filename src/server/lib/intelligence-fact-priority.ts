import type { DbIntelligenceFact } from "../repositories/intelligence.repo";

/**
 * Lower sort key = preferred for drafting / grounding (operational, verified-ish).
 */
export function groundingSortKey(f: DbIntelligenceFact): number {
  const cred = (f.credibility ?? "").toLowerCase().trim();
  const conf = (f.confidence ?? "").toLowerCase().trim();

  if (cred === "operational" && conf === "high") return 0;
  if (cred === "operational" && conf === "medium") return 1;
  if (cred === "operational" && conf === "low") return 2;
  if (cred === "operational") return 3;
  if (!cred) return 5;
  if (cred === "marketing") return 7;
  if (cred === "inferred") return 9;
  return 6;
}

export function prioritizeFactsForGrounding(
  facts: DbIntelligenceFact[],
  limit: number,
): DbIntelligenceFact[] {
  return [...facts]
    .sort((a, b) => {
      const d = groundingSortKey(a) - groundingSortKey(b);
      if (d !== 0) return d;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    })
    .slice(0, limit);
}

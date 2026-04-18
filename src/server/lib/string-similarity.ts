/**
 * Lightweight string similarity (no ML) for vendor name fuzzy match.
 */

export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array<number>(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }
  return dp[m]![n]!;
}

/** 0..1 similarity (1 = identical). */
export function normalizedLevenshteinSimilarity(a: string, b: string): number {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (na.length === 0 && nb.length === 0) return 1;
  if (na.length === 0 || nb.length === 0) return 0;
  const d = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - d / maxLen;
}

function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    out.add(s.slice(i, i + 2));
  }
  return out;
}

/** Jaccard similarity on character bigrams, 0..1 */
export function bigramJaccard(a: string, b: string): number {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (na.length < 2 && nb.length < 2) return na === nb ? 1 : 0;
  const A = bigrams(na.padEnd(2, "_"));
  const B = bigrams(nb.padEnd(2, "_"));
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter++;
  }
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Blended similarity 0..1 */
export function blendedNameSimilarity(a: string, b: string): number {
  const l = normalizedLevenshteinSimilarity(a, b);
  const j = bigramJaccard(a, b);
  return (l + j) / 2;
}

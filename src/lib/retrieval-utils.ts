/** Cosine similarity in [0,1] when vectors are non-zero (1 = identical direction). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (denom === 0) return 0;
  const sim = dot / denom;
  return Math.max(0, Math.min(1, sim));
}

export function parseEmbeddingJson(v: unknown): number[] {
  if (Array.isArray(v)) {
    return v.map((x) => Number(x));
  }
  if (typeof v === "string") {
    return JSON.parse(v) as number[];
  }
  return [];
}

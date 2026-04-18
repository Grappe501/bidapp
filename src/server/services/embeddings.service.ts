import { defaultEmbeddingModel, getOpenAI } from "./openai-client";

const BATCH = 64;

export type EmbeddingBatchItem = {
  text: string;
  index: number;
};

/**
 * Calls OpenAI embeddings API. Records model name for storage alongside vectors.
 */
export async function embedTextBatch(
  items: EmbeddingBatchItem[],
): Promise<{ model: string; vectors: { index: number; embedding: number[] }[] }> {
  const model = defaultEmbeddingModel();
  const openai = getOpenAI();
  const out: { index: number; embedding: number[] }[] = [];

  for (let i = 0; i < items.length; i += BATCH) {
    const slice = items.slice(i, i + BATCH);
    const res = await openai.embeddings.create({
      model,
      input: slice.map((s) => s.text.slice(0, 8000)),
    });
    for (let j = 0; j < slice.length; j++) {
      const emb = res.data[j]?.embedding;
      if (!emb) continue;
      out.push({ index: slice[j]!.index, embedding: [...emb] });
    }
  }

  return { model, vectors: out };
}

export async function embedQuery(text: string): Promise<{
  model: string;
  embedding: number[];
}> {
  const model = defaultEmbeddingModel();
  const openai = getOpenAI();
  const res = await openai.embeddings.create({
    model,
    input: text.slice(0, 8000),
  });
  const emb = res.data[0]?.embedding;
  if (!emb) throw new Error("Empty embedding response");
  return { model, embedding: [...emb] };
}

import { embedTextBatch } from "../services/embeddings.service";
import {
  insertDocumentEmbedding,
  listUnembeddedChunksForFile,
} from "../repositories/retrieval.repo";

/**
 * Idempotent: only embeds chunks missing rows in document_embeddings.
 */
export async function runEmbedChunksForFileJob(fileId: string): Promise<{
  embedded: number;
}> {
  const pending = await listUnembeddedChunksForFile(fileId);
  if (pending.length === 0) {
    return { embedded: 0 };
  }

  const { model, vectors } = await embedTextBatch(
    pending.map((p, i) => ({ index: i, text: p.content })),
  );

  let n = 0;
  for (const v of vectors) {
    const row = pending[v.index];
    if (!row) continue;
    await insertDocumentEmbedding({
      documentChunkId: row.chunkId,
      fileId: row.fileId,
      projectId: row.projectId,
      embeddingModel: model,
      embeddingVector: v.embedding,
      chunkText: row.content,
    });
    n++;
  }

  return { embedded: n };
}

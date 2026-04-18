import { cosineSimilarity } from "@/lib/retrieval-utils";
import { embedQuery } from "./embeddings.service";
import {
  insertRetrievalQuery,
  insertRetrievalResults,
  listEmbeddingsWithMetaForProject,
  type DbChunkEmbeddingRow,
} from "../repositories/retrieval.repo";
import type { RetrievalQueryType } from "@/types";

export type RetrievedChunk = {
  chunkId: string;
  fileId: string;
  fileName: string;
  chunkIndex: number;
  text: string;
  score: number;
  embeddingModel: string;
};

function rankChunks(
  queryVec: number[],
  rows: DbChunkEmbeddingRow[],
  topK: number,
): RetrievedChunk[] {
  const scored = rows.map((row) => ({
    chunkId: row.documentChunkId,
    fileId: row.fileId,
    fileName: row.fileName,
    chunkIndex: row.chunkIndex,
    text: row.chunkText,
    score: cosineSimilarity(queryVec, row.embeddingVector),
    embeddingModel: row.embeddingModel,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Semantic retrieval over stored chunk embeddings (project-scoped).
 * Persists query + ranked results for observability.
 */
export async function retrieveChunks(input: {
  projectId: string;
  queryText: string;
  queryType: RetrievalQueryType;
  topK?: number;
  fileId?: string;
}): Promise<{ queryId: string; chunks: RetrievedChunk[] }> {
  const topK = input.topK ?? 8;
  const { embedding: queryVec } = await embedQuery(input.queryText);
  const rows = await listEmbeddingsWithMetaForProject(
    input.projectId,
    input.fileId,
  );
  if (rows.length === 0) {
    const q = await insertRetrievalQuery({
      projectId: input.projectId,
      queryText: input.queryText,
      queryType: input.queryType,
      topK,
    });
    return { queryId: q.id, chunks: [] };
  }

  const ranked = rankChunks(queryVec, rows, topK);
  const q = await insertRetrievalQuery({
    projectId: input.projectId,
    queryText: input.queryText,
    queryType: input.queryType,
    topK,
  });
  await insertRetrievalResults(
    q.id,
    ranked.map((c, i) => ({
      documentChunkId: c.chunkId,
      score: c.score,
      rank: i + 1,
    })),
  );
  return { queryId: q.id, chunks: ranked };
}

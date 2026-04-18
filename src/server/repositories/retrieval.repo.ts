import { query } from "../db/client";

export type DbDocumentEmbedding = {
  id: string;
  documentChunkId: string;
  fileId: string;
  projectId: string;
  embeddingModel: string;
  embeddingVector: number[];
  chunkText: string;
  createdAt: string;
  updatedAt: string;
};

export type DbChunkEmbeddingRow = DbDocumentEmbedding & {
  fileName: string;
  chunkIndex: number;
};

export type DbRetrievalQuery = {
  id: string;
  projectId: string;
  queryText: string;
  queryType: string;
  topK: number;
  createdAt: string;
  updatedAt: string;
};

function mapEmbedding(row: Record<string, unknown>): DbDocumentEmbedding {
  const ev = row.embedding_vector;
  const vec: unknown[] = Array.isArray(ev)
    ? (ev as unknown[])
    : (JSON.parse(String(ev)) as unknown[]);
  return {
    id: String(row.id),
    documentChunkId: String(row.document_chunk_id),
    fileId: String(row.file_id),
    projectId: String(row.project_id),
    embeddingModel: String(row.embedding_model),
    embeddingVector: vec.map((x) => Number(x)),
    chunkText: String(row.chunk_text),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function insertDocumentEmbedding(input: {
  documentChunkId: string;
  fileId: string;
  projectId: string;
  embeddingModel: string;
  embeddingVector: number[];
  chunkText: string;
}): Promise<DbDocumentEmbedding> {
  const r = await query(
    `INSERT INTO document_embeddings (
      document_chunk_id, file_id, project_id, embedding_model, embedding_vector, chunk_text, updated_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, now())
    ON CONFLICT (document_chunk_id) DO UPDATE SET
      embedding_model = EXCLUDED.embedding_model,
      embedding_vector = EXCLUDED.embedding_vector,
      chunk_text = EXCLUDED.chunk_text,
      updated_at = now()
    RETURNING *`,
    [
      input.documentChunkId,
      input.fileId,
      input.projectId,
      input.embeddingModel,
      JSON.stringify(input.embeddingVector),
      input.chunkText,
    ],
  );
  return mapEmbedding(r.rows[0] as Record<string, unknown>);
}

export async function listEmbeddingsWithMetaForProject(
  projectId: string,
  fileId?: string,
): Promise<DbChunkEmbeddingRow[]> {
  const r = fileId
    ? await query(
        `SELECT de.*, f.name AS file_name, dc.chunk_index
         FROM document_embeddings de
         JOIN document_chunks dc ON dc.id = de.document_chunk_id
         JOIN files f ON f.id = de.file_id
         WHERE de.project_id = $1 AND de.file_id = $2`,
        [projectId, fileId],
      )
    : await query(
        `SELECT de.*, f.name AS file_name, dc.chunk_index
         FROM document_embeddings de
         JOIN document_chunks dc ON dc.id = de.document_chunk_id
         JOIN files f ON f.id = de.file_id
         WHERE de.project_id = $1`,
        [projectId],
      );

  return r.rows.map((row: Record<string, unknown>) => {
    const base = mapEmbedding(row);
    return {
      ...base,
      fileName: String(row.file_name),
      chunkIndex: Number(row.chunk_index),
    };
  });
}

export async function listUnembeddedChunksForFile(
  fileId: string,
): Promise<
  {
    chunkId: string;
    content: string;
    chunkIndex: number;
    fileId: string;
    projectId: string;
    fileName: string;
  }[]
> {
  const r = await query(
    `SELECT dc.id AS chunk_id, dc.content, dc.chunk_index, f.id AS file_id, f.project_id, f.name AS file_name
     FROM document_chunks dc
     JOIN file_documents fd ON fd.id = dc.file_document_id
     JOIN files f ON f.id = fd.file_id
     WHERE f.id = $1
       AND NOT EXISTS (
         SELECT 1 FROM document_embeddings de WHERE de.document_chunk_id = dc.id
       )
     ORDER BY dc.chunk_index`,
    [fileId],
  );
  return r.rows.map((row: Record<string, unknown>) => ({
    chunkId: String(row.chunk_id),
    content: String(row.content),
    chunkIndex: Number(row.chunk_index),
    fileId: String(row.file_id),
    projectId: String(row.project_id),
    fileName: String(row.file_name),
  }));
}

export async function insertRetrievalQuery(input: {
  projectId: string;
  queryText: string;
  queryType: string;
  topK: number;
}): Promise<DbRetrievalQuery> {
  const r = await query(
    `INSERT INTO retrieval_queries (project_id, query_text, query_type, top_k, updated_at)
     VALUES ($1, $2, $3, $4, now()) RETURNING *`,
    [input.projectId, input.queryText, input.queryType, input.topK],
  );
  const row = r.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    queryText: String(row.query_text),
    queryType: String(row.query_type),
    topK: Number(row.top_k),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function insertRetrievalResults(
  retrievalQueryId: string,
  results: { documentChunkId: string; score: number; rank: number }[],
): Promise<void> {
  for (const res of results) {
    await query(
      `INSERT INTO retrieval_results (retrieval_query_id, document_chunk_id, score, rank, updated_at)
       VALUES ($1, $2, $3, $4, now())`,
      [
        retrievalQueryId,
        res.documentChunkId,
        res.score,
        res.rank,
      ],
    );
  }
}

export async function insertParsedEntity(input: {
  projectId: string;
  sourceType: string;
  sourceId: string;
  entityType: string;
  entityPayloadJson: unknown;
  confidence: number;
  validationStatus: string;
}): Promise<string> {
  const r = await query(
    `INSERT INTO parsed_entities (
      project_id, source_type, source_id, entity_type, entity_payload_json, confidence, validation_status, updated_at
    ) VALUES ($1, $2, $3::uuid, $4, $5::jsonb, $6, $7, now()) RETURNING id`,
    [
      input.projectId,
      input.sourceType,
      input.sourceId,
      input.entityType,
      JSON.stringify(input.entityPayloadJson),
      input.confidence,
      input.validationStatus,
    ],
  );
  return String((r.rows[0] as Record<string, unknown>).id);
}

export async function countEmbeddingsByProject(projectId: string): Promise<number> {
  const r = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM document_embeddings WHERE project_id = $1`,
    [projectId],
  );
  return Number(r.rows[0]?.c ?? 0);
}

export async function countParsedEntitiesByProject(
  projectId: string,
): Promise<number> {
  const r = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM parsed_entities WHERE project_id = $1`,
    [projectId],
  );
  return Number(r.rows[0]?.c ?? 0);
}

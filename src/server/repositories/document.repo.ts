import { query } from "../db/client";

export type DbFileDocument = {
  id: string;
  fileId: string;
  rawText: string;
  mimeType: string | null;
  parserVersion: string;
  createdAt: string;
  updatedAt: string;
};

export type DbDocumentChunk = {
  id: string;
  fileDocumentId: string;
  chunkIndex: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export async function createFileDocument(input: {
  fileId: string;
  rawText: string;
  mimeType?: string | null;
  parserVersion?: string;
}): Promise<DbFileDocument> {
  const r = await query(
    `INSERT INTO file_documents (file_id, raw_text, mime_type, parser_version, updated_at)
     VALUES ($1, $2, $3, $4, now()) RETURNING *`,
    [
      input.fileId,
      input.rawText,
      input.mimeType ?? null,
      input.parserVersion ?? "plain-v1",
    ],
  );
  const row = r.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    fileId: String(row.file_id),
    rawText: String(row.raw_text),
    mimeType: row.mime_type == null ? null : String(row.mime_type),
    parserVersion: String(row.parser_version),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function insertChunks(
  fileDocumentId: string,
  chunks: string[],
): Promise<DbDocumentChunk[]> {
  const out: DbDocumentChunk[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const r = await query(
      `INSERT INTO document_chunks (file_document_id, chunk_index, content, updated_at)
       VALUES ($1, $2, $3, now()) RETURNING *`,
      [fileDocumentId, i, chunks[i]],
    );
    const row = r.rows[0] as Record<string, unknown>;
    out.push({
      id: String(row.id),
      fileDocumentId: String(row.file_document_id),
      chunkIndex: Number(row.chunk_index),
      content: String(row.content),
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    });
  }
  return out;
}

export type DbChunkWithMeta = DbDocumentChunk & {
  fileId: string;
  projectId: string;
  fileName: string;
};

export async function getLatestFileDocumentByFileId(
  fileId: string,
): Promise<DbFileDocument | null> {
  const r = await query(
    `SELECT * FROM file_documents WHERE file_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [fileId],
  );
  if (r.rowCount === 0) return null;
  const row = r.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    fileId: String(row.file_id),
    rawText: String(row.raw_text),
    mimeType: row.mime_type == null ? null : String(row.mime_type),
    parserVersion: String(row.parser_version),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listChunksWithMetaForFile(
  fileId: string,
): Promise<DbChunkWithMeta[]> {
  const r = await query(
    `SELECT dc.*, fd.file_id, f.project_id, f.name AS file_name
     FROM document_chunks dc
     JOIN file_documents fd ON fd.id = dc.file_document_id
     JOIN files f ON f.id = fd.file_id
     WHERE f.id = $1
     ORDER BY dc.chunk_index`,
    [fileId],
  );
  return r.rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    fileDocumentId: String(row.file_document_id),
    chunkIndex: Number(row.chunk_index),
    content: String(row.content),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    fileId: String(row.file_id),
    projectId: String(row.project_id),
    fileName: String(row.file_name),
  }));
}

export async function listChunksByFileDocument(
  fileDocumentId: string,
): Promise<DbDocumentChunk[]> {
  const r = await query(
    `SELECT * FROM document_chunks WHERE file_document_id = $1 ORDER BY chunk_index`,
    [fileDocumentId],
  );
  return r.rows.map((row: Record<string, unknown>) => {
    const x = row as Record<string, unknown>;
    return {
      id: String(x.id),
      fileDocumentId: String(x.file_document_id),
      chunkIndex: Number(x.chunk_index),
      content: String(x.content),
      createdAt: new Date(String(x.created_at)).toISOString(),
      updatedAt: new Date(String(x.updated_at)).toISOString(),
    };
  });
}

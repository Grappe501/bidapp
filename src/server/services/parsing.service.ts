import { createFileDocument, insertChunks } from "../repositories/document.repo";

const DEFAULT_CHUNK = 3500;

/** Postgres UTF-8 text cannot contain NUL; some extractors (e.g. PDF) may emit U+0000. */
function stripNulBytes(s: string): string {
  return s.includes("\0") ? s.replace(/\0/g, "") : s;
}

/** Naive chunking by character length (no AI / semantic boundaries). */
export function splitTextIntoChunks(text: string, maxLen = DEFAULT_CHUNK): string[] {
  const t = text.trim();
  if (t.length === 0) return [];
  const chunks: string[] = [];
  for (let i = 0; i < t.length; i += maxLen) {
    chunks.push(t.slice(i, i + maxLen));
  }
  return chunks;
}

export async function parseAndStoreFileText(input: {
  fileId: string;
  text: string;
  mimeType?: string | null;
  parserVersion?: string;
  chunkSize?: number;
}): Promise<{ documentId: string; chunkCount: number }> {
  const text = stripNulBytes(input.text);
  const doc = await createFileDocument({
    fileId: input.fileId,
    rawText: text,
    mimeType: input.mimeType ?? null,
    parserVersion: input.parserVersion ?? "plain-v1",
  });
  const parts = splitTextIntoChunks(text, input.chunkSize ?? DEFAULT_CHUNK);
  if (parts.length > 0) {
    await insertChunks(doc.id, parts);
  }
  return { documentId: doc.id, chunkCount: parts.length };
}

/**
 * Ingest the official S479 Contract and Grant Disclosure (.pdf) into Postgres:
 * files → file_documents (plain text via pdf-parse) → document_chunks.
 *
 * Usage:
 *   npm run ingest:contract-grant-disclosure -- "C:\path\to\S000000479 Contract and Grant Disclosure.pdf"
 *   S479_CONTRACT_GRANT_DISCLOSURE_PATH="..." npm run ingest:contract-grant-disclosure
 *
 * Requires DATABASE_URL. Optional: OPENAI_API_KEY to embed chunks after ingest.
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { PDFParse } from "pdf-parse";

import { closePool, query } from "../src/server/db/client";
import { uuidFromSeed } from "../src/server/lib/deterministic-uuid";
import { runEmbedChunksForFileJob } from "../src/server/jobs/embed-chunks.job";
import { createFile } from "../src/server/repositories/file.repo";
import { parseAndStoreFileText } from "../src/server/services/parsing.service";
import { MOCK_PROJECT } from "../src/data/mockProject";

const BID_NUMBER = MOCK_PROJECT.bidNumber;
/** Same mock id as `MOCK_FILES` entry `file-015` for deterministic DB row. */
const MOCK_FILE_ID = "file-015";

async function resolveProjectId(): Promise<string> {
  const r = await query(`SELECT id FROM projects WHERE bid_number = $1 LIMIT 1`, [
    BID_NUMBER,
  ]);
  if ((r.rowCount ?? 0) === 0) {
    throw new Error(
      `No project with bid_number ${BID_NUMBER}. Run npm run db:seed (on a fresh DB) or create the project first.`,
    );
  }
  return String((r.rows[0] as { id: string }).id);
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return { text: result.text, pageCount: result.total };
  } finally {
    await parser.destroy();
  }
}

async function main() {
  const argPath = process.argv[2]?.trim();
  const envPath = process.env.S479_CONTRACT_GRANT_DISCLOSURE_PATH?.trim();
  const pdfPath = argPath || envPath;
  if (!pdfPath) {
    throw new Error(
      "Pass the .pdf path as the first argument or set S479_CONTRACT_GRANT_DISCLOSURE_PATH.",
    );
  }
  if (!existsSync(pdfPath)) {
    throw new Error(`File not found: ${pdfPath}`);
  }

  const projectId = await resolveProjectId();
  const fileId = uuidFromSeed(`file:${MOCK_FILE_ID}`);

  const buf = readFileSync(pdfPath);
  const { text, pageCount } = await extractPdfText(buf);
  if (!text.trim()) {
    throw new Error("PDF produced no text (empty, scanned-only, or unreadable).");
  }

  await query(`DELETE FROM files WHERE id = $1`, [fileId]);

  const baseName = pdfPath.replace(/^.*[/\\]/, "");
  await createFile({
    id: fileId,
    projectId,
    name: baseName,
    category: "Compliance",
    sourceType: "Public Agency",
    fileType: "pdf",
    status: "Processed",
    tags: ["S479", "disclosure", "solicitation", "official"],
    description:
      "ARBuy Contract and Grant Disclosure (EO 98-04). Ingested as plain text for retrieval and grounding.",
    noteCount: 0,
    linkedItemCount: 0,
    uploadedAt: new Date().toISOString(),
  });

  const { documentId, chunkCount } = await parseAndStoreFileText({
    fileId,
    text,
    mimeType: "application/pdf",
    parserVersion: "pdf-pdf-parse-v2",
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        projectId,
        fileId,
        documentId,
        pageCount,
        charCount: text.length,
        chunkCount,
      },
      null,
      2,
    ),
  );

  if (process.env.OPENAI_API_KEY?.trim()) {
    try {
      const { embedded } = await runEmbedChunksForFileJob(fileId);
      console.log(JSON.stringify({ embeddedChunks: embedded }, null, 2));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(
        "Embedding failed (text and chunks are stored). Fix OPENAI_API_KEY or run embed-file later.",
        msg,
      );
    }
  } else {
    console.log(
      "OPENAI_API_KEY not set; skipped embeddings. Run embed-file for this fileId when ready.",
    );
  }
}

async function run(): Promise<void> {
  try {
    await main();
  } finally {
    await closePool();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

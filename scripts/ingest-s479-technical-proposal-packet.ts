/**
 * Ingest the official S479 Technical Proposal Packet (.docx) into Postgres:
 * files → file_documents (plain text via mammoth) → document_chunks.
 *
 * Usage:
 *   npm run ingest:technical-proposal-packet -- "C:\path\to\S479 Technical Proposal Packet - Final (1).docx"
 *   S479_TECHNICAL_PROPOSAL_PACKET_PATH="..." npm run ingest:technical-proposal-packet
 *
 * Requires DATABASE_URL. Optional: OPENAI_API_KEY to embed chunks after ingest.
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import mammoth from "mammoth";

import { closePool, query } from "../src/server/db/client";
import { uuidFromSeed } from "../src/server/lib/deterministic-uuid";
import { runEmbedChunksForFileJob } from "../src/server/jobs/embed-chunks.job";
import { createFile } from "../src/server/repositories/file.repo";
import { parseAndStoreFileText } from "../src/server/services/parsing.service";
import { MOCK_PROJECT } from "../src/data/mockProject";

const BID_NUMBER = MOCK_PROJECT.bidNumber;
/** Same mock id as `MOCK_FILES` entry `file-014` for deterministic DB row. */
const MOCK_FILE_ID = "file-014";

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

async function main() {
  const argPath = process.argv[2]?.trim();
  const envPath = process.env.S479_TECHNICAL_PROPOSAL_PACKET_PATH?.trim();
  const docxPath = argPath || envPath;
  if (!docxPath) {
    throw new Error(
      "Pass the .docx path as the first argument or set S479_TECHNICAL_PROPOSAL_PACKET_PATH.",
    );
  }
  if (!existsSync(docxPath)) {
    throw new Error(`File not found: ${docxPath}`);
  }

  const projectId = await resolveProjectId();
  const fileId = uuidFromSeed(`file:${MOCK_FILE_ID}`);

  const buf = readFileSync(docxPath);
  const { value: text } = await mammoth.extractRawText({ buffer: buf });
  if (!text.trim()) {
    throw new Error("Document produced no text (empty or unreadable).");
  }

  await query(`DELETE FROM files WHERE id = $1`, [fileId]);

  const baseName = docxPath.replace(/^.*[/\\]/, "");
  await createFile({
    id: fileId,
    projectId,
    name: baseName,
    category: "Solicitation",
    sourceType: "Public Agency",
    fileType: "docx",
    status: "Processed",
    tags: ["S479", "technical-proposal-packet", "blueprint", "official"],
    description:
      "Official Technical Proposal Packet (state .docx). Ingested as plain text for retrieval and grounding alongside canonical structured model.",
    noteCount: 0,
    linkedItemCount: 0,
    uploadedAt: new Date().toISOString(),
  });

  const { documentId, chunkCount } = await parseAndStoreFileText({
    fileId,
    text,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    parserVersion: "docx-mammoth-v1",
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        projectId,
        fileId,
        documentId,
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

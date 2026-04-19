/**
 * Ingest the official S479 solicitation price sheet (.xlsx) into Postgres:
 * files → file_documents (raw_text as CSV per sheet) → document_chunks.
 *
 * Usage:
 *   npm run ingest:price-sheet -- "C:\path\to\S479 Official Solicitation Price Sheet DHS HDCs - Final (1).xlsx"
 *   S479_PRICE_SHEET_PATH="..." npm run ingest:price-sheet
 *
 * Requires DATABASE_URL. Optional: OPENAI_API_KEY to embed chunks after ingest.
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import * as XLSX from "xlsx";

import { closePool, query } from "../src/server/db/client";
import { uuidFromSeed } from "../src/server/lib/deterministic-uuid";
import { runEmbedChunksForFileJob } from "../src/server/jobs/embed-chunks.job";
import { createFile } from "../src/server/repositories/file.repo";
import { parseAndStoreFileText } from "../src/server/services/parsing.service";
import { MOCK_PROJECT } from "../src/data/mockProject";

const BID_NUMBER = MOCK_PROJECT.bidNumber;
/** Same mock id as `MOCK_FILES` entry so db-seed and this script share one file row. */
const MOCK_FILE_ID = "file-013";

function workbookToPlainText(wb: XLSX.WorkBook): string {
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    const csv = XLSX.utils.sheet_to_csv(sheet);
    parts.push(`## Sheet: ${name}\n\n${csv}`);
  }
  return parts.join("\n\n---\n\n");
}

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
  const envPath = process.env.S479_PRICE_SHEET_PATH?.trim();
  const xlsxPath = argPath || envPath;
  if (!xlsxPath) {
    throw new Error(
      "Pass the .xlsx path as the first argument or set S479_PRICE_SHEET_PATH.",
    );
  }
  if (!existsSync(xlsxPath)) {
    throw new Error(`File not found: ${xlsxPath}`);
  }

  const projectId = await resolveProjectId();
  const fileId = uuidFromSeed(`file:${MOCK_FILE_ID}`);

  const buf = readFileSync(xlsxPath);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true, cellNF: false });
  const text = workbookToPlainText(wb);
  if (!text.trim()) {
    throw new Error("Workbook produced no text (empty or unreadable).");
  }

  await query(`DELETE FROM files WHERE id = $1`, [fileId]);

  const baseName = xlsxPath.replace(/^.*[/\\]/, "");
  await createFile({
    id: fileId,
    projectId,
    name: baseName,
    category: "Pricing",
    sourceType: "Public Agency",
    fileType: "xlsx",
    status: "Processed",
    tags: ["pricing", "official", "S479", "solicitation", "price-sheet"],
    description:
      "Official solicitation price sheet (S479 DHS HDCs). Ingested as tabular text per sheet for retrieval and grounding.",
    noteCount: 0,
    linkedItemCount: 0,
    uploadedAt: new Date().toISOString(),
  });

  const { documentId, chunkCount } = await parseAndStoreFileText({
    fileId,
    text,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    parserVersion: "xlsx-tabular-v1",
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        projectId,
        fileId,
        documentId,
        sheetCount: wb.SheetNames.length,
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
        "Embedding failed (tabular text and chunks are stored). Fix OPENAI_API_KEY or run embed-file later.",
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

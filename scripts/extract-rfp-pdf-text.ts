/**
 * One-off: extract text from local RFP PDF for date verification.
 *   npx tsx scripts/extract-rfp-pdf-text.ts "C:\path\to\file.pdf"
 */
import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";

const p = process.argv[2];
if (!p) {
  console.error("Usage: npx tsx scripts/extract-rfp-pdf-text.ts <path-to.pdf>");
  process.exit(1);
}

const buf = fs.readFileSync(path.resolve(p));
const parser = new PDFParse({ data: buf });
const data = await parser.getText();
await parser.destroy?.();
const text = data.text ?? "";
const out = path.join(process.cwd(), "tmp-rfp-extract.txt");
fs.writeFileSync(out, text, "utf8");
console.log(`Wrote ${text.length} chars to ${out}`);
console.log("--- preview ---\n");
console.log(text.slice(0, 12000));

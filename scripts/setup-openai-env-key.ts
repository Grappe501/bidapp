/**
 * Interactive: paste your OpenAI API key; writes OPENAI_API_KEY=... into `.env` only.
 * Does not modify `.env.example` (keep that file free of real secrets).
 *
 * Usage: npm run setup:openai-key
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

function isValidOpenAiKeyShape(k: string): boolean {
  const t = k.trim();
  return t.startsWith("sk-") && t.length >= 20 && !/\s/.test(t);
}

function upsertOpenAiKeyLine(envText: string, key: string): string {
  const line = `OPENAI_API_KEY=${key.trim()}`;
  if (/^OPENAI_API_KEY=/m.test(envText)) {
    return envText.replace(/^OPENAI_API_KEY=.*$/m, line);
  }
  const trimmed = envText.replace(/\s*$/, "");
  return `${trimmed}\n${line}\n`;
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const envPath = path.join(root, ".env");

  if (!fs.existsSync(envPath)) {
    console.error(
      "`.env` not found. Copy `.env.example` to `.env`, set DATABASE_URL and other values, then run this script again.",
    );
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });

  console.log(
    "\nOpenAI API key setup — value is written only to `.env` (gitignored).\n" +
      "Note: many terminals echo pasted input. Use a private session or paste quickly.\n",
  );

  const raw = await rl.question("Paste OPENAI_API_KEY and press Enter: ");
  rl.close();

  const key = raw.trim();
  if (!key) {
    console.error("No key entered — aborted.");
    process.exit(1);
  }
  if (!isValidOpenAiKeyShape(key)) {
    console.error(
      "Key does not look valid (expected `sk-` prefix, no spaces, reasonable length).",
    );
    process.exit(1);
  }

  let before: string;
  try {
    before = fs.readFileSync(envPath, "utf8");
  } catch (e) {
    console.error("Could not read .env:", e);
    process.exit(1);
  }

  const after = upsertOpenAiKeyLine(before, key);
  fs.writeFileSync(envPath, after, "utf8");

  const masked = `${key.slice(0, 7)}…${key.slice(-4)} (${key.length} chars)`;
  console.log(`\nUpdated OPENAI_API_KEY in .env (${masked}).`);
  console.log("Verify with: npm run check:openai\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

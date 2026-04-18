/**
 * Fails if Vite-style `@/…` path aliases appear under server/runtime trees.
 * Netlify function bundling does not reliably resolve those aliases.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(scriptDir, "..");

const SCAN_ROOTS = ["src/server", "netlify/functions", "scripts"] as const;

/** Static import / dynamic import of a path starting with @/ */
const ALIAS_IMPORT_RE =
  /(?:from\s+["']|import\s*\(\s*["']|require\s*\(\s*["'])@\//;

async function walkTsFiles(dir: string, out: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "dist") continue;
      await walkTsFiles(p, out);
    } else if (
      e.isFile() &&
      (e.name.endsWith(".ts") || e.name.endsWith(".tsx"))
    ) {
      out.push(p);
    }
  }
  return out;
}

async function main() {
  const hits: string[] = [];
  for (const rel of SCAN_ROOTS) {
    const abs = join(repoRoot, rel);
    try {
      await stat(abs);
    } catch {
      continue;
    }
    for (const file of await walkTsFiles(abs)) {
      const text = await readFile(file, "utf8");
      if (ALIAS_IMPORT_RE.test(text)) {
        hits.push(relative(repoRoot, file));
      }
    }
  }
  if (hits.length) {
    console.error(
      "Disallowed `@/…` imports under server/runtime paths (use relative imports):\n",
    );
    for (const h of hits.sort()) console.error(`  ${h}`);
    process.exit(1);
  }
  console.log(
    "check-server-aliases: OK (no `@/…` under src/server, netlify/functions, scripts)",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

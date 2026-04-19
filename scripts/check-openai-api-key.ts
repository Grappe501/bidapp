import "dotenv/config";

import OpenAI from "openai";

function maskKey(k: string): string {
  const t = k.trim();
  if (t.length <= 8) return "(too short to mask)";
  return `${t.slice(0, 7)}…${t.slice(-4)}`;
}

async function main() {
  const raw = process.env.OPENAI_API_KEY;
  if (!raw?.trim()) {
    console.error("OPENAI_API_KEY is not set. Add it to .env (see .env.example).");
    process.exit(1);
  }

  const key = raw.trim();
  console.log(`Key present: ${maskKey(key)} (${key.length} chars)`);

  const openai = new OpenAI({ apiKey: key });

  try {
    const list = await openai.models.list();
    const found = list.data.find((m) => m.id === "gpt-4o-mini");
    console.log(`API reachable: OK (${list.data.length} model id(s) returned).`);
    console.log(
      found
        ? "Model check: gpt-4o-mini is in your available models."
        : "Model check: gpt-4o-mini not listed — embeddings/chat may still work depending on account; ensure project default models match your plan.",
    );
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    console.error("API check failed:", err.status ?? "", err.message ?? e);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { defaultParseModel, getOpenAI } from "./openai-client";
import { insertParsedEntity } from "../repositories/retrieval.repo";

export type AiParseMode =
  | "extract_requirements"
  | "extract_evidence"
  | "extract_submission_items"
  | "extract_company_facts"
  | "extract_vendor_claims";

async function runStructuredJsonCompletion(input: {
  system: string;
  user: string;
}): Promise<unknown> {
  const openai = getOpenAI();
  const model = defaultParseModel();
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  const text = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as unknown;
}

const SYSTEM_BASE = `You are a controlled extraction engine for government procurement. Output valid JSON only. Every extracted item must be traceable to the provided source text. Do not invent citations. Use only the supplied text.`;

function buildPrompts(mode: AiParseMode, truncated: string): {
  system: string;
  user: string;
} {
  let system = SYSTEM_BASE;
  let user = "";

  if (mode === "extract_requirements") {
    system += ` Return shape: {"entities":[{"title","summary","sourceSection","mandatory":boolean,"requirementType","responseCategory"}]}`;
    user = `Extract requirement-like obligations from this source:\n\n${truncated}`;
  } else if (mode === "extract_evidence") {
    system += ` Return shape: {"entities":[{"title","excerpt","evidenceType","suggestedValidationStatus"}]}`;
    user = `Extract verifiable evidence snippets from this source:\n\n${truncated}`;
  } else if (mode === "extract_submission_items") {
    system += ` Return shape: {"entities":[{"name","phase":"Proposal"|"Discussion","required":boolean,"notes"}]}`;
    user = `Extract submission or deliverable items from this source:\n\n${truncated}`;
  } else if (mode === "extract_company_facts") {
    system += ` Return shape: {"entities":[{"factType","factText","confidence":0-1,"provenanceKind":"Verified Fact"|"Vendor Claim"|"Inferred Conclusion"|"Internal Assumption"}]}`;
    user = `Extract structured company intelligence facts from this source:\n\n${truncated}`;
  } else if (mode === "extract_vendor_claims") {
    system += ` Return shape: {"entities":[{"claimText","confidence":0-1,"provenanceKind":"Vendor Claim"|"Inferred Conclusion"}]}`;
    user = `Extract vendor positioning statements or claims grounded in this source:\n\n${truncated}`;
  } else {
    throw new Error(`Unknown parse mode: ${mode}`);
  }

  return { system, user };
}

/**
 * Structured entities only (no DB write). Used by enrichment and tests.
 */
export async function extractEntitiesForMode(
  text: string,
  mode: AiParseMode,
): Promise<unknown[]> {
  const truncated = text.slice(0, 120_000);
  const { system, user } = buildPrompts(mode, truncated);
  const raw = await runStructuredJsonCompletion({ system, user });
  const obj = raw as { entities?: unknown[] };
  return Array.isArray(obj.entities) ? obj.entities : [];
}

function entityConfidence(ent: unknown): number {
  if (typeof ent === "object" && ent !== null && "confidence" in ent) {
    const c = (ent as { confidence: unknown }).confidence;
    if (typeof c === "number" && !Number.isNaN(c)) return c;
  }
  return 0.5;
}

export async function parseDocumentWithAi(input: {
  projectId: string;
  sourceType: string;
  sourceId: string;
  text: string;
  mode: AiParseMode;
}): Promise<string[]> {
  const entities = await extractEntitiesForMode(input.text, input.mode);
  const ids: string[] = [];

  for (const ent of entities) {
    const id = await insertParsedEntity({
      projectId: input.projectId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      entityType: input.mode,
      entityPayloadJson: ent,
      confidence: entityConfidence(ent),
      validationStatus: "Pending Validation",
    });
    ids.push(id);
  }

  return ids;
}

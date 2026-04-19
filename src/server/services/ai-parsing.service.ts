import { defaultParseModel, getOpenAI } from "./openai-client";
import { insertParsedEntity } from "../repositories/retrieval.repo";
import {
  createIntelligenceFact,
  deleteIntelligenceFactsBySourceAndFactTypes,
  getIntelligenceSource,
  intelligenceFactExistsForSource,
  mergeIntelligenceSourceMetadata,
} from "../repositories/intelligence.repo";

export type AiParseMode =
  | "extract_requirements"
  | "extract_evidence"
  | "extract_submission_items"
  | "extract_company_facts"
  | "extract_vendor_claims"
  | "extract_vendor_research_facets";

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
    system += ` Return shape: {"entities":[{"claimText","credibility":"operational"|"marketing"|"inferred","confidence":"high"|"medium"|"low","claimCategory":"capability"|"integration"|"staffing"|"compliance"|"delivery"|"reporting"|"technology"|"other","modelConfidence":0-1,"provenanceKind":"Vendor Claim"|"Inferred Conclusion"}]}. Classify conservatively: marketing fluff → marketing/low; concrete capabilities with specifics → operational/medium or high only when clearly supported by the text.`;
    user = `Extract vendor positioning statements or claims grounded in this source:\n\n${truncated}`;
  } else if (mode === "extract_vendor_research_facets") {
    system += ` Return shape: {"facets":[{"bucket":"performance"|"integration_surface"|"risk","factText","confidence":"high"|"medium"|"low"}]}. Only include statements directly supported by the supplied text; omit bucket if nothing defensible.`;
    user = `From this vendor-related page text, extract performance characteristics, integration or API touchpoints, and risks or dependencies:\n\n${truncated}`;
  } else {
    throw new Error(`Unknown parse mode: ${mode}`);
  }

  return { system, user };
}

/** Fact rows owned by the AllCare public-site AI extractor (safe to replace on reparse). */
export const ALLCARE_MANAGED_FACT_TYPES = [
  "ai_tag",
  "page_summary",
  "allcare_fact",
  "capability",
  "technology_reference",
  "contact_block",
] as const;

export type FactCredibility = "operational" | "marketing" | "inferred";
export type FactConfidence = "high" | "medium" | "low";

export type AllCareStructuredExtract = {
  company_name: string;
  page_summary: string;
  page_summary_credibility?: FactCredibility;
  page_summary_confidence?: FactConfidence;
  ai_tags: { tag: string; credibility: FactCredibility; confidence: FactConfidence }[];
  facts: {
    fact_type: string;
    fact_text: string;
    validation_status?: string;
    credibility: FactCredibility;
    confidence: FactConfidence;
  }[];
  contacts: {
    label: string;
    address?: string;
    phone?: string;
    email?: string;
  }[];
  capabilities: {
    text: string;
    credibility: FactCredibility;
    confidence: FactConfidence;
  }[];
  technology_references: {
    text: string;
    credibility: FactCredibility;
    confidence: FactConfidence;
  }[];
};

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normCred(v: string | undefined, fallback: FactCredibility): FactCredibility {
  const x = (v ?? "").toLowerCase().trim();
  if (x === "operational" || x === "marketing" || x === "inferred") return x;
  return fallback;
}

function normConf(v: string | undefined, fallback: FactConfidence): FactConfidence {
  const x = (v ?? "").toLowerCase().trim();
  if (x === "high" || x === "medium" || x === "low") return x;
  return fallback;
}

export type VendorClaimCategory =
  | "capability"
  | "integration"
  | "staffing"
  | "compliance"
  | "delivery"
  | "reporting"
  | "technology"
  | "other";

export type NormalizedVendorClaim = {
  claimText: string;
  credibility: FactCredibility;
  confidence: FactConfidence;
  claimCategory: VendorClaimCategory;
  provenanceKind: string;
  validationStatus: string;
  modelConfidence: number;
};

const CLAIM_CATS: VendorClaimCategory[] = [
  "capability",
  "integration",
  "staffing",
  "compliance",
  "delivery",
  "reporting",
  "technology",
  "other",
];

function inferVendorClaimMetadata(text: string): {
  credibility: FactCredibility;
  confidence: FactConfidence;
  claimCategory: VendorClaimCategory;
} {
  const raw = text.trim();
  const t = raw.toLowerCase();
  let claimCategory: VendorClaimCategory = "other";
  if (/hipaa|dea|cms|compliance|audit|accredit/.test(t)) claimCategory = "compliance";
  else if (/integrat|api|interfac|hl7|fhir|emr|ehr/.test(t))
    claimCategory = "integration";
  else if (/staff|pharmacist|credential|hire|team\s+of/.test(t))
    claimCategory = "staffing";
  else if (
    /deliver|route|courier|ship|dispens|fulfill|hour|hours|24\s*\/\s*7|24\s*7/.test(
      t,
    )
  )
    claimCategory = "delivery";
  else if (/report|dashboard|analytics|metric|kpi/.test(t))
    claimCategory = "reporting";
  else if (/software|system|platform|technology|cloud|saas/.test(t))
    claimCategory = "technology";
  else if (/servic|support|program|offer|provid|solution/.test(t))
    claimCategory = "capability";

  if (
    /leading|trusted|premier|world[- ]class|best[- ]in|renowned|exceptional|innovative|high quality/.test(
      t,
    )
  ) {
    return { credibility: "marketing", confidence: "low", claimCategory };
  }

  if (
    claimCategory === "integration" ||
    claimCategory === "technology" ||
    claimCategory === "staffing" ||
    claimCategory === "delivery" ||
    claimCategory === "reporting" ||
    claimCategory === "compliance"
  ) {
    return { credibility: "operational", confidence: "medium", claimCategory };
  }

  if (/\d|24\s*\/\s*7|24\s*7|\d+\s*%|\d+\s+years|states?|locations?/i.test(t)) {
    return { credibility: "operational", confidence: "medium", claimCategory };
  }

  if (
    claimCategory === "capability" &&
    /partner|tailored|dedicated|committed|proud|mission|values/.test(t) &&
    !/\d/.test(t)
  ) {
    return { credibility: "marketing", confidence: "low", claimCategory };
  }

  if (raw.length > 0 && raw.length < 18 && !/\d/.test(t)) {
    return { credibility: "inferred", confidence: "low", claimCategory };
  }

  if (claimCategory === "other" || claimCategory === "capability") {
    return { credibility: "inferred", confidence: "low", claimCategory };
  }

  return { credibility: "inferred", confidence: "low", claimCategory };
}

function normClaimCategory(v: string): VendorClaimCategory {
  const x = v.toLowerCase().trim();
  return CLAIM_CATS.includes(x as VendorClaimCategory)
    ? (x as VendorClaimCategory)
    : "other";
}

/**
 * Normalizes a vendor-claim extraction entity (LLM or legacy shape). Safe to call repeatedly.
 */
export function normalizeVendorClaimEntity(raw: unknown): NormalizedVendorClaim {
  const e =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  const claimText = String(e.claimText ?? e.claim_text ?? "").trim();
  const pk = String(e.provenanceKind ?? "Vendor Claim");
  let modelConfidence = 0.5;
  if (typeof e.modelConfidence === "number" && !Number.isNaN(e.modelConfidence)) {
    modelConfidence = e.modelConfidence;
  } else if (typeof e.confidence === "number" && !Number.isNaN(e.confidence)) {
    modelConfidence = e.confidence;
  }

  const inferred = inferVendorClaimMetadata(claimText);
  const llmCred = asString(e.credibility);
  const confStr =
    typeof e.confidence === "string" ? String(e.confidence).trim() : "";
  const llmConf =
    confStr || asString(e.confidence_label ?? e.confidenceTier);
  const credibility = normCred(llmCred, inferred.credibility);
  let confidence = normConf(llmConf, inferred.confidence);

  if (!confStr && typeof e.confidence === "number") {
    if (modelConfidence >= 0.75) confidence = "medium";
    else if (modelConfidence < 0.4) confidence = "low";
    else confidence = normConf(undefined, inferred.confidence);
  }

  if (credibility === "marketing" && confidence === "high") {
    confidence = "medium";
  }

  const rawCat = asString(e.claimCategory ?? e.claim_category).trim();
  const claimCategory = normClaimCategory(
    rawCat || inferred.claimCategory,
  );

  return {
    claimText,
    credibility,
    confidence,
    claimCategory,
    provenanceKind: pk,
    validationStatus: pk === "Inferred Conclusion" ? "Inferred" : "Unverified",
    modelConfidence,
  };
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
  if (mode === "extract_vendor_research_facets") {
    const obj = raw as { facets?: unknown[] };
    return Array.isArray(obj.facets) ? obj.facets : [];
  }
  const obj = raw as { entities?: unknown[] };
  const entities = Array.isArray(obj.entities) ? obj.entities : [];
  if (mode === "extract_vendor_claims") {
    return entities.map((ent) => normalizeVendorClaimEntity(ent));
  }
  return entities;
}

/** Structured extraction for vendor public-site pages (integration hints + risk signals). */
export async function extractVendorWebSignals(input: {
  text: string;
  pageType: string;
}): Promise<{
  facts: Array<{
    factType: string;
    factText: string;
    confidence: string;
    credibility: string;
  }>;
  integrationRequirementHints: Array<{
    requirementKey: string;
    statusHint: string;
    evidenceSnippet: string;
  }>;
  riskHints: string[];
}> {
  const truncated = input.text.slice(0, 100_000);
  const system =
    SYSTEM_BASE +
    ` Return JSON only: {"facts":[{"factType","factText","confidence":"high"|"medium"|"low","credibility":"operational"|"marketing"|"inferred"}],"integration_requirement_hints":[{"requirementKey","statusHint","evidenceSnippet"}],"risk_hints":["string"]}. Only include facts grounded in the text.`;
  const user = `Vendor website page classification: ${input.pageType}\n\n${truncated}`;
  const raw = await runStructuredJsonCompletion({ system, user });
  const o =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const factsRaw = Array.isArray(o.facts) ? o.facts : [];
  const facts = factsRaw.map((x) => {
    const r = x as Record<string, unknown>;
    return {
      factType: String(r.factType ?? "general"),
      factText: String(r.factText ?? ""),
      confidence: String(r.confidence ?? "medium"),
      credibility: String(r.credibility ?? "operational"),
    };
  });
  const intRaw = Array.isArray(o.integration_requirement_hints)
    ? o.integration_requirement_hints
    : [];
  const integrationRequirementHints = intRaw.map((x) => {
    const r = x as Record<string, unknown>;
    return {
      requirementKey: String(r.requirementKey ?? ""),
      statusHint: String(r.statusHint ?? ""),
      evidenceSnippet: String(r.evidenceSnippet ?? ""),
    };
  });
  const riskRaw = Array.isArray(o.risk_hints) ? o.risk_hints : [];
  const riskHints = riskRaw.map((x) => String(x)).filter(Boolean);
  return { facts, integrationRequirementHints, riskHints };
}

function entityConfidence(ent: unknown): number {
  if (typeof ent === "object" && ent !== null && "modelConfidence" in ent) {
    const m = (ent as { modelConfidence: unknown }).modelConfidence;
    if (typeof m === "number" && !Number.isNaN(m)) return m;
  }
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

function inferCapabilityCredibility(text: string): {
  credibility: FactCredibility;
  confidence: FactConfidence;
} {
  const t = text.toLowerCase();
  if (
    /\d+\s*\+|\d+\s*years|24\s*\/\s*7|24\s*7|daily|weekly|delivery|exactmed|imar|pharmacist|location|statewide|licensed\s+\d+/i.test(
      t,
    )
  ) {
    return { credibility: "operational", confidence: "high" };
  }
  if (
    /leading|trusted|premier|best-in|world-class|exceptional|quality you|we care/i.test(
      t,
    )
  ) {
    return { credibility: "marketing", confidence: "low" };
  }
  return { credibility: "operational", confidence: "medium" };
}

function inferTagCred(tag: string): {
  credibility: FactCredibility;
  confidence: FactConfidence;
} {
  const t = tag.toLowerCase().replace(/_/g, " ");
  if (
    /ltc|long term|pharm|delivery|exactmed|imar|24|location|state|licensed|pharmacist/.test(
      t,
    )
  ) {
    return { credibility: "operational", confidence: "medium" };
  }
  return { credibility: "marketing", confidence: "low" };
}

function parseTaggedStrings(
  raw: unknown,
  fallback: (text: string) => { credibility: FactCredibility; confidence: FactConfidence },
): { text: string; credibility: FactCredibility; confidence: FactConfidence }[] {
  if (!Array.isArray(raw)) return [];
  const out: {
    text: string;
    credibility: FactCredibility;
    confidence: FactConfidence;
  }[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      const inf = fallback(item.trim());
      out.push({ text: item.trim(), ...inf });
      continue;
    }
    if (typeof item === "object" && item !== null && "text" in item) {
      const o = item as Record<string, unknown>;
      const text = asString(o.text).trim();
      if (!text) continue;
      out.push({
        text,
        credibility: normCred(
          asString(o.credibility),
          inferCapabilityCredibility(text).credibility,
        ),
        confidence: normConf(
          asString(o.confidence),
          inferCapabilityCredibility(text).confidence,
        ),
      });
    }
  }
  return out;
}

function parseAiTags(raw: unknown): AllCareStructuredExtract["ai_tags"] {
  if (!Array.isArray(raw)) return [];
  const out: AllCareStructuredExtract["ai_tags"] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      const tag = item.trim();
      const inf = inferTagCred(tag);
      out.push({ tag, ...inf });
      continue;
    }
    if (typeof item === "object" && item !== null) {
      const o = item as Record<string, unknown>;
      const tag = asString(o.tag ?? o.label).trim();
      if (!tag) continue;
      const inf = inferTagCred(tag);
      out.push({
        tag,
        credibility: normCred(asString(o.credibility), inf.credibility),
        confidence: normConf(asString(o.confidence), inf.confidence),
      });
    }
  }
  return out;
}

/**
 * Structured extraction for a single AllCare marketing page (JSON contract).
 */
export async function parseAllCarePublicPageStructured(input: {
  pageUrl: string;
  pageTitle: string | null;
  pageLabel: string;
  bodyText: string;
}): Promise<AllCareStructuredExtract> {
  const system = `You extract structured marketing intelligence from ONE public web page for AllCare Pharmacy. Output JSON only. Every field must be grounded in the supplied page text — do not invent addresses, phone numbers, licenses, or certifications.

Return JSON with this shape (arrays may contain objects OR plain strings for backward compatibility):
{
  "company_name": "",
  "page_summary": "",
  "page_summary_credibility": "operational"|"marketing"|"inferred",
  "page_summary_confidence": "high"|"medium"|"low",
  "ai_tags": [ {"tag":"snake_case_label","credibility":"operational"|"marketing"|"inferred","confidence":"high"|"medium"|"low"} ],
  "facts": [ {"fact_type":"","fact_text":"","credibility":"...","confidence":"..."} ],
  "contacts": [ {"label":"","address":"","phone":"","email":""} ],
  "capabilities": [ {"text":"","credibility":"...","confidence":"..."} ],
  "technology_references": [ {"text":"","credibility":"...","confidence":"..."} ]
}

Credibility rules:
- operational: concrete services, hours (e.g. 24/7), delivery frequency, named systems, measurable claims, locations.
- marketing: superlatives ("leading", "trusted", "premier"), vague quality without specifics.
- inferred: only when the page structure implies something not stated verbatim (use sparingly).

Confidence rules:
- high: specific numbers, named products, repeated concrete detail.
- medium: clear single-source statement.
- low: vague or ambiguous phrasing.`;

  const user = `Page URL: ${input.pageUrl}
Page label (heuristic): ${input.pageLabel}
Title: ${input.pageTitle ?? ""}

Page text:
${input.bodyText.slice(0, 100_000)}`;

  const openai = getOpenAI();
  const model = defaultParseModel();
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });
  const text = completion.choices[0]?.message?.content ?? "{}";
  const raw = JSON.parse(text) as Record<string, unknown>;

  const factsRaw = Array.isArray(raw.facts) ? raw.facts : [];
  const facts = factsRaw
    .map((f) => {
      const o = f as Record<string, unknown>;
      const fact_text = asString(o.fact_text).trim();
      const inf = inferCapabilityCredibility(fact_text);
      return {
        fact_type: asString(o.fact_type, "public_claim"),
        fact_text,
        validation_status: asString(o.validation_status, "vendor_claim"),
        credibility: normCred(asString(o.credibility), inf.credibility),
        confidence: normConf(asString(o.confidence), inf.confidence),
      };
    })
    .filter((f) => f.fact_text.length > 0);

  const contactsRaw = Array.isArray(raw.contacts) ? raw.contacts : [];
  const contacts = contactsRaw.map((c) => {
    const o = c as Record<string, unknown>;
    return {
      label: asString(o.label, "contact"),
      address: asString(o.address),
      phone: asString(o.phone),
      email: asString(o.email),
    };
  });

  const capabilities = parseTaggedStrings(raw.capabilities, inferCapabilityCredibility);
  const technology_references = parseTaggedStrings(
    raw.technology_references,
    (t) => {
      const inf = inferCapabilityCredibility(t);
      return {
        credibility: inf.credibility === "marketing" ? "operational" : inf.credibility,
        confidence: /\d|exactmed|imar|fms|system/i.test(t) ? "high" : "medium",
      };
    },
  );

  const ai_tags = parseAiTags(raw.ai_tags);

  const page_summary = asString(raw.page_summary).trim();
  const summaryInf = inferCapabilityCredibility(page_summary || "x");

  return {
    company_name: asString(raw.company_name, "AllCare Pharmacy"),
    page_summary,
    page_summary_credibility: normCred(
      asString(raw.page_summary_credibility),
      summaryInf.credibility,
    ),
    page_summary_confidence: normConf(
      asString(raw.page_summary_confidence),
      /\d/.test(page_summary) ? "high" : "medium",
    ),
    ai_tags,
    facts,
    contacts,
    capabilities,
    technology_references,
  };
}

/**
 * Persists AllCare structured extraction as intelligence_facts with vendor_claim posture.
 * Skips work when the source was already parsed unless forceReparse is true.
 */
export async function persistAllCareStructuredFacts(input: {
  projectId: string;
  companyProfileId: string;
  sourceId: string;
  structured: AllCareStructuredExtract;
  forceReparse?: boolean;
}): Promise<{ factsCreated: number; tagsCreated: number }> {
  const src = await getIntelligenceSource(input.sourceId);
  if (!src) {
    throw new Error(`intelligence_sources row not found: ${input.sourceId}`);
  }

  const already =
    typeof src.metadata.allcare_ai_parsed_at === "string" &&
    src.metadata.allcare_ai_parsed_at.length > 0;
  if (already && !input.forceReparse) {
    return { factsCreated: 0, tagsCreated: 0 };
  }

  await deleteIntelligenceFactsBySourceAndFactTypes({
    sourceId: input.sourceId,
    factTypes: [...ALLCARE_MANAGED_FACT_TYPES],
  });

  let factsCreated = 0;
  let tagsCreated = 0;
  const vStatus = "Unverified";
  const vClass = "vendor_claim";

  async function insertFactDeduped(fact: {
    factType: string;
    factText: string;
    classification: string;
    credibility: string;
    confidence: string;
  }): Promise<boolean> {
    const exists = await intelligenceFactExistsForSource({
      sourceId: input.sourceId,
      factType: fact.factType,
      factText: fact.factText,
    });
    if (exists) return false;
    await createIntelligenceFact({
      projectId: input.projectId,
      sourceId: input.sourceId,
      companyProfileId: input.companyProfileId,
      factType: fact.factType,
      factText: fact.factText,
      classification: fact.classification,
      validationStatus: vStatus,
      credibility: fact.credibility,
      confidence: fact.confidence,
    });
    return true;
  }

  if (input.structured.page_summary.trim()) {
    const text = input.structured.page_summary.trim();
    if (
      await insertFactDeduped({
        factType: "page_summary",
        factText: text,
        classification: vClass,
        credibility: input.structured.page_summary_credibility ?? "operational",
        confidence: input.structured.page_summary_confidence ?? "medium",
      })
    ) {
      factsCreated++;
    }
  }

  for (const row of input.structured.ai_tags) {
    const t = row.tag.trim();
    if (!t) continue;
    if (
      await insertFactDeduped({
        factType: "ai_tag",
        factText: t,
        classification: vClass,
        credibility: row.credibility,
        confidence: row.confidence,
      })
    ) {
      factsCreated++;
      tagsCreated++;
    }
  }

  for (const f of input.structured.facts) {
    if (
      await insertFactDeduped({
        factType: "allcare_fact",
        factText: f.fact_text,
        classification: f.fact_type || vClass,
        credibility: f.credibility,
        confidence: f.confidence,
      })
    ) {
      factsCreated++;
    }
  }

  for (const c of input.structured.capabilities) {
    const x = c.text.trim();
    if (!x) continue;
    if (
      await insertFactDeduped({
        factType: "capability",
        factText: x,
        classification: vClass,
        credibility: c.credibility,
        confidence: c.confidence,
      })
    ) {
      factsCreated++;
    }
  }

  for (const tech of input.structured.technology_references) {
    const x = tech.text.trim();
    if (!x) continue;
    if (
      await insertFactDeduped({
        factType: "technology_reference",
        factText: x,
        classification: vClass,
        credibility: tech.credibility,
        confidence: tech.confidence,
      })
    ) {
      factsCreated++;
    }
  }

  for (const contact of input.structured.contacts) {
    const payload = JSON.stringify(contact);
    if (payload.length < 10) continue;
    if (
      await insertFactDeduped({
        factType: "contact_block",
        factText: payload,
        classification: vClass,
        credibility: "operational",
        confidence: "medium",
      })
    ) {
      factsCreated++;
    }
  }

  await mergeIntelligenceSourceMetadata({
    id: input.sourceId,
    patch: {
      allcare_ai_parsed_at: new Date().toISOString(),
      allcare_structured_company_name: input.structured.company_name,
    },
  });

  return { factsCreated, tagsCreated };
}

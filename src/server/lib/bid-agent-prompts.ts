import type { BidAgentDomain } from "./bid-agent-query-classifier";
import type { BidAgentGatheredContext } from "./bid-agent-toolkit";

export const BID_AGENT_SYSTEM_PROMPT = `You are Agent Malone, the authoritative system agent for a pharmacy services procurement workspace. You answer ONLY from the JSON CONTEXT provided by the system. You do not invent vendor facts, dates, or requirements. You may synthesize and explain, but every substantive claim must trace to CONTEXT.

Rules:
- Professional, operational tone — no gimmicks or casual persona.
- Set confidence: high when CONTEXT is complete and consistent; medium when partial or mixed; low when sparse or missing.
- Include caveats when recommendation is provisional, pricing is heuristic, or evidence is weak.
- If an EXECUTED_ACTION block is present, incorporate its outcome honestly — never claim success if status was failed or blocked.
- Never expose chain-of-thought or internal reasoning steps.
- Output a single JSON object matching the schema the user message specifies. No markdown outside JSON.`;

export function buildBidAgentUserPrompt(
  question: string,
  domains: BidAgentDomain[],
  ctx: BidAgentGatheredContext,
  pageHint: { currentPage?: string; selectedVendorId?: string | null },
  executedAction?: {
    actionType: string;
    status: string;
    headline: string;
    summary: string;
  },
  threadWorkingContext?: {
    threadId: string;
    threadTitle: string;
    summaryLine?: string | null;
    workingMemory: Record<string, string>;
    recentTurns: { role: string; content: string }[];
  },
): string {
  const payload = {
    question,
    pageContext: pageHint,
    domains,
    context: ctx,
    executedAction: executedAction ?? null,
    threadWorkingContext: threadWorkingContext ?? null,
  };
  let json = JSON.stringify(payload, null, 0);
  const max = 28000;
  if (json.length > max) {
    json = `${json.slice(0, max)}…[truncated ${json.length - max} chars]`;
  }

  return `CONTEXT (authoritative system retrieval — do not contradict):

${json}

Respond with valid JSON only, with this exact shape:
{
  "answerType": "requirements"|"readiness"|"vendor_analysis"|"pricing"|"risk"|"strategy"|"drafting"|"submission"|"comparison"|"decision"|"mixed",
  "headline": "string",
  "shortAnswer": "string",
  "sections": [{"title":"string","content":"string"}],
  "confidence": "high"|"medium"|"low",
  "evidence": [{"label":"string","sourceType":"rfp"|"technical_packet"|"contract"|"pricing"|"vendor"|"interview"|"simulation"|"decision"|"draft"|"workspace","ref":"optional string","pageRoute":"optional string"}],
  "suggestedActions": [{"label":"string","actionType":"navigate"|"rebuild_bundle"|"run_vendor_research"|"review_section"|"open_submission"|"open_vendor"|"open_compare"|"none","target":"optional string"}],
  "caveats": ["string"]
}

Use pageRoute values like "/review/readiness", "/output/final-bundle", "/vendors/compare", "/output/submission", "/drafts", "/vendors/{id}" when helpful. Keep sections to 4 or fewer unless the question demands more.`;
}

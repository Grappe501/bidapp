import type { AgentMaloneActionType } from "../../types";

export type ParsedMaloneIntent =
  | { kind: "question" }
  | { kind: "action"; actionType: AgentMaloneActionType; bundleHint?: string };

/**
 * Pragmatic intent: detect operational verbs + domain phrases. No ML required for V2.
 */
export function parseMaloneActionIntentFromQuestion(
  question: string,
): ParsedMaloneIntent {
  const s = question.trim();
  const lower = s.toLowerCase();

  if (s.length === 0) return { kind: "question" };

  const looksLikeAction =
    /^(run|execute|start|trigger|build|refresh|re-?run|recompute|generate)\b/i.test(
      s,
    ) || /\b(now|please)\s*\.?\s*$/i.test(s);

  if (!looksLikeAction && !/\b(then|after that|also)\b/i.test(lower)) {
    return { kind: "question" };
  }

  if (/\bopen\s+/.test(lower) && /\b(page|tab)\b/.test(lower)) {
    return { kind: "action", actionType: "open_page" };
  }

  if (/\bstrategy\s+state\b|\brefresh\s+strategy\b|\bstrategy\s+refresh\b/i.test(s)) {
    return { kind: "action", actionType: "run_strategy_refresh_recipe" };
  }

  if (/\binterview\s+prep\b|\bprepare\s+(for\s+)?interview\b/i.test(s)) {
    return { kind: "action", actionType: "run_vendor_interview_prep_recipe" };
  }

  if (/\bcompetitor\s*(simulation)?\b|\brun\s+competitor\b/i.test(lower)) {
    return { kind: "action", actionType: "run_competitor_simulation" };
  }

  if (/\bdecision\s+synth/i.test(lower)) {
    return { kind: "action", actionType: "run_decision_synthesis" };
  }

  if (/\bnarrative\s+align/i.test(lower)) {
    return { kind: "action", actionType: "run_narrative_alignment" };
  }

  if (/\bfinal\s+readiness\b|\brefresh\s+readiness\b|\breadiness\s+refresh\b/i.test(lower)) {
    return { kind: "action", actionType: "refresh_final_readiness" };
  }

  if (/\bgrounding\s+bundle\b|\bbuild\s+(a\s+)?(new\s+)?(solution|risk|interview|experience)\b/i.test(lower)) {
    let bundleHint: string | undefined;
    if (/\bsolution\b/i.test(s)) bundleHint = "Solution";
    else if (/\brisk\b/i.test(s)) bundleHint = "Risk";
    else if (/\binterview\b/i.test(s)) bundleHint = "Interview";
    else if (/\bexperience\b/i.test(s)) bundleHint = "Experience";
    return { kind: "action", actionType: "build_grounding_bundle", bundleHint };
  }

  if (/\bvendor\s+research\b|\brun\s+research\b|\bcrawl\b.*\bvendor\b/i.test(lower)) {
    return { kind: "action", actionType: "run_vendor_research" };
  }

  if (/\bclaim\s+valid/i.test(lower)) {
    return { kind: "action", actionType: "run_claim_validation" };
  }

  if (/\bfailure\s*(sim|mode)?\b|\bstress\s+test\b/i.test(lower)) {
    return { kind: "action", actionType: "run_failure_simulation" };
  }

  if (/\brole\s+fit\b|\bmalone\b.*\bfit\b/i.test(lower)) {
    return { kind: "action", actionType: "run_role_fit" };
  }

  if (/\bpricing\s+reality\b|\breality\s+check\b.*\bpric/i.test(lower)) {
    return { kind: "action", actionType: "run_pricing_reality" };
  }

  if (/\bfit\b.*\bscore\b|\bcompute\s+fit\b|\bvendor\s+fit\b/i.test(lower)) {
    return { kind: "action", actionType: "compute_vendor_fit" };
  }

  if (/\bscore\b.*\bvendor\b|\bcompute\s+score\b/i.test(lower)) {
    return { kind: "action", actionType: "compute_vendor_score" };
  }

  if (/\binterview\s+question/i.test(lower)) {
    return { kind: "action", actionType: "generate_vendor_interview" };
  }

  if (/\bgenerate\s+draft\b|\bwrite\s+(the\s+)?(solution|risk)\s+(section|draft)\b/i.test(lower)) {
    let bundleHint: string | undefined;
    if (/\bsolution\b/i.test(s)) bundleHint = "Solution";
    if (/\brisk\b/i.test(s)) bundleHint = "Risk";
    return { kind: "action", actionType: "generate_draft", bundleHint };
  }

  if (/\bcopy\b.*\bexport\b|\bexport\s+(summary|readiness)\b/i.test(lower)) {
    return { kind: "action", actionType: "copy_export" };
  }

  return { kind: "question" };
}

/**
 * Review rule catalog and types for Netlify/server callers (BP-007).
 * Core rule execution lives in {@link runReviewRules} in `src/lib/review-rules-engine.ts`.
 */
export { REVIEW_RULE_GROUPS } from "@/lib/review-catalog";
export type { BidReviewSnapshot } from "@/lib/review-rules-engine";

/**
 * v1 taxonomy: comparable keys for MatrixCare / delivery / compliance style claims for S479-style bids.
 * Extend with new { key, category, patterns } rows — keep keys stable for persistence.
 */

export type ClaimCategory =
  | "integration"
  | "delivery"
  | "clinical"
  | "compliance"
  | "security"
  | "pricing"
  | "implementation"
  | "experience"
  | "support"
  | "differentiation"
  | "billing"
  | "packaging"
  | "other";

export type TaxonomyEntry = {
  key: string;
  category: ClaimCategory;
  /** Match claim or fact text */
  patterns: RegExp[];
};

const KNOWN_KEYS: Map<string, ClaimCategory> = new Map();

/** Ordered: first match wins. */
export const CLAIM_TAXONOMY_V1: TaxonomyEntry[] = [
  {
    key: "integration.matrixcare",
    category: "integration",
    patterns: [/matrixcare/i, /matrix\s*care/i],
  },
  {
    key: "integration.bidirectional_interface",
    category: "integration",
    patterns: [/bidirectional|two[\s-]?way/i, /interface.*both/i],
  },
  {
    key: "integration.real_time_batch",
    category: "integration",
    patterns: [/real[\s-]?time.*batch|batch.*(feed|hl7)|hl7.*(batch|real)/i],
  },
  {
    key: "delivery.24_7_support",
    category: "delivery",
    patterns: [/24\s*[/\s]*7|round[\s-]?the[\s-]?clock|after[\s-]?hours|on[\s-]?call/i],
  },
  {
    key: "delivery.two_hour_emergency",
    category: "delivery",
    patterns: [/2[\s-]?(hour|hr)|two[\s-]?hour|emergency|stat|urgent|same[\s-]?day/i],
  },
  {
    key: "clinical.prior_authorization",
    category: "clinical",
    patterns: [/prior\s*auth|pa\s+(workflow|program)|prior\s*authorization/i],
  },
  {
    key: "billing.medicaid_expertise",
    category: "billing",
    patterns: [/medicaid|mmis|state\s+(funds|claims|billing)/i],
  },
  {
    key: "packaging.blister_packaging",
    category: "packaging",
    patterns: [/blister|unit[\s-]?dose|multi[\s-]?dose|packaging/i],
  },
  {
    key: "compliance.hipaa_hitech",
    category: "compliance",
    patterns: [/hipaa|hitech|phi|privacy\s*rule/i],
  },
  {
    key: "security.us_data_residency",
    category: "security",
    patterns: [/data\s*residency|us[\s-]?(?:hosted|based|only)|domestic\s+(host|cloud)/i],
  },
  {
    key: "implementation.six_month_go_live",
    category: "implementation",
    patterns: [/six[\s-]?month|6[\s-]?mo|go[\s-]?live|rollout|implementation\s*(plan|timeline)/i],
  },
  {
    key: "experience.long_term_care",
    category: "experience",
    patterns: [/long[\s-]?term\s*care|ltc|skilled\s*nursing|snf/i],
  },
  {
    key: "support.monthly_training",
    category: "support",
    patterns: [/training|education|webinar|clinic(ian)?\s*support/i],
  },
  {
    key: "support.project_manager",
    category: "support",
    patterns: [/project\s*manager|implementation\s*manager|dedicated\s+cood/i],
  },
  {
    key: "differentiation.customer_refs",
    category: "differentiation",
    patterns: [/case\s*stud|reference|pilot|customer\s+success/i],
  },
];

for (const row of CLAIM_TAXONOMY_V1) {
  KNOWN_KEYS.set(row.key, row.category);
}

const CRITICAL_KEYS = new Set([
  "integration.matrixcare",
  "delivery.24_7_support",
  "delivery.two_hour_emergency",
  "compliance.hipaa_hitech",
  "implementation.six_month_go_live",
]);

export function isCriticalClaimKey(key: string): boolean {
  return CRITICAL_KEYS.has(key);
}

/** Negative signals that may contradict a strong integration claim. */
export const CONTRADICTION_HINTS = [
  /middleware|custom\s+gateway|not\s+direct|no\s+native|interface\s+not\s+(live|certified)/i,
  /manual\s+(upload|entry|csv)|spreadsheet\s+based/i,
  /limited\s+(to|interface)|pilot\s+only|roadmap/i,
];

export function slugifyFallbackKey(text: string): string {
  const t = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 6)
    .join("_");
  return t ? `other.${t.slice(0, 48)}` : "other.unspecified";
}

export function inferCategoryFromKey(key: string): ClaimCategory {
  const prefix = key.split(".")[0];
  const map: Record<string, ClaimCategory> = {
    integration: "integration",
    delivery: "delivery",
    clinical: "clinical",
    compliance: "compliance",
    security: "security",
    pricing: "pricing",
    implementation: "implementation",
    experience: "experience",
    support: "support",
    differentiation: "differentiation",
    billing: "billing",
    packaging: "packaging",
    other: "other",
  };
  return map[prefix] ?? "other";
}

/**
 * Map free text to taxonomy key + category, or null if no match (caller may use slug fallback).
 */
export function matchTaxonomyClaim(
  text: string,
): { key: string; category: ClaimCategory } | null {
  const t = text.trim();
  if (!t) return null;
  for (const row of CLAIM_TAXONOMY_V1) {
    for (const p of row.patterns) {
      if (p.test(t)) return { key: row.key, category: row.category };
    }
  }
  return null;
}

export function normalizeToClaimKey(text: string): {
  key: string;
  category: ClaimCategory;
} {
  const raw = text.trim();
  if (KNOWN_KEYS.has(raw)) {
    return { key: raw, category: KNOWN_KEYS.get(raw)! };
  }
  const m = matchTaxonomyClaim(text);
  if (m) return m;
  const slug = slugifyFallbackKey(text);
  return { key: slug, category: inferCategoryFromKey(slug) };
}

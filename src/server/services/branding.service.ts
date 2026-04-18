import {
  countFactsForProfile,
  countFactsForProfileByFactTypes,
  countWebsiteScrapeSourcesForProfile,
  findAllCareClientProfileForProject,
  getCompanyProfile,
  listFactsByCompanyProfile,
  maxFetchedAtWebsiteScrapesForProfile,
  type DbCompanyProfile,
} from "../repositories/intelligence.repo";
import { ensureAllCareCompanyProfile } from "./allcare-ingest.job";

export type BrandingProfileStats = {
  websiteScrapePages: number;
  factsTotal: number;
  aiTags: number;
};

export type LogoCandidateBrief = {
  url: string;
  score: number;
  reason?: string;
  signals?: string[];
  confidence?: string;
};

export type BrandingScrapeStats = BrandingProfileStats & {
  lastScrapeSummary: Record<string, unknown> | null;
  claimsPromotedLastRun: number | null;
  vendorMappedLastRun: boolean;
};

export type AllCareIngestQualityBreakdown = {
  coverage: number;
  parsing: number;
  factConfidence: number;
  operationalSignal: number;
  vendorMatch: number;
  brandingConfidence: number;
};

export type BrandingProfilePayload = {
  companyProfileId: string;
  projectId: string;
  companyName: string;
  displayName: string;
  websiteUrl: string;
  summary: string;
  notes: string;
  appDisplayName: string;
  logoUrl: string | null;
  brandImageUrl: string | null;
  logoCandidates: LogoCandidateBrief[];
  /** Last computed ingest quality (0–100), from branding_meta.allcare_ingest_quality. */
  ingestQualityScore: number | null;
  ingestQualityBand: "strong" | "moderate" | "weak" | null;
  /** Trust in the score itself (sparse crawl, vendor ambiguity, parse stress). */
  ingestQualityConfidence: "high" | "medium" | "low" | null;
  ingestQualityWarnings: string[];
  ingestQualityPenalties: string[];
  ingestQualityBreakdown: AllCareIngestQualityBreakdown | null;
  /** Single-line honesty cue for evaluators (derived from band + penalties). */
  intelligenceTrustHint: string | null;
  /** Logo discovery confidence label (high | medium | low). */
  logoConfidence: string | null;
  /** Vendor resolution confidence (high | medium | low | none). */
  vendorMatchConfidence: string | null;
  vendorMatchType: string | null;
  vendorResolutionNotes: string | null;
  vendorResolutionCandidateCount: number | null;
  subtitle: string;
  /** Same as aiTags; kept for older clients. */
  brandingTags: string[];
  aiTags: string[];
  serviceLines: string[];
  capabilities: string[];
  technologyReferences: string[];
  contactBlocks: {
    label: string;
    address?: string;
    phone?: string;
    email?: string;
  }[];
  lastWebsiteScrapeAt: string | null;
  lastScrapeAt: string | null;
  lastScrapeSummary: Record<string, unknown> | null;
  brandingMeta: Record<string, unknown>;
};

export type BrandingProfileWithStats = BrandingProfilePayload & {
  stats: BrandingScrapeStats;
};

function uniqKeepOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of items) {
    const k = x.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function parseContactPayload(
  factText: string,
): BrandingProfilePayload["contactBlocks"][0] | null {
  try {
    const o = JSON.parse(factText) as Record<string, unknown>;
    const label = String(o.label ?? "contact");
    return {
      label,
      address: o.address ? String(o.address) : undefined,
      phone: o.phone ? String(o.phone) : undefined,
      email: o.email ? String(o.email) : undefined,
    };
  } catch {
    return null;
  }
}

function parseStringList(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
  return out.length ? out : undefined;
}

function parseLogoCandidates(meta: Record<string, unknown>): LogoCandidateBrief[] {
  const raw = meta.logo_candidates;
  if (!Array.isArray(raw)) return [];
  const out: LogoCandidateBrief[] = [];
  for (const item of raw) {
    if (typeof item === "object" && item !== null && "url" in item) {
      const o = item as Record<string, unknown>;
      const url = String(o.url ?? "");
      if (!url.startsWith("http")) continue;
      const signals = parseStringList(o.signals);
      const conf =
        typeof o.confidence === "string" && o.confidence.trim()
          ? o.confidence.trim()
          : undefined;
      out.push({
        url,
        score: typeof o.score === "number" ? o.score : 0,
        reason: typeof o.reason === "string" ? o.reason : undefined,
        signals,
        confidence: conf,
      });
    }
  }
  return out.slice(0, 16);
}

function readStringListMeta(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function readIngestQualityFromMeta(meta: Record<string, unknown>): {
  score: number | null;
  band: "strong" | "moderate" | "weak" | null;
  confidence: "high" | "medium" | "low" | null;
  warnings: string[];
  penalties: string[];
  breakdown: AllCareIngestQualityBreakdown | null;
} {
  const v = meta.allcare_ingest_quality;
  if (v == null || typeof v !== "object" || Array.isArray(v)) {
    return {
      score: null,
      band: null,
      confidence: null,
      warnings: [],
      penalties: [],
      breakdown: null,
    };
  }
  const o = v as Record<string, unknown>;
  const score =
    typeof o.qualityScore === "number" && Number.isFinite(o.qualityScore)
      ? Math.round(o.qualityScore)
      : null;
  const bandRaw = String(o.qualityBand ?? "").toLowerCase();
  let band: "strong" | "moderate" | "weak" | null =
    bandRaw === "strong" || bandRaw === "moderate" || bandRaw === "weak"
      ? bandRaw
      : null;
  const penalties = readStringListMeta(o.penalties);
  const warnings = readStringListMeta(o.warnings);
  const confRaw = String(o.confidence ?? "").toLowerCase();
  const confidence: "high" | "medium" | "low" | null =
    confRaw === "high" || confRaw === "medium" || confRaw === "low"
      ? confRaw
      : null;
  if (band == null && score != null) {
    if (score >= 72) band = "strong";
    else if (score >= 46) band = "moderate";
    else band = "weak";
  }
  const b = o.breakdown;
  if (b == null || typeof b !== "object" || Array.isArray(b)) {
    return { score, band, confidence, warnings, penalties, breakdown: null };
  }
  const bd = b as Record<string, unknown>;
  const n = (k: string): number => {
    const x = bd[k];
    return typeof x === "number" && Number.isFinite(x) ? Math.round(x) : 0;
  };
  const opSignal = n("operationalSignal") || n("operationalMix");
  return {
    score,
    band,
    confidence,
    warnings,
    penalties,
    breakdown: {
      coverage: n("coverage"),
      parsing: n("parsing"),
      factConfidence: n("factConfidence"),
      operationalSignal: opSignal,
      vendorMatch: n("vendorMatch"),
      brandingConfidence: n("brandingConfidence"),
    },
  };
}

function deriveTrustHint(input: {
  band: "strong" | "moderate" | "weak" | null;
  score: number | null;
  penalties: string[];
  warnings: string[];
  qualityConfidence: "high" | "medium" | "low" | null;
  vendorMatchType: string | null;
  vendorConfidence: string | null;
}): string | null {
  const parts: string[] = [];
  if (input.band === "weak" || (input.score != null && input.score < 46)) {
    parts.push("Ingest quality is limited — treat claims as provisional.");
  } else if (input.band === "moderate") {
    parts.push("Moderate ingest confidence — verify before hard commitments.");
  }
  if (input.qualityConfidence === "low") {
    parts.push("Quality score has low confidence given crawl and parse conditions.");
  }
  if (
    input.vendorMatchType === "ambiguous" ||
    input.vendorConfidence === "none"
  ) {
    parts.push("Vendor link unresolved or ambiguous.");
  }
  if (input.warnings.length > 0) {
    parts.push(input.warnings[0].endsWith(".") ? input.warnings[0] : `${input.warnings[0]}.`);
  } else if (input.penalties.length > 0) {
    parts.push(`Noted: ${input.penalties[0]}.`);
  }
  if (parts.length === 0) return null;
  return parts.join(" ");
}

function readVendorResolutionFromMeta(meta: Record<string, unknown>): {
  confidence: string | null;
  matchType: string | null;
  candidateCount: number | null;
  notes: string | null;
} {
  const v = meta.allcare_last_vendor_resolution;
  if (v == null || typeof v !== "object" || Array.isArray(v)) {
    return {
      confidence: null,
      matchType: null,
      candidateCount: null,
      notes: null,
    };
  }
  const o = v as Record<string, unknown>;
  const cc = o.candidate_count;
  return {
    confidence:
      typeof o.confidence === "string" && o.confidence.trim()
        ? o.confidence.trim()
        : null,
    matchType:
      typeof o.match_type === "string" && o.match_type.trim()
        ? o.match_type.trim()
        : null,
    candidateCount:
      typeof cc === "number" && Number.isFinite(cc) ? Math.round(cc) : null,
    notes:
      typeof o.notes === "string" && o.notes.trim() ? o.notes.trim() : null,
  };
}

function readLogoConfidenceFromMeta(meta: Record<string, unknown>): string | null {
  const c = meta.logo_confidence;
  if (typeof c === "string" && c.trim()) return c.trim();
  return null;
}

function readLastScrapeSummary(
  meta: Record<string, unknown>,
): Record<string, unknown> | null {
  const v = meta.allcare_last_scrape_summary;
  if (v != null && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return null;
}

function readPromotionFromMeta(meta: Record<string, unknown>): {
  claimsPromotedLastRun: number | null;
  vendorMappedLastRun: boolean;
} {
  const promo = meta.allcare_last_promotion;
  if (promo != null && typeof promo === "object" && !Array.isArray(promo)) {
    const p = promo as Record<string, unknown>;
    return {
      claimsPromotedLastRun:
        typeof p.claims_promoted === "number" ? p.claims_promoted : null,
      vendorMappedLastRun: Boolean(p.vendor_id),
    };
  }
  return { claimsPromotedLastRun: null, vendorMappedLastRun: false };
}

function deriveServiceLinesFromTags(tags: string[]): string[] {
  const map: Record<string, string> = {
    long_term_care: "Long-term care",
    service_line_longterm_care: "Long-term care",
    assisted_living: "Assisted living",
    correctional_pharmacy: "Correctional",
    correctional: "Correctional",
    specialty_pharmacy: "Specialty pharmacy",
    ltc: "Long-term care",
  };
  const out: string[] = [];
  for (const t of tags) {
    const key = t.toLowerCase();
    if (map[key]) out.push(map[key]);
    else if (key.includes("long_term") || key.includes("ltc")) {
      out.push("Long-term care");
    } else if (key.includes("assisted")) out.push("Assisted living");
    else if (key.includes("correctional")) out.push("Correctional");
    else if (key.includes("specialty")) out.push("Specialty pharmacy");
  }
  return uniqKeepOrder(out);
}

/**
 * Builds a lightweight branding payload for UI and drafting from stored profile + intelligence_facts.
 */
export async function loadBrandingProfileForCompany(
  companyProfileId: string,
): Promise<BrandingProfilePayload | null> {
  const profile = await getCompanyProfile(companyProfileId);
  if (!profile) return null;
  return buildBrandingPayloadFromProfile(profile);
}

export async function buildBrandingPayloadFromProfile(
  profile: DbCompanyProfile,
): Promise<BrandingProfilePayload> {
  const facts = await listFactsByCompanyProfile(profile.id);
  const tags = facts.filter((f) => f.factType === "ai_tag").map((f) => f.factText);
  const capabilities = facts
    .filter((f) => f.factType === "capability")
    .map((f) => f.factText);
  const technologyReferences = facts
    .filter((f) => f.factType === "technology_reference")
    .map((f) => f.factText);
  const contactBlocks: BrandingProfilePayload["contactBlocks"] = [];
  for (const f of facts) {
    if (f.factType !== "contact_block") continue;
    const c = parseContactPayload(f.factText);
    if (c) contactBlocks.push(c);
  }

  const serviceLines = deriveServiceLinesFromTags(tags);
  const display = profile.displayName?.trim() || profile.name;
  const subtitle =
    profile.summary?.trim() ||
    facts.find((f) => f.factType === "page_summary")?.factText?.slice(0, 280) ||
    "";

  const meta = profile.brandingMeta ?? {};
  const appDisplayName =
    typeof meta.app_display_name === "string" && meta.app_display_name.trim()
      ? String(meta.app_display_name)
      : `${display} Bid Assembly`;

  const logoUrl =
    typeof meta.logo_url === "string" && meta.logo_url.startsWith("http")
      ? meta.logo_url
      : null;

  const brandImageUrl =
    typeof meta.brand_image_url === "string" &&
    meta.brand_image_url.startsWith("http")
      ? meta.brand_image_url
      : null;

  const logoCandidates = parseLogoCandidates(meta);
  const tagList = uniqKeepOrder(tags);
  const {
    score: ingestQualityScore,
    band: ingestQualityBand,
    confidence: ingestQualityConfidence,
    warnings: ingestQualityWarnings,
    penalties: ingestQualityPenalties,
    breakdown: ingestQualityBreakdown,
  } = readIngestQualityFromMeta(meta);
  const {
    confidence: vendorMatchConfidence,
    matchType: vendorMatchType,
    candidateCount: vendorResolutionCandidateCount,
    notes: vendorResolutionNotes,
  } = readVendorResolutionFromMeta(meta);
  const logoConfidence = readLogoConfidenceFromMeta(meta);
  const intelligenceTrustHint = deriveTrustHint({
    band: ingestQualityBand,
    score: ingestQualityScore,
    penalties: ingestQualityPenalties,
    warnings: ingestQualityWarnings,
    qualityConfidence: ingestQualityConfidence,
    vendorMatchType,
    vendorConfidence: vendorMatchConfidence,
  });

  const lastWebsiteScrapeAt =
    (await maxFetchedAtWebsiteScrapesForProfile(profile.id)) ??
    (typeof meta.allcare_last_scrape_at === "string"
      ? meta.allcare_last_scrape_at
      : null);

  const lastScrapeSummary = readLastScrapeSummary(meta);

  return {
    companyProfileId: profile.id,
    projectId: profile.projectId,
    companyName: profile.name,
    displayName: display,
    websiteUrl: profile.websiteUrl ?? "",
    summary: profile.summary ?? "",
    notes: profile.notes ?? "",
    appDisplayName,
    logoUrl,
    brandImageUrl,
    logoCandidates,
    ingestQualityScore,
    ingestQualityBand,
    ingestQualityConfidence,
    ingestQualityWarnings,
    ingestQualityPenalties,
    ingestQualityBreakdown,
    intelligenceTrustHint,
    logoConfidence,
    vendorMatchConfidence,
    vendorMatchType,
    vendorResolutionNotes,
    vendorResolutionCandidateCount,
    subtitle: subtitle.trim(),
    brandingTags: tagList,
    aiTags: tagList,
    serviceLines,
    capabilities: uniqKeepOrder(capabilities).slice(0, 24),
    technologyReferences: uniqKeepOrder(technologyReferences).slice(0, 24),
    contactBlocks: contactBlocks.slice(0, 8),
    lastWebsiteScrapeAt,
    lastScrapeAt:
      typeof meta.allcare_last_scrape_at === "string"
        ? meta.allcare_last_scrape_at
        : lastWebsiteScrapeAt,
    lastScrapeSummary,
    brandingMeta: meta,
  };
}

export async function loadBrandingProfileForAllCareProject(
  projectId: string,
): Promise<BrandingProfilePayload | null> {
  const profile = await findAllCareClientProfileForProject(projectId);
  if (!profile) return null;
  return buildBrandingPayloadFromProfile(profile);
}

export async function loadBrandingProfileWithStats(
  companyProfileId: string,
): Promise<BrandingProfileWithStats | null> {
  const base = await loadBrandingProfileForCompany(companyProfileId);
  if (!base) return null;
  const [websiteScrapePages, factsTotal, aiTags] = await Promise.all([
    countWebsiteScrapeSourcesForProfile(companyProfileId),
    countFactsForProfile(companyProfileId),
    countFactsForProfileByFactTypes({
      companyProfileId,
      factTypes: ["ai_tag"],
    }),
  ]);
  const promo = readPromotionFromMeta(base.brandingMeta ?? {});
  return {
    ...base,
    stats: {
      websiteScrapePages,
      factsTotal,
      aiTags,
      lastScrapeSummary: base.lastScrapeSummary,
      claimsPromotedLastRun: promo.claimsPromotedLastRun,
      vendorMappedLastRun: promo.vendorMappedLastRun,
    },
  };
}

export async function loadAllCareBrandingWithStatsForProject(
  projectId: string,
  ensureProfile: boolean,
): Promise<BrandingProfileWithStats | null> {
  const profile = ensureProfile
    ? await ensureAllCareCompanyProfile(projectId)
    : await findAllCareClientProfileForProject(projectId);
  if (!profile) return null;
  return loadBrandingProfileWithStats(profile.id);
}

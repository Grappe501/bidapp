import {
  assertIntelligenceFactsCredibilityColumns,
  listFactsNeedingCredibilityBackfill,
  patchIntelligenceFactCredibility,
  type DbIntelligenceFact,
} from "../repositories/intelligence.repo";

const MARKETING_HINT =
  /\b(leading|trusted|premier|world[- ]class|best[- ]in[- ]class|high quality|innovative|#1|top rated)\b/i;

function inferLegacyCredibility(f: DbIntelligenceFact): {
  credibility: string;
  confidence: string;
} {
  const cls = (f.classification ?? "").toLowerCase();
  if (cls.includes("verified")) {
    return { credibility: "operational", confidence: "medium" };
  }

  const t = f.factType;
  const text = f.factText.slice(0, 2000);

  if (t === "ai_tag" || t === "page_summary") {
    return { credibility: "inferred", confidence: "medium" };
  }
  if (t === "capability" || t === "technology_reference") {
    return { credibility: "operational", confidence: "medium" };
  }
  if (t === "contact_block") {
    return { credibility: "operational", confidence: "high" };
  }
  if (t === "allcare_fact") {
    if (MARKETING_HINT.test(text)) {
      return { credibility: "marketing", confidence: "low" };
    }
    if (
      /\d|%|24\s*\/\s*7|hour|daily|weekly|delivery|integrat|system|platform|compliant/i.test(
        text,
      )
    ) {
      return { credibility: "operational", confidence: "medium" };
    }
    return { credibility: "operational", confidence: "medium" };
  }
  if (MARKETING_HINT.test(text)) {
    return { credibility: "marketing", confidence: "medium" };
  }
  return { credibility: "inferred", confidence: "low" };
}

/**
 * Idempotent backfill: only fills empty credibility/confidence cells (see patch SQL).
 */
export async function backfillLegacyFactCredibilityForCompanyProfile(
  companyProfileId: string,
): Promise<{ examined: number; updated: number }> {
  await assertIntelligenceFactsCredibilityColumns();
  const rows = await listFactsNeedingCredibilityBackfill(companyProfileId);
  let updated = 0;
  for (const f of rows) {
    const { credibility, confidence } = inferLegacyCredibility(f);
    await patchIntelligenceFactCredibility({
      id: f.id,
      credibility,
      confidence,
    });
    updated++;
  }
  return { examined: rows.length, updated };
}

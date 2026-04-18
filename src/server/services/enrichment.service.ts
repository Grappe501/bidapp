import {
  createCompanyEnrichmentRun,
  createIntelligenceFact,
  getCompanyProfile,
  listIntelligenceSourcesByCompanyProfile,
  updateCompanyEnrichmentRun,
} from "../repositories/intelligence.repo";
import { createVendorClaim, findVendorIdByProjectAndName } from "../repositories/vendor.repo";
import { extractEntitiesForMode } from "./ai-parsing.service";

function mapProvenanceToValidation(kind: string): string {
  if (kind === "Inferred Conclusion") return "Inferred";
  if (kind === "Vendor Claim") return "Unverified";
  if (kind === "Verified Fact") return "Pending Validation";
  if (kind === "Internal Assumption") return "Unverified";
  return "Pending Validation";
}

function asRecord(ent: unknown): Record<string, unknown> {
  return typeof ent === "object" && ent !== null ? (ent as Record<string, unknown>) : {};
}

/**
 * Enriches a company (client or vendor) profile from **stored** intelligence_sources only.
 * Appends intelligence_facts and vendor_claims; does not overwrite company_profiles JSON fields.
 */
export async function runCompanyEnrichment(input: {
  companyProfileId: string;
}): Promise<{
  runId: string;
  factsCreated: number;
  claimsCreated: number;
}> {
  const profile = await getCompanyProfile(input.companyProfileId);
  if (!profile) {
    throw new Error(`Company profile not found: ${input.companyProfileId}`);
  }

  const sources = await listIntelligenceSourcesByCompanyProfile(
    input.companyProfileId,
  );
  const runId = await createCompanyEnrichmentRun({
    companyProfileId: input.companyProfileId,
    sourceCount: sources.length,
  });

  let factsCreated = 0;
  let claimsCreated = 0;

  const vendorId =
    profile.linkedVendorId ??
    (await findVendorIdByProjectAndName(profile.projectId, profile.name));

  try {
    if (sources.length === 0) {
      await updateCompanyEnrichmentRun({
        id: runId,
        status: "completed",
        notes: "No intelligence_sources — nothing to enrich.",
      });
      return { runId, factsCreated: 0, claimsCreated: 0 };
    }

    for (const src of sources) {
      const text = src.rawText.trim();
      if (!text) continue;

      const factEntities = await extractEntitiesForMode(
        text,
        "extract_company_facts",
      );
      for (const ent of factEntities) {
        const e = asRecord(ent);
        const factText = String(e.factText ?? "").trim();
        if (!factText) continue;
        const pk = String(e.provenanceKind ?? "Vendor Claim");
        await createIntelligenceFact({
          projectId: profile.projectId,
          sourceId: src.id,
          companyProfileId: profile.id,
          factType: String(e.factType ?? "general"),
          factText,
          classification: pk,
          validationStatus: mapProvenanceToValidation(pk),
        });
        factsCreated++;
      }

      if (vendorId) {
        const claimEntities = await extractEntitiesForMode(
          text,
          "extract_vendor_claims",
        );
        for (const ent of claimEntities) {
          const e = asRecord(ent);
          const claimText = String(e.claimText ?? "").trim();
          if (!claimText) continue;
          const pk = String(e.provenanceKind ?? "Vendor Claim");
          await createVendorClaim({
            vendorId,
            sourceId: src.id,
            claimText,
            validationStatus:
              pk === "Inferred Conclusion" ? "Inferred" : "Unverified",
          });
          claimsCreated++;
        }
      }
    }

    await updateCompanyEnrichmentRun({
      id: runId,
      status: "completed",
      notes: `facts=${factsCreated}; vendor_claims=${claimsCreated}`,
    });

    return { runId, factsCreated, claimsCreated };
  } catch (err) {
    await updateCompanyEnrichmentRun({
      id: runId,
      status: "failed",
      notes: err instanceof Error ? err.message : "enrichment failed",
    });
    throw err;
  }
}

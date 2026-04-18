import type { CompanyProfile, IntelligenceIngestEntry } from "@/types";

export function getProfileById(
  profiles: CompanyProfile[],
  id: string,
): CompanyProfile | undefined {
  return profiles.find((p) => p.id === id);
}

export function entriesForProfile(
  entries: IntelligenceIngestEntry[],
  profileId: string,
): IntelligenceIngestEntry[] {
  return entries.filter((e) => e.companyProfileId === profileId);
}

/** Merge a single ingest entry into the structured profile (session-only). */
export function applyIngestToProfile(
  profile: CompanyProfile,
  entry: IntelligenceIngestEntry,
): CompanyProfile {
  const line = entry.body.trim();
  if (!line) return profile;

  const next = { ...profile };
  const url = entry.sourceUrl.trim();

  switch (entry.classification) {
    case "capability":
      next.capabilities = [...next.capabilities, line];
      break;
    case "risk":
      next.risks = [...next.risks, line];
      break;
    case "claim":
      next.claims = [...next.claims, line];
      break;
    case "integration detail":
      next.integrationDetails = [...next.integrationDetails, line];
      break;
    default:
      break;
  }

  if (url && !next.sources.includes(url)) {
    next.sources = [...next.sources, url];
  }

  return next;
}

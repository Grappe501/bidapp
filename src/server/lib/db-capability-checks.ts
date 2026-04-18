import { query } from "../db/client";

export type SchemaCapabilityIssue = { check: string; message: string };

async function columnExists(table: string, column: string): Promise<boolean> {
  const r = await query(
    `SELECT 1 AS ok FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [table, column],
  );
  return (r.rowCount ?? 0) > 0;
}

/**
 * Whether intelligence_facts has credibility + confidence (migration 006).
 * Does not use the cached assert in intelligence.repo (safe for preflight listing).
 */
export async function intelligenceFactsCredibilityColumnsExist(): Promise<boolean> {
  const cred = await columnExists("intelligence_facts", "credibility");
  const conf = await columnExists("intelligence_facts", "confidence");
  return cred && conf;
}

export async function collectAllCareIngestSchemaIssues(): Promise<
  SchemaCapabilityIssue[]
> {
  const issues: SchemaCapabilityIssue[] = [];

  if (!(await intelligenceFactsCredibilityColumnsExist())) {
    issues.push({
      check: "intelligence_facts_credibility",
      message:
        "Missing intelligence_facts credibility/confidence columns. Apply migration 006_allcare_fact_credibility.sql before running AllCare ingest (npm run db:migrate).",
    });
  }

  if (!(await columnExists("company_profiles", "branding_meta"))) {
    issues.push({
      check: "company_profiles_branding_meta",
      message:
        "Missing company_profiles.branding_meta. Apply migration 005_allcare_branding_ingest.sql before running AllCare ingest.",
    });
  }

  for (const col of ["metadata", "url_normalized"] as const) {
    if (!(await columnExists("intelligence_sources", col))) {
      issues.push({
        check: `intelligence_sources_${col}`,
        message: `Missing intelligence_sources.${col}. Apply migration 005_allcare_branding_ingest.sql before running AllCare ingest.`,
      });
    }
  }

  return issues;
}

export async function checkAllCareIngestSchemaReady(): Promise<{
  schemaReady: boolean;
  schemaIssues: string[];
}> {
  const issues = await collectAllCareIngestSchemaIssues();
  return {
    schemaReady: issues.length === 0,
    schemaIssues: issues.map((i) => i.message),
  };
}

/**
 * Throws a single actionable error if any required AllCare ingest capability is missing.
 */
export async function assertAllCareIngestSchemaCapabilities(): Promise<void> {
  const issues = await collectAllCareIngestSchemaIssues();
  if (issues.length === 0) return;
  throw new Error(issues.map((i) => i.message).join(" "));
}

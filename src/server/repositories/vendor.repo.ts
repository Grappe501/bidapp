import { query } from "../db/client";

export type DbVendor = {
  id: string;
  projectId: string;
  name: string;
  category: string;
  status: string;
  summary: string;
  fitScore: number;
  implementationSpeed: string;
  ltcFit: string;
  apiReadiness: string;
  pricingNotes: string;
  likelyStackRole: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  notes: string;
  capabilities: { id: string; statement: string }[];
  sourceFileIds: string[];
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  createdAt: string;
  updatedAt: string;
};

function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "string") return JSON.parse(v) as T;
  return v as T;
}

function mapVendor(r: Record<string, unknown>): DbVendor {
  return {
    id: String(r.id),
    projectId: String(r.project_id),
    name: String(r.name),
    category: String(r.category),
    status: String(r.status),
    summary: String(r.summary),
    fitScore: Number(r.fit_score),
    implementationSpeed: String(r.implementation_speed),
    ltcFit: String(r.ltc_fit),
    apiReadiness: String(r.api_readiness),
    pricingNotes: String(r.pricing_notes),
    likelyStackRole: String(r.likely_stack_role),
    strengths: parseJson(r.strengths, [] as string[]),
    weaknesses: parseJson(r.weaknesses, [] as string[]),
    risks: parseJson(r.risks, [] as string[]),
    notes: String(r.notes),
    capabilities: parseJson(r.capabilities, [] as { id: string; statement: string }[]),
    sourceFileIds: parseJson(r.source_file_ids, [] as string[]),
    primaryContactName: String(r.primary_contact_name),
    primaryContactEmail: String(r.primary_contact_email),
    primaryContactPhone: String(r.primary_contact_phone),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function createVendor(input: {
  id?: string;
  projectId: string;
  name: string;
  category: string;
  status: string;
  summary: string;
  fitScore: number;
  implementationSpeed: string;
  ltcFit: string;
  apiReadiness: string;
  pricingNotes: string;
  likelyStackRole: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  notes: string;
  capabilities: { id: string; statement: string }[];
  sourceFileIds: string[];
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}): Promise<DbVendor> {
  const r = await query(
    `INSERT INTO vendors (
      id, project_id, name, category, status, summary, fit_score, implementation_speed,
      ltc_fit, api_readiness, pricing_notes, likely_stack_role, strengths, weaknesses,
      risks, notes, capabilities, source_file_ids, primary_contact_name,
      primary_contact_email, primary_contact_phone, updated_at
    ) VALUES (
      COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13::jsonb, $14::jsonb, $15::jsonb, $16, $17::jsonb, $18::jsonb, $19, $20, $21, now()
    ) RETURNING *`,
    [
      input.id ?? null,
      input.projectId,
      input.name,
      input.category,
      input.status,
      input.summary,
      input.fitScore,
      input.implementationSpeed,
      input.ltcFit,
      input.apiReadiness,
      input.pricingNotes,
      input.likelyStackRole,
      JSON.stringify(input.strengths),
      JSON.stringify(input.weaknesses),
      JSON.stringify(input.risks),
      input.notes,
      JSON.stringify(input.capabilities),
      JSON.stringify(input.sourceFileIds),
      input.primaryContactName,
      input.primaryContactEmail,
      input.primaryContactPhone,
    ],
  );
  return mapVendor(r.rows[0] as Record<string, unknown>);
}

export async function createVendorContact(input: {
  vendorId: string;
  name: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}): Promise<void> {
  await query(
    `INSERT INTO vendor_contacts (vendor_id, name, email, phone, is_primary, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())`,
    [
      input.vendorId,
      input.name,
      input.email,
      input.phone,
      input.isPrimary,
    ],
  );
}

export async function listVendorsByProject(projectId: string): Promise<DbVendor[]> {
  const r = await query(`SELECT * FROM vendors WHERE project_id = $1 ORDER BY name`, [
    projectId,
  ]);
  return r.rows.map((row: Record<string, unknown>) => mapVendor(row));
}

export async function findVendorIdByProjectAndName(
  projectId: string,
  name: string,
): Promise<string | null> {
  const r = await query(
    `SELECT id FROM vendors WHERE project_id = $1 AND lower(name) = lower($2) LIMIT 1`,
    [projectId, name.trim()],
  );
  if (r.rowCount === 0) return null;
  return String((r.rows[0] as Record<string, unknown>).id);
}

export async function createVendorClaim(input: {
  vendorId: string;
  sourceId: string;
  claimText: string;
  validationStatus?: string;
}): Promise<void> {
  await query(
    `INSERT INTO vendor_claims (vendor_id, source_id, claim_text, validation_status, updated_at)
     VALUES ($1, $2, $3, $4, now())`,
    [
      input.vendorId,
      input.sourceId,
      input.claimText,
      input.validationStatus ?? "Unverified",
    ],
  );
}

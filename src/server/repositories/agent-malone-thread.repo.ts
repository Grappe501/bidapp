import { query } from "../db/client";

export type DbAgentMaloneThread = {
  id: string;
  projectId: string;
  title: string;
  status: "active" | "archived";
  currentVendorId: string | null;
  currentArchitectureOptionId: string | null;
  currentSectionId: string | null;
  currentFocus: string | null;
  summaryLine: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapRow(r: Record<string, unknown>): DbAgentMaloneThread {
  return {
    id: String(r.id),
    projectId: String(r.project_id),
    title: String(r.title),
    status: r.status === "archived" ? "archived" : "active",
    currentVendorId:
      r.current_vendor_id == null ? null : String(r.current_vendor_id),
    currentArchitectureOptionId:
      r.current_architecture_option_id == null
        ? null
        : String(r.current_architecture_option_id),
    currentSectionId:
      r.current_section_id == null ? null : String(r.current_section_id),
    currentFocus: r.current_focus == null ? null : String(r.current_focus),
    summaryLine: r.summary_line == null ? null : String(r.summary_line),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function insertAgentMaloneThread(input: {
  projectId: string;
  title?: string;
}): Promise<DbAgentMaloneThread> {
  const r = await query(
    `INSERT INTO agent_malone_threads (project_id, title, updated_at)
     VALUES ($1, COALESCE($2, 'General'), now())
     RETURNING *`,
    [input.projectId, input.title ?? null],
  );
  return mapRow(r.rows[0] as Record<string, unknown>);
}

export async function getAgentMaloneThreadById(
  id: string,
): Promise<DbAgentMaloneThread | null> {
  const r = await query(`SELECT * FROM agent_malone_threads WHERE id = $1`, [
    id,
  ]);
  if (r.rowCount === 0) return null;
  return mapRow(r.rows[0] as Record<string, unknown>);
}

export async function listAgentMaloneThreadsByProject(
  projectId: string,
): Promise<DbAgentMaloneThread[]> {
  const r = await query(
    `SELECT * FROM agent_malone_threads
     WHERE project_id = $1
     ORDER BY updated_at DESC`,
    [projectId],
  );
  return r.rows.map((row) => mapRow(row as Record<string, unknown>));
}

export async function listActiveAgentMaloneThreads(
  projectId: string,
): Promise<DbAgentMaloneThread[]> {
  const r = await query(
    `SELECT * FROM agent_malone_threads
     WHERE project_id = $1 AND status = 'active'
     ORDER BY updated_at DESC`,
    [projectId],
  );
  return r.rows.map((row) => mapRow(row as Record<string, unknown>));
}

export async function updateAgentMaloneThread(input: {
  id: string;
  title?: string;
  status?: "active" | "archived";
  currentVendorId?: string | null;
  currentArchitectureOptionId?: string | null;
  currentSectionId?: string | null;
  currentFocus?: string | null;
  summaryLine?: string | null;
}): Promise<DbAgentMaloneThread | null> {
  const sets: string[] = ["updated_at = now()"];
  const params: unknown[] = [];
  let i = 1;
  if (input.title !== undefined) {
    sets.push(`title = $${i++}`);
    params.push(input.title);
  }
  if (input.status !== undefined) {
    sets.push(`status = $${i++}`);
    params.push(input.status);
  }
  if (input.currentVendorId !== undefined) {
    sets.push(`current_vendor_id = $${i++}`);
    params.push(input.currentVendorId);
  }
  if (input.currentArchitectureOptionId !== undefined) {
    sets.push(`current_architecture_option_id = $${i++}`);
    params.push(input.currentArchitectureOptionId);
  }
  if (input.currentSectionId !== undefined) {
    sets.push(`current_section_id = $${i++}`);
    params.push(input.currentSectionId);
  }
  if (input.currentFocus !== undefined) {
    sets.push(`current_focus = $${i++}`);
    params.push(input.currentFocus);
  }
  if (input.summaryLine !== undefined) {
    sets.push(`summary_line = $${i++}`);
    params.push(input.summaryLine);
  }
  params.push(input.id);
  const r = await query(
    `UPDATE agent_malone_threads SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    params,
  );
  if (r.rowCount === 0) return null;
  return mapRow(r.rows[0] as Record<string, unknown>);
}

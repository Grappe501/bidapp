import { query } from "../db/client";

export type DbAgentMaloneMemory = {
  id: string;
  threadId: string;
  projectId: string;
  memoryKey: string;
  memoryValue: string;
  confidence: "high" | "medium" | "low" | null;
  source: string;
  createdAt: string;
  updatedAt: string;
};

function mapRow(r: Record<string, unknown>): DbAgentMaloneMemory {
  const conf = r.confidence;
  return {
    id: String(r.id),
    threadId: String(r.thread_id),
    projectId: String(r.project_id),
    memoryKey: String(r.memory_key),
    memoryValue: String(r.memory_value ?? ""),
    confidence:
      conf === "high" || conf === "medium" || conf === "low"
        ? conf
        : null,
    source: String(r.source ?? "agent_inferred"),
    createdAt: new Date(String(r.created_at)).toISOString(),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function listAgentMaloneMemoryByThread(
  threadId: string,
): Promise<DbAgentMaloneMemory[]> {
  const r = await query(
    `SELECT * FROM agent_malone_memory WHERE thread_id = $1 ORDER BY memory_key`,
    [threadId],
  );
  return r.rows.map((row) => mapRow(row as Record<string, unknown>));
}

export async function upsertAgentMaloneMemory(input: {
  threadId: string;
  projectId: string;
  memoryKey: string;
  memoryValue: string;
  confidence?: "high" | "medium" | "low" | null;
  source: string;
}): Promise<DbAgentMaloneMemory> {
  const r = await query(
    `INSERT INTO agent_malone_memory (
  thread_id, project_id, memory_key, memory_value, confidence, source, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, now())
ON CONFLICT (thread_id, memory_key) DO UPDATE SET
  memory_value = EXCLUDED.memory_value,
  confidence = EXCLUDED.confidence,
  source = EXCLUDED.source,
  updated_at = now()
RETURNING *`,
    [
      input.threadId,
      input.projectId,
      input.memoryKey,
      input.memoryValue,
      input.confidence ?? null,
      input.source,
    ],
  );
  return mapRow(r.rows[0] as Record<string, unknown>);
}

export async function deleteAgentMaloneMemoryByKey(
  threadId: string,
  memoryKey: string,
): Promise<boolean> {
  const r = await query(
    `DELETE FROM agent_malone_memory WHERE thread_id = $1 AND memory_key = $2`,
    [threadId, memoryKey],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function deleteAgentMaloneMemoryBySource(
  threadId: string,
  source: string,
): Promise<number> {
  const r = await query(
    `DELETE FROM agent_malone_memory WHERE thread_id = $1 AND source = $2`,
    [threadId, source],
  );
  return r.rowCount ?? 0;
}

export async function deleteAllAgentMaloneMemoryForThread(
  threadId: string,
): Promise<void> {
  await query(`DELETE FROM agent_malone_memory WHERE thread_id = $1`, [
    threadId,
  ]);
}

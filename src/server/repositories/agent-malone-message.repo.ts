import { query } from "../db/client";

export type DbAgentMaloneMessage = {
  id: string;
  threadId: string;
  role: "user" | "agent" | "system" | "action";
  content: string;
  structuredPayload: unknown | null;
  createdAt: string;
};

function mapRow(r: Record<string, unknown>): DbAgentMaloneMessage {
  return {
    id: String(r.id),
    threadId: String(r.thread_id),
    role: r.role as DbAgentMaloneMessage["role"],
    content: String(r.content ?? ""),
    structuredPayload: r.structured_payload ?? null,
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}

export async function insertAgentMaloneMessage(input: {
  threadId: string;
  role: DbAgentMaloneMessage["role"];
  content: string;
  structuredPayload?: unknown;
}): Promise<DbAgentMaloneMessage> {
  const r = await query(
    `INSERT INTO agent_malone_messages (thread_id, role, content, structured_payload)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      input.threadId,
      input.role,
      input.content,
      input.structuredPayload ?? null,
    ],
  );
  return mapRow(r.rows[0] as Record<string, unknown>);
}

export async function listRecentAgentMaloneMessages(
  threadId: string,
  limit = 20,
): Promise<DbAgentMaloneMessage[]> {
  const r = await query(
    `SELECT * FROM agent_malone_messages
     WHERE thread_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [threadId, limit],
  );
  const rows = r.rows.map((row) => mapRow(row as Record<string, unknown>));
  return rows.reverse();
}

import type {
  SubmissionAuditLog,
  SubmissionAuditActionType,
} from "../../types";

export function appendAuditEntry(
  logs: SubmissionAuditLog[],
  entry: Omit<SubmissionAuditLog, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): SubmissionAuditLog[] {
  const row: SubmissionAuditLog = {
    id: entry.id ?? crypto.randomUUID(),
    projectId: entry.projectId,
    actionType: entry.actionType,
    actor: entry.actor,
    entityType: entry.entityType,
    entityId: entry.entityId,
    description: entry.description,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
  return [row, ...logs];
}

export function summarizeRecentActions(
  logs: SubmissionAuditLog[],
  limit = 8,
): SubmissionAuditLog[] {
  return [...logs].slice(0, limit);
}

export type AuditDraftInput = {
  projectId: string;
  actor: string;
  actionType: SubmissionAuditActionType;
  entityType: string;
  entityId: string;
  description: string;
};

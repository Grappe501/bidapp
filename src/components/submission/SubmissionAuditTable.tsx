import type { SubmissionAuditLog } from "@/types";

export function SubmissionAuditTable({ logs }: { logs: SubmissionAuditLog[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-zinc-50/80">
            <th className="px-3 py-2 text-xs font-medium text-ink-subtle">
              Time
            </th>
            <th className="px-3 py-2 text-xs font-medium text-ink-subtle">
              Action
            </th>
            <th className="px-3 py-2 text-xs font-medium text-ink-subtle">
              Actor
            </th>
            <th className="px-3 py-2 text-xs font-medium text-ink-subtle">
              Entity
            </th>
            <th className="px-3 py-2 text-xs font-medium text-ink-subtle">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b border-border last:border-0">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-ink-muted">
                {new Date(l.createdAt).toLocaleString()}
              </td>
              <td className="px-3 py-2 text-xs text-ink">{l.actionType}</td>
              <td className="px-3 py-2 text-xs text-ink-muted">{l.actor}</td>
              <td className="max-w-[140px] truncate px-3 py-2 text-xs text-ink-muted">
                {l.entityType}:{l.entityId}
              </td>
              <td className="max-w-md px-3 py-2 text-xs text-ink-muted">
                {l.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

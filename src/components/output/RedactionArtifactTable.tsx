import type { RedactionFlag } from "@/types";

export function RedactionArtifactTable({ flags }: { flags: RedactionFlag[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-zinc-50/80">
            <th className="px-4 py-2.5 text-xs font-medium text-ink-subtle">
              Flagged item
            </th>
            <th className="px-4 py-2.5 text-xs font-medium text-ink-subtle">
              Entity type
            </th>
            <th className="px-4 py-2.5 text-xs font-medium text-ink-subtle">
              Reason
            </th>
            <th className="px-4 py-2.5 text-xs font-medium text-ink-subtle">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {flags.map((f) => (
            <tr key={f.id} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 text-ink">{f.entityLabel}</td>
              <td className="px-4 py-2.5 text-xs text-ink-muted">{f.entityType}</td>
              <td className="max-w-md px-4 py-2.5 text-xs text-ink-muted">
                {f.reason}
              </td>
              <td className="px-4 py-2.5 text-xs font-medium text-ink">{f.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

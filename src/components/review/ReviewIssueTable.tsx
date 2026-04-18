import { Link } from "react-router-dom";
import { ReviewStatusBadge, SeverityBadge } from "@/components/review/ReviewIssueBadge";
import type { ReviewIssue } from "@/types";

type ReviewIssueTableProps = {
  issues: ReviewIssue[];
};

export function ReviewIssueTable({ issues }: ReviewIssueTableProps) {
  if (issues.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-ink-muted">
        No issues match the current filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Severity</th>
            <th className="px-3 py-2">Entity</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {issues.map((i) => (
            <tr key={i.id} className="hover:bg-zinc-50/50">
              <td className="px-3 py-2">
                <Link
                  to={`/review/issues/${encodeURIComponent(i.id)}`}
                  className="font-medium text-ink underline-offset-2 hover:underline"
                >
                  {i.title}
                </Link>
              </td>
              <td className="max-w-[10rem] truncate px-3 py-2 text-ink-muted">
                {i.issueType}
              </td>
              <td className="px-3 py-2">
                <SeverityBadge severity={i.severity} />
              </td>
              <td className="px-3 py-2 text-xs text-ink-muted">
                {i.entityType}
                <span className="block truncate text-ink-subtle">
                  {i.entityId.slice(0, 12)}
                  {i.entityId.length > 12 ? "…" : ""}
                </span>
              </td>
              <td className="px-3 py-2">
                <ReviewStatusBadge status={i.status} />
              </td>
              <td className="px-3 py-2 text-xs text-ink-muted">
                {new Date(i.updatedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

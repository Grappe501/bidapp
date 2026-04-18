import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import type { DraftPacketRow } from "@/lib/client-review-utils";
import { cn } from "@/lib/utils";

export function ClientReviewDraftStatus({ rows }: { rows: DraftPacketRow[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Draft sections & packet posture
      </h2>
      <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
        Scored volumes and supporting narrative — status, strength signal, and whether
        the section is appropriate to circulate in a client review packet.
      </p>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50/90">
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Section
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Status
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Readiness signal
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Client review
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sectionId} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <span className="font-medium text-ink">{r.sectionType}</span>
                  {r.grounded ? (
                    <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-emerald-800">
                      Grounded
                    </span>
                  ) : (
                    <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
                      No bundle
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{r.status}</td>
                <td className="px-4 py-3 text-xs text-ink">{r.strengthLabel}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      r.clientReviewLabel.startsWith("Ready")
                        ? "text-emerald-900"
                        : "text-ink-muted",
                    )}
                  >
                    {r.clientReviewLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/drafts/${r.sectionId}`}
                    className="text-xs font-semibold text-ink underline-offset-2 hover:underline"
                  >
                    Open section →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

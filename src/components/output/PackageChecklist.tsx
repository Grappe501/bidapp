import { cn } from "@/lib/utils";
import type { SubmissionPackageChecklistRow } from "@/lib/output-utils";
import { artifactSourcePath } from "@/lib/output-utils";
import { Link } from "react-router-dom";
import { OutputStatusBadge } from "./OutputStatusBadge";

export function PackageChecklist({
  rows,
}: {
  rows: SubmissionPackageChecklistRow[];
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Production checklist (S000000479 solicitation structure)
      </h2>
      <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
        Each row is a <span className="font-medium text-ink">required</span> or
        tracked solicitation item. The{" "}
        <span className="font-medium text-ink">source artifact</span> is the live
        object in drafting or Bid control.{" "}
        <span className="font-medium text-ink">Packaging threshold</span> is met when the
        artifact is Ready, Validated, or Locked (output workflow).
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50/90">
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Package item
              </th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Required
              </th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Category
              </th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Status
              </th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Packaging threshold
              </th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Source
              </th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Owner
              </th>
              <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                Blocker
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hit = row.sourceArtifact;
              const ref = hit ? artifactSourcePath(hit) : null;
              return (
                <tr
                  key={row.specId}
                  className={cn(
                    "border-b border-border last:border-0",
                    row.blocker && "bg-amber-50/35",
                    !hit && row.required && "bg-amber-50/50",
                  )}
                >
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-ink">{row.packageItemLabel}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-muted">
                      {row.explanation}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {row.required ? (
                      <span className="font-semibold text-ink">Required</span>
                    ) : (
                      <span className="text-ink-muted">Optional</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ink-muted">
                    {row.category}
                  </td>
                  <td className="px-3 py-2.5">
                    {hit ? (
                      <OutputStatusBadge status={hit.status} />
                    ) : (
                      <span className="text-xs text-ink-muted">Not linked</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {hit ? (
                      hit.isValidated ? (
                        <span className="font-medium text-emerald-800">Met</span>
                      ) : (
                        <span className="text-amber-900">Not met</span>
                      )
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {hit ? (
                      <div className="space-y-1">
                        <p className="text-ink-muted">{hit.artifactType}</p>
                        {ref ? (
                          <Link
                            to={ref.to}
                            className="font-medium text-ink underline-offset-2 hover:underline"
                          >
                            {ref.label}
                          </Link>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ink-muted">
                    {row.owner ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {row.blocker ? (
                      <span className="font-semibold text-amber-900">Yes</span>
                    ) : (
                      <span className="text-ink-subtle">No</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

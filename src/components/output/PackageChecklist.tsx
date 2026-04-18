import { cn } from "@/lib/utils";
import type { OutputArtifact } from "@/types";
import { OutputStatusBadge } from "./OutputStatusBadge";

/** High-level checklist rows aligned to solicitation assembly (labels + live artifact match). */
const ROW_HINTS: { label: string; match: (a: OutputArtifact) => boolean }[] = [
  {
    label: "Proposal signature page",
    match: (a) =>
      a.sourceEntityType === "submission_item" &&
      a.title.toLowerCase().includes("signature"),
  },
  {
    label: "Proposed subcontractors form",
    match: (a) =>
      a.sourceEntityType === "submission_item" &&
      a.title.toLowerCase().includes("subcontractor"),
  },
  {
    label: "Recommended options / vendor workbook",
    match: (a) =>
      a.sourceEntityType === "submission_item" &&
      a.title.toLowerCase().includes("recommended"),
  },
  {
    label: "Minimum RFP requirements",
    match: (a) => a.id === "out-req-matrix",
  },
  {
    label: "Experience section",
    match: (a) =>
      a.artifactType === "Draft Section" && a.notes === "Experience",
  },
  {
    label: "Solution section",
    match: (a) =>
      a.artifactType === "Draft Section" && a.notes === "Solution",
  },
  {
    label: "Risk section",
    match: (a) => a.artifactType === "Draft Section" && a.notes === "Risk",
  },
  {
    label: "Equal opportunity policy",
    match: (a) =>
      a.sourceEntityType === "submission_item" &&
      a.title.toLowerCase().includes("equal"),
  },
  {
    label: "Official price sheet",
    match: (a) =>
      a.artifactType === "Price Sheet Support" ||
      (a.sourceEntityType === "submission_item" &&
        a.title.toLowerCase().includes("price")),
  },
  {
    label: "Redacted copy (if applicable)",
    match: (a) => a.artifactType === "Redacted Copy",
  },
];

export function PackageChecklist({ artifacts }: { artifacts: OutputArtifact[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-zinc-50/80">
            <th className="px-4 py-2.5 text-xs font-medium text-ink-subtle">
              Item
            </th>
            <th className="px-4 py-2.5 text-xs font-medium text-ink-subtle">
              Status
            </th>
            <th className="px-4 py-2.5 text-xs font-medium text-ink-subtle">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {ROW_HINTS.map((row) => {
            const hit = artifacts.find(row.match);
            return (
              <tr
                key={row.label}
                className={cn(
                  "border-b border-border last:border-0",
                  !hit && "bg-amber-50/40",
                )}
              >
                <td className="px-4 py-2.5 text-ink">{row.label}</td>
                <td className="px-4 py-2.5">
                  {hit ? (
                    <OutputStatusBadge status={hit.status} />
                  ) : (
                    <span className="text-xs text-ink-muted">Not linked</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-ink-muted">
                  {hit?.notes ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

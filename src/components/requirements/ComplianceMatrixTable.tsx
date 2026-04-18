import { Badge } from "@/components/ui/Badge";
import { formatRecordDate } from "@/lib/display-format";
import { RequirementSupportSummary } from "@/components/evidence/RequirementSupportSummary";
import { RequirementRiskBadge } from "@/components/requirements/RequirementRiskBadge";
import { RequirementStatusBadge } from "@/components/requirements/RequirementStatusBadge";
import { RequirementTagBadge } from "@/components/control/RequirementTagBadge";
import type { Requirement, RequirementSupportSummaryLevel } from "@/types";

type ComplianceMatrixTableProps = {
  requirements: Requirement[];
  supportLevelByRequirementId: Record<string, RequirementSupportSummaryLevel>;
  onOpen: (req: Requirement) => void;
};

export function ComplianceMatrixTable({
  requirements,
  supportLevelByRequirementId,
  onOpen,
}: ComplianceMatrixTableProps) {
  if (requirements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-zinc-50/50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-ink">No requirements match</p>
        <p className="mt-1 text-sm text-ink-muted">
          Adjust filters or approve candidates from extraction.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-raised shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50/80">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Requirement
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Ops tags
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Type
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Mandatory
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Response
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Risk
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Support
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Source file
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((r) => (
              <tr
                key={r.id}
                className="cursor-pointer border-b border-border last:border-b-0 hover:bg-zinc-50/80"
                onClick={() => onOpen(r)}
              >
                <td className="max-w-[280px] px-4 py-3 align-top">
                  <div className="font-medium leading-snug text-ink">
                    {r.title}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-ink-muted">
                    {r.summary}
                  </div>
                </td>
                <td className="max-w-[140px] px-4 py-3 align-top">
                  <div className="flex flex-wrap gap-1">
                    {r.tags.map((t) => (
                      <RequirementTagBadge key={t} tag={t} />
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <Badge variant="neutral" className="font-normal">
                    {r.requirementType}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <Badge variant={r.mandatory ? "emphasis" : "muted"}>
                    {r.mandatory ? "Yes" : "No"}
                  </Badge>
                </td>
                <td className="max-w-[120px] px-4 py-3 align-top">
                  <span className="text-xs text-ink-muted">
                    {r.responseCategory}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <RequirementStatusBadge status={r.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <RequirementRiskBadge risk={r.riskLevel} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top">
                  <RequirementSupportSummary
                    level={supportLevelByRequirementId[r.id] ?? "None"}
                    variant="matrix"
                  />
                </td>
                <td className="max-w-[160px] px-4 py-3 align-top">
                  <span className="break-words text-xs text-ink-muted">
                    {r.sourceFileName}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-ink-muted">
                  {formatRecordDate(r.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

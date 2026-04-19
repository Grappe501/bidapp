import { Card } from "@/components/ui/Card";
import {
  CANONICAL_RFP_S000000479,
  S000000479_BID_NUMBER,
} from "@/data/canonical-rfp-s000000479";
import type { Project } from "@/types";

/**
 * Prominent display of official RFP dates and Table A schedule (S479).
 * Other bids: hidden until canonical metadata exists.
 */
export function SolicitationTimelinePanel({ project }: { project: Project }) {
  if (project.bidNumber !== S000000479_BID_NUMBER) return null;
  const official = CANONICAL_RFP_S000000479.official;
  if (!official) return null;

  return (
    <Card className="overflow-hidden border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-rose-50/40 p-0 shadow-sm ring-1 ring-amber-200/50">
      <div className="border-b border-amber-200/70 bg-amber-50/80 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-950/80">
          Official solicitation — key dates
        </p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-ink">
          Proposal due{" "}
          <time dateTime={CANONICAL_RFP_S000000479.core.dueDate}>
            {CANONICAL_RFP_S000000479.core.dueDate}
          </time>
          {official.proposalDueTime ? (
            <span className="text-ink-subtle">
              {" "}
              · {official.proposalDueTime}
              {official.timeZone ? ` ${official.timeZone}` : ""}
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {official.solicitationIssued
            ? `Solicitation issued ${official.solicitationIssued}. `
            : null}
          Submit via ARBuy only. Times in Central Time unless noted.
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-ink-subtle">
          {official.sourceAttestation}
        </p>
        <p className="mt-3 text-xs">
          <a
            href="/solicitation/S479-RFP-Pharmacy-Services-HDCs-official.pdf"
            className="font-medium text-emerald-900 underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Open official RFP PDF
          </a>
        </p>
      </div>
      <div className="px-5 py-4">
        <p className="text-xs font-semibold text-ink">Table A — tentative solicitation schedule</p>
        <p className="mt-1 text-[10px] text-ink-subtle">
          Rows marked * are anticipated only and may change.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/80 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                <th className="py-2 pr-3 font-medium">Activity</th>
                <th className="py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {official.scheduleRows.map((row) => (
                <tr
                  key={row.activity}
                  className="border-b border-border/40 bg-white/50"
                >
                  <td className="py-2 pr-3 text-ink">
                    {row.activity}
                    {row.tentative ? (
                      <span className="text-ink-subtle"> *</span>
                    ) : null}
                  </td>
                  <td className="py-2 font-medium tabular-nums text-ink">
                    {row.dateDisplay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

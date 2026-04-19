import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { buildProjectGroundingBundleRfp } from "@/lib/rfp-narrative";
import { pickStructuredRfp } from "@/lib/rfp-document-validation";
import type { Project } from "@/types";

type RfpExpectationsPanelProps = {
  project: Project;
};

export function RfpExpectationsPanel({ project }: RfpExpectationsPanelProps) {
  const layer = useMemo(
    () =>
      buildProjectGroundingBundleRfp({
        bidNumber: project.bidNumber,
        title: project.title,
        issuingOrganization: project.issuingOrganization,
        dueDate: project.dueDate,
      }),
    [project],
  );
  const s = pickStructuredRfp(layer);

  return (
    <Card className="space-y-4 border border-zinc-200/90 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-ink">Solicitation expectations</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Structured from the registered RFP for{" "}
          <span className="font-mono font-medium text-ink">{s.core.solicitationNumber}</span> —
          strategy and drafting should trace to these signals.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Service &amp; delivery
          </p>
          {[...s.requirements.deliveryRequirements, ...s.requirements.serviceRequirements]
            .length > 0 ? (
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-ink-muted">
              {[...s.requirements.deliveryRequirements, ...s.requirements.serviceRequirements].map(
                (x) => (
                  <li key={x}>{x}</li>
                ),
              )}
            </ul>
          ) : (
            <p className="mt-1.5 text-xs text-ink-subtle">No registered service lines for this bid.</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Technical &amp; compliance
          </p>
          {[...s.requirements.techRequirements, ...s.requirements.complianceRequirements].length >
          0 ? (
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-ink-muted">
              {[...s.requirements.techRequirements, ...s.requirements.complianceRequirements].map(
                (x) => (
                  <li key={x}>{x}</li>
                ),
              )}
            </ul>
          ) : (
            <p className="mt-1.5 text-xs text-ink-subtle">No registered technical requirements.</p>
          )}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Critical risk themes
        </p>
        {s.risks.criticalRisks.length > 0 ? (
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-ink-muted">
            {s.risks.criticalRisks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-xs text-ink-subtle">No canonical risk list for this solicitation.</p>
        )}
      </div>

      <p className="border-t border-zinc-100 pt-3 text-[10px] leading-relaxed text-ink-subtle">
        Grounding bundles built after this release attach{" "}
        <span className="font-medium text-ink">rfp</span> metadata for draft generation —
        rebuild bundles if they predate structured RFP enforcement.
      </p>
    </Card>
  );
}

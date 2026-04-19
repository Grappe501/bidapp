import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { useDrafting } from "@/context/useDrafting";
import { useOutput } from "@/context/useOutput";
import { useWorkspace } from "@/context/useWorkspace";
import { computeContractReadiness } from "@/lib/contract-readiness";
import { cn } from "@/lib/utils";

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-ink-muted">{label}</span>
      <span
        className={cn(
          "font-medium",
          ok ? "text-emerald-800" : "text-amber-900",
        )}
        aria-label={ok ? "Satisfied" : "Not satisfied"}
      >
        {ok ? "✓" : "✗"}
      </span>
    </div>
  );
}

export function ContractReadinessSection() {
  const { project, files } = useWorkspace();
  const { sections, getActiveVersion } = useDrafting();
  const { artifacts } = useOutput();

  const activeDraftContentBySectionId = useMemo(() => {
    const o: Record<string, string | undefined> = {};
    for (const sec of sections) {
      o[sec.id] = getActiveVersion(sec.id)?.content;
    }
    return o;
  }, [sections, getActiveVersion]);

  const readiness = useMemo(
    () =>
      computeContractReadiness({
        project,
        files,
        artifacts,
        sections,
        activeDraftContentBySectionId,
      }),
    [project, files, artifacts, sections, activeDraftContentBySectionId],
  );

  return (
    <Card className="space-y-4 border border-slate-200/90 bg-gradient-to-br from-slate-50/80 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Contract readiness (SRV-1)</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
            Scope, measurable performance, structured pricing (line items + annualized value), and
            compliance artifacts aligned to the SRV-1 template and solicitation.
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide",
            readiness.ready
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
              : "border-amber-200 bg-amber-50/90 text-amber-950",
          )}
        >
          {readiness.ready ? "Ready" : "Not ready"}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Contract readiness
          </p>
          <div className="mt-2 space-y-1.5">
            <Flag ok={readiness.scopeCompleteness} label="Scope completeness" />
            <Flag ok={readiness.performanceDefinition} label="Performance definition" />
            <Flag ok={readiness.pricingStructured} label="Pricing structure" />
            <Flag ok={readiness.complianceCoverage} label="Compliance coverage" />
          </div>
        </div>
        <p className="text-[10px] leading-relaxed text-ink-subtle">
          Pricing must include service breakdown, definable rates, total and annualized value — flat
          unstructured pricing is rejected. Drafts are contract-disciplined when grounding bundles
          include SRV-1 structure (rebuild bundle after deploy).
        </p>
      </div>
    </Card>
  );
}

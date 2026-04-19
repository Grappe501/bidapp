import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { S000000479_BID_NUMBER } from "@/data/canonical-rfp-s000000479";
import {
  buildPricingLayerForProject,
  computeArbuyQuoteStructureAlignment,
  computePricingHealth,
} from "@/lib/pricing-structure";
import { cn } from "@/lib/utils";
import type { FileRecord, Project } from "@/types";

function Row({
  label,
  ok,
}: {
  label: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-ink-muted">{label}</span>
      <span
        className={cn(
          "font-medium",
          ok ? "text-emerald-800" : "text-amber-900",
        )}
        aria-label={ok ? "OK" : "Needs attention"}
      >
        {ok ? "✅" : "❌"}
      </span>
    </div>
  );
}

type PricingReadinessSectionProps = {
  project: Project;
  files: FileRecord[];
};

export function PricingReadinessSection({ project, files }: PricingReadinessSectionProps) {
  const { layer, health, arbuyAlign } = useMemo(() => {
    const layerInner = buildPricingLayerForProject(project.bidNumber, files);
    const align =
      project.bidNumber === S000000479_BID_NUMBER
        ? computeArbuyQuoteStructureAlignment(project.bidNumber, layerInner)
        : null;
    return {
      layer: layerInner,
      health: computePricingHealth(layerInner),
      arbuyAlign: align,
    };
  }, [project.bidNumber, files]);

  const rfpLine = layer.rfpCoverage.filter((r) => !r.ok).length;

  return (
    <Card className="space-y-4 border border-violet-200/80 bg-gradient-to-br from-violet-50/40 to-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Pricing status</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
            Structured workbook model (line items, categories, annual and contract totals) aligned to
            RFP services and SRV-1. Paste{" "}
            <span className="font-mono text-[11px] text-ink">PricingModel</span> JSON into a{" "}
            <span className="font-medium text-ink">Pricing</span> file description to override the
            canonical scaffold for this bid number.
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide",
            health.ready
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
              : "border-amber-200 bg-amber-50/90 text-amber-950",
          )}
        >
          {health.ready ? "Ready" : "Not ready"}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            PRICING STATUS
          </p>
          <div className="mt-2 space-y-1.5">
            <Row label="Parsed" ok={health.parsed} />
            <Row label="Categorized" ok={health.categorized} />
            <Row label="RFP coverage" ok={health.rfpCoverage} />
            <Row label="Contract compliant" ok={health.contractCompliant} />
            <Row label="Ready" ok={health.ready} />
            {arbuyAlign ? (
              <>
                <Row
                  label="ARBuy item structure loaded"
                  ok={arbuyAlign.itemStructureLoaded}
                />
                <Row
                  label="Line count vs ARBuy grid"
                  ok={
                    arbuyAlign.pricingLineCount === arbuyAlign.arbuyQuoteLineCount
                  }
                />
                <Row
                  label="Line-item price support"
                  ok={arbuyAlign.lineItemPriceSupportAttached}
                />
              </>
            ) : null}
          </div>
        </div>
        <div className="space-y-2 text-[11px] leading-relaxed text-ink-muted">
          <p>
            <span className="font-medium text-ink">Annual</span>{" "}
            <span className="tabular-nums">
              ${layer.model.totals.annual.toLocaleString()}
            </span>
            {" · "}
            <span className="font-medium text-ink">Contract total</span>{" "}
            <span className="tabular-nums">
              ${layer.model.totals.contractTotal.toLocaleString()}
            </span>
          </p>
          {rfpLine > 0 ? (
            <p className="text-amber-950/90">
              Missing RFP pricing signals:{" "}
              {layer.rfpCoverage
                .filter((r) => !r.ok)
                .map((r) => r.key)
                .join(", ")}
            </p>
          ) : layer.model.items.length > 0 ? (
            <p className="text-emerald-900/90">All required service lines represented in line items.</p>
          ) : null}
          {layer.notes.length > 0 ? (
            <ul className="list-inside list-disc text-ink-subtle">
              {layer.notes.slice(0, 4).map((n) => (
                <li key={n.slice(0, 48)}>{n}</li>
              ))}
            </ul>
          ) : null}
          {arbuyAlign ? (
            <p className="text-[11px] leading-relaxed text-ink-muted">
              {arbuyAlign.notes.join(" ")}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

import { Card } from "@/components/ui/Card";
import type { WorkbookPricingPreview } from "@/lib/pricing-reality-preview";

export function PricingRiskSummaryCard(props: { preview: WorkbookPricingPreview }) {
  const { preview } = props;
  return (
    <Card className="space-y-2 border-zinc-200/80 bg-zinc-50/30 p-4">
      <h2 className="text-sm font-semibold text-ink">Pricing risk (workbook)</h2>
      <p className="text-xs text-ink-muted">
        Quick cross-check of structured lines vs benchmark — vendor-specific Malone and role alignment
        is on each vendor&apos;s detail page.
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span>
          Completeness:{" "}
          <span className="font-medium capitalize text-ink">{preview.completeness}</span>
        </span>
        <span>
          Consistency:{" "}
          <span className="font-medium capitalize text-ink">{preview.consistency}</span>
        </span>
        <span>
          Level:{" "}
          <span className="font-medium capitalize text-ink">{preview.pricingLevel}</span>
        </span>
      </div>
      {preview.keyRisks.length > 0 ? (
        <ul className="list-inside list-disc text-[11px] text-amber-950/90">
          {preview.keyRisks.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-emerald-900/80">No major workbook-only flags.</p>
      )}
    </Card>
  );
}

import { Card } from "@/components/ui/Card";
import type { VendorPricingReality } from "@/types";

function riskBandClass(v: "low" | "medium" | "high"): string {
  if (v === "high") return "text-amber-950 font-medium";
  if (v === "medium") return "text-ink font-medium";
  return "text-emerald-900/90";
}

export function VendorPricingRealityCard(props: {
  reality: VendorPricingReality | null | undefined;
}) {
  const { reality } = props;
  if (!reality) {
    return (
      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Pricing reality
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Run <span className="font-medium text-ink">Compute score</span> from the vendor overview
          after pricing files exist on the project — evaluates workbook vs role-fit and risk signals.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Pricing reality (heuristic)
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          Project workbook + this vendor&apos;s role-fit and failure posture — not a finance audit.
        </p>
      </div>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <p>
          Completeness:{" "}
          <span className="capitalize text-ink">{reality.completeness}</span>
        </p>
        <p>
          Consistency:{" "}
          <span className="capitalize text-ink">{reality.consistency}</span>
        </p>
        <p>
          Level vs benchmark:{" "}
          <span className="capitalize text-ink">{reality.pricingLevel}</span>
        </p>
        <p>
          Role alignment:{" "}
          <span className="capitalize text-ink">{reality.roleAlignment}</span>
        </p>
        <p className={riskBandClass(reality.underpricingRisk)}>
          Underpricing risk: {reality.underpricingRisk}
        </p>
        <p className={riskBandClass(reality.hiddenCostRisk)}>
          Hidden cost risk: {reality.hiddenCostRisk}
        </p>
        <p className={riskBandClass(reality.maloneUnpricedDependency)}>
          Malone unpriced dependency: {reality.maloneUnpricedDependency}
        </p>
        <p className={riskBandClass(reality.volatilityRisk)}>
          Volatility risk: {reality.volatilityRisk}
        </p>
      </div>
      {reality.keyFindings.length > 0 ? (
        <div>
          <p className="text-[10px] font-medium uppercase text-ink-subtle">Key findings</p>
          <ul className="mt-1 list-inside list-disc text-xs text-ink-muted">
            {reality.keyFindings.slice(0, 5).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {reality.missingPricingAreas.length > 0 ? (
        <p className="text-[11px] text-amber-950/90">
          Gaps: {reality.missingPricingAreas.slice(0, 5).join("; ")}
        </p>
      ) : null}
    </Card>
  );
}

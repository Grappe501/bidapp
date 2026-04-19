import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ArchitectureOption } from "@/types";

type ArchitectureCompetitorStripProps = {
  options: ArchitectureOption[];
};

/**
 * Surfaces that stack choices affect bid scoring — link to comparative vendor analysis.
 */
export function ArchitectureCompetitorStrip({
  options,
}: ArchitectureCompetitorStripProps) {
  const withVendors = options.filter((o) =>
    o.components.some((c) => c.vendorName.trim() || c.vendorId),
  );

  return (
    <Card className="border-emerald-900/10 bg-emerald-50/30 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-900/70">
        Vendor implications for this solicitation
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        Each architecture option ties vendors into Solution and Risk narratives.
        Compare evidence-backed competitiveness (integration burden, proof gaps, interview
        defense) before locking a stack — not just role labels.
      </p>
      {withVendors.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-ink-muted">
          {withVendors.map((o) => (
            <li key={o.id}>
              <span className="font-medium text-ink">{o.name}</span>
              {o.recommended ? (
                <span className="ml-2 text-xs text-emerald-800">(recommended)</span>
              ) : null}
              :{" "}
              {o.components
                .filter((c) => c.vendorName.trim())
                .map((c) => `${c.vendorName} (${c.role})`)
                .join("; ") || "No vendor names on components."}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">
          Assign vendors to components to make stack trade-offs visible.
        </p>
      )}
      <div className="mt-4">
        <Link to="/vendors/compare">
          <Button type="button" variant="secondary" className="text-xs">
            Open competitor comparison
          </Button>
        </Link>
      </div>
    </Card>
  );
}

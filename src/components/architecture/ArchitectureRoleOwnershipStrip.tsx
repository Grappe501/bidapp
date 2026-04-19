import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { postVendorIntelligence } from "@/lib/functions-api";
import type { ArchitectureComponent } from "@/types";
import type { VendorRoleFitSummary } from "@/types";

/**
 * Per-vendor role strategy summary for vendors in the selected architecture option.
 */
export function ArchitectureRoleOwnershipStrip(props: {
  projectId: string;
  components: ArchitectureComponent[];
}) {
  const { projectId, components } = props;
  const [byVendor, setByVendor] = useState<
    Record<string, { name: string; summary: VendorRoleFitSummary | null }>
  >({});
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const ids = [...new Set(components.map((c) => c.vendorId).filter(Boolean))];
    if (ids.length === 0) {
      setByVendor({});
      return;
    }
    setErr(null);
    try {
      const entries = await Promise.all(
        ids.map(async (vendorId) => {
          const comp = components.find((c) => c.vendorId === vendorId);
          const res = (await postVendorIntelligence({
            projectId,
            vendorId,
            action: "listRoleFit",
          })) as { summary: VendorRoleFitSummary | null };
          return {
            vendorId,
            name: comp?.vendorName ?? vendorId,
            summary: res.summary,
          };
        }),
      );
      setByVendor(
        Object.fromEntries(
          entries.map((e) => [e.vendorId, { name: e.name, summary: e.summary }]),
        ),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load role fit");
      setByVendor({});
    }
  }, [projectId, components]);

  useEffect(() => {
    void load();
  }, [load]);

  if (components.length === 0) return null;

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">Role fit (this option)</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Summaries from stored role-fit analysis per vendor. Run analysis on each vendor detail page
          if empty.
        </p>
      </div>
      {err ? <p className="text-xs text-amber-800">{err}</p> : null}
      <ul className="space-y-2 text-xs">
        {Object.entries(byVendor).map(([vendorId, v]) => (
          <li
            key={vendorId}
            className="rounded-md border border-border bg-zinc-50/50 px-3 py-2 text-ink-muted"
          >
            <span className="font-medium text-ink">{v.name}</span>
            {v.summary ? (
              <>
                {" "}
                —{" "}
                <span className="capitalize">
                  {v.summary.roleStrategyAssessment.replace(/_/g, " ")}
                </span>
                {" · "}
                strong own {v.summary.strongOwnRoles.length}, avoid{" "}
                {v.summary.avoidRoles.length}, high Malone-dep roles{" "}
                {v.summary.highestDependencyRoles.length}
              </>
            ) : (
              <span> — no role-fit data yet</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

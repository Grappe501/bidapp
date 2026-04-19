import type { AgentMaloneActionRequest } from "@/types";

type Props = {
  projectId: string;
  selectedVendorId?: string | null;
  architectureOptionId?: string | null;
  onRun: (req: AgentMaloneActionRequest) => void;
  disabled?: boolean;
};

export function AgentMaloneQuickActions({
  projectId,
  selectedVendorId,
  architectureOptionId,
  onRun,
  disabled,
}: Props) {
  const arch = architectureOptionId ?? null;
  const vid = selectedVendorId ?? undefined;

  const rows: Array<{
    label: string;
    req: AgentMaloneActionRequest;
    needsVendor?: boolean;
  }> = [
    {
      label: "Refresh final readiness",
      req: {
        actionType: "refresh_final_readiness",
        projectId,
        architectureOptionId: arch,
      },
    },
    {
      label: "Run competitor simulation",
      req: {
        actionType: "run_competitor_simulation",
        projectId,
        architectureOptionId: arch,
      },
    },
    {
      label: "Build Solution bundle",
      req: {
        actionType: "build_grounding_bundle",
        projectId,
        bundleType: "Solution",
        architectureOptionId: arch,
      },
    },
    {
      label: "Build Risk bundle",
      req: {
        actionType: "build_grounding_bundle",
        projectId,
        bundleType: "Risk",
        architectureOptionId: arch,
      },
    },
    {
      label: "Run decision synthesis",
      req: {
        actionType: "run_decision_synthesis",
        projectId,
        architectureOptionId: arch,
      },
    },
    {
      label: "Run narrative alignment",
      req: {
        actionType: "run_narrative_alignment",
        projectId,
        architectureOptionId: arch,
      },
    },
    {
      label: "Refresh strategy state",
      req: {
        actionType: "run_strategy_refresh_recipe",
        projectId,
        architectureOptionId: arch,
      },
    },
    {
      label: "Re-run vendor research",
      req: {
        actionType: "run_vendor_research",
        projectId,
        vendorId: vid,
        architectureOptionId: arch,
      },
      needsVendor: true,
    },
    {
      label: "Generate interview questions",
      req: {
        actionType: "generate_vendor_interview",
        projectId,
        vendorId: vid,
        architectureOptionId: arch,
      },
      needsVendor: true,
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Quick actions
      </p>
      <p className="text-[11px] text-ink-muted">
        Controlled workflows run on the server — not autonomous. Vendor-scoped
        actions need a vendor in context (add{" "}
        <code className="rounded bg-zinc-100 px-1">?vendorId=</code> to the URL or open
        from a vendor page).
      </p>
      <div className="flex flex-wrap gap-2">
        {rows.map((r) => {
          const blocked = r.needsVendor && !vid;
          return (
            <button
              key={r.label}
              type="button"
              disabled={disabled || blocked}
              title={
                blocked
                  ? "Select a vendor (URL ?vendorId=) for this action"
                  : undefined
              }
              onClick={() => onRun(r.req)}
              className="rounded-md border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 text-left text-xs font-medium text-amber-950 transition-colors hover:bg-amber-100/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

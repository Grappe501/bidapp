import { Card } from "@/components/ui/Card";
import { useAppBranding } from "@/context/app-branding-context";
import { useArchitecture } from "@/context/useArchitecture";
import { useDemoMode } from "@/context/demo-mode-context";
import { useOutput } from "@/context/useOutput";
import { useWorkspace } from "@/context/useWorkspace";
import { readinessHeadline } from "@/lib/client-review-utils";

/**
 * Executive-facing overview for client demo mode (layered above existing dashboard cards).
 */
export function DashboardDemoHero() {
  const { isDemoMode, demoClientDisplayName } = useDemoMode();
  const { project } = useWorkspace();
  const { readiness } = useOutput();
  const { options } = useArchitecture();
  const { branding } = useAppBranding();

  if (!isDemoMode) return null;

  const recommended = options.find((o) => o.recommended);
  const strengths =
    branding?.serviceLines?.slice(0, 3).filter(Boolean) ??
    branding?.capabilities?.slice(0, 3).filter(Boolean) ??
    [];

  const nextActions: string[] = [];
  if (readiness.overall < 0.85) {
    nextActions.push("Close readiness gaps flagged in Review.");
  }
  nextActions.push("Validate client review packet in Output.");
  if (!recommended) {
    nextActions.push("Confirm architecture recommendation in Architecture.");
  } else {
    nextActions.push(`Align solution narrative with "${recommended.name}".`);
  }

  return (
    <Card className="overflow-hidden border border-slate-200/90 bg-gradient-to-br from-slate-50/95 via-white to-emerald-50/40 p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {demoClientDisplayName} · {project.bidNumber}
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {project.title}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
            Pharmacy Services for DHS HDCs — bid operating workspace for solicitation{" "}
            <span className="font-medium text-slate-800">{project.bidNumber}</span>.
            This view summarizes readiness and recommended direction for stakeholder
            alignment.
          </p>
          {branding?.summary ? (
            <p className="max-w-2xl border-l-2 border-emerald-700/25 pl-3 text-sm italic leading-relaxed text-slate-700">
              {branding.summary}
            </p>
          ) : null}
        </div>
        <div className="w-full shrink-0 rounded-lg border border-slate-200/80 bg-white/80 px-4 py-3 lg:max-w-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Readiness
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {readinessHeadline(readiness.overall)}
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Overall score {(readiness.overall * 100).toFixed(0)}% — reflects review
            rules across requirements, evidence, and drafts.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 border-t border-slate-200/70 pt-6 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Recommended architecture
          </p>
          <p className="mt-1 text-sm text-slate-800">
            {recommended
              ? `${recommended.name} — Malone-led orchestration with defined vendor roles.`
              : "Define a recommended option in the Architecture workspace."}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Top strengths to emphasize
          </p>
          {strengths.length > 0 ? (
            <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
              {strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              Service lines and capabilities appear here when the company profile is
              loaded from Intelligence.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Suggested next actions
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
          {nextActions.slice(0, 4).map((a) => (
            <li key={a} className="flex gap-2">
              <span className="text-emerald-800" aria-hidden>
                →
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

import { Card } from "@/components/ui/Card";
import type { GroundingBundlePayload, RequirementProofSupportLevel } from "@/types";

type RequirementProofTableProps = {
  bundle: GroundingBundlePayload | null;
};

function levelLabel(level: RequirementProofSupportLevel): string {
  switch (level) {
    case "strong":
      return "Strong";
    case "partial":
      return "Partial";
    case "weak":
      return "Weak";
    default:
      return "None";
  }
}

function levelTone(level: RequirementProofSupportLevel): string {
  switch (level) {
    case "strong":
      return "border-emerald-200/90 bg-emerald-50/50 text-emerald-950";
    case "partial":
      return "border-sky-200/80 bg-sky-50/45 text-ink";
    case "weak":
      return "border-amber-200/80 bg-amber-50/40 text-amber-950";
    default:
      return "border-zinc-200 bg-zinc-50/70 text-ink-muted";
  }
}

export function RequirementProofTable({ bundle }: RequirementProofTableProps) {
  if (!bundle?.requirements.length) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50/40 px-3 py-3 text-xs text-ink-muted">
        No requirements in this bundle — build a grounding bundle after linking requirements
        and evidence.
      </div>
    );
  }

  const support = bundle.requirementSupport ?? {};

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border bg-zinc-50/80 px-3 py-2">
        <h3 className="text-xs font-semibold text-ink">Requirement proof</h3>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          Support levels come from the proof graph (linked evidence + validation), not editor
          heuristics.
        </p>
      </div>
      <div className="max-h-64 overflow-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 border-b border-border bg-white/95 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle backdrop-blur">
            <tr>
              <th className="px-3 py-2">Requirement</th>
              <th className="px-2 py-2">Support</th>
              <th className="px-2 py-2 text-center">Evidence</th>
              <th className="px-3 py-2">Validation mix</th>
            </tr>
          </thead>
          <tbody>
            {bundle.requirements.map((r) => {
              const s = support[r.id];
              const level = s?.level ?? "none";
              const mix = s?.validation_mix ?? {
                verified: 0,
                vendor_claim: 0,
                unverified: 0,
              };
              const evN = s?.evidence_ids.length ?? 0;
              const title =
                r.title.length > 56 ? `${r.title.slice(0, 54)}…` : r.title;
              return (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-2 align-top text-ink">
                    <span className="font-medium">{title}</span>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${levelTone(level)}`}
                    >
                      {levelLabel(level)}
                    </span>
                  </td>
                  <td className="px-2 py-2 align-top text-center tabular-nums text-ink-muted">
                    {evN}
                  </td>
                  <td className="px-3 py-2 align-top text-ink-muted">
                    <span className="tabular-nums">
                      V {mix.verified} · VC {mix.vendor_claim} · U {mix.unverified}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

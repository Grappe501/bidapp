import { Card } from "@/components/ui/Card";
import type { GroundedProseReviewResult } from "@/types";

type ContradictionAlertProps = {
  contradictions: GroundedProseReviewResult["contradictions"];
};

function calmSeverity(
  sourceType: string,
): { label: string; bar: string } {
  const st = sourceType.toLowerCase();
  if (st.includes("vendor") || st.includes("fact")) {
    return { label: "Check against sources", bar: "border-sky-300/90" };
  }
  if (st.includes("architecture") || st.includes("arch")) {
    return { label: "Architecture alignment", bar: "border-violet-300/90" };
  }
  return { label: "Worth verifying", bar: "border-zinc-300" };
}

export function ContradictionAlert({ contradictions }: ContradictionAlertProps) {
  if (!contradictions.length) return null;

  return (
    <Card className="space-y-3 border-zinc-200/90 bg-zinc-50/50 p-4">
      <div>
        <h3 className="text-xs font-semibold text-ink">Possible mismatches</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          These are model-flagged differences between the draft and your grounding
          inputs — use them as a checklist, not a verdict.
        </p>
      </div>
      <ul className="space-y-3">
        {contradictions.slice(0, 8).map((c, i) => {
          const sev = calmSeverity(c.source_type);
          return (
            <li
              key={`${c.text.slice(0, 24)}-${i}`}
              className={`border-l-2 pl-3 text-xs leading-relaxed ${sev.bar}`}
            >
              <p className="font-medium text-ink">{c.text}</p>
              <p className="mt-1 text-ink-muted">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                  {sev.label}
                </span>
                {" — "}
                Conflicts with: {c.conflicts_with}
              </p>
              {c.explanation ? (
                <p className="mt-1 text-[11px] text-ink-muted">{c.explanation}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

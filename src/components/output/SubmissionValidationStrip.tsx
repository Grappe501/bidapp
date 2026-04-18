import { cn } from "@/lib/utils";
import type { SubmissionAssemblyState } from "@/lib/output-utils";

const STEPS: {
  state: SubmissionAssemblyState;
  label: string;
  short: string;
}[] = [
  { state: "not_ready", label: "Not ready", short: "1" },
  { state: "needs_review", label: "Needs review", short: "2" },
  {
    state: "ready_for_final_assembly",
    label: "Ready for final assembly",
    short: "3",
  },
  {
    state: "ready_for_submission_handoff",
    label: "Ready for submission handoff",
    short: "4",
  },
];

function stepIndex(s: SubmissionAssemblyState): number {
  return STEPS.findIndex((x) => x.state === s);
}

export function SubmissionValidationStrip({
  current,
}: {
  current: SubmissionAssemblyState;
}) {
  const idx = stepIndex(current);

  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
        Ready for assembly
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {STEPS.map((step, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <div
              key={step.state}
              className={cn(
                "flex min-w-0 flex-1 basis-[140px] items-center gap-2 rounded-md border px-2.5 py-2 text-xs",
                active &&
                  "border-zinc-500 bg-zinc-50 ring-1 ring-zinc-400/40",
                done && !active && "border-emerald-200/80 bg-emerald-50/40",
                !done && !active && "border-border bg-zinc-50/50 text-ink-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  active && "bg-zinc-900 text-white",
                  done && !active && "bg-emerald-600 text-white",
                  !done && !active && "bg-zinc-200 text-ink-muted",
                )}
              >
                {step.short}
              </span>
              <span
                className={cn(
                  "min-w-0 font-medium leading-tight",
                  active && "text-ink",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-subtle">
        States reflect linked artifacts, packaging validation (Ready / Validated /
        Locked), and redaction clearance — not automated portal upload.
      </p>
    </div>
  );
}

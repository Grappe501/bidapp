import { cn } from "@/lib/utils";

export function SubmissionChecklistStep({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-xs",
        ok ? "border-emerald-200/80 bg-emerald-50/40" : "border-amber-200/80 bg-amber-50/30",
      )}
    >
      <div>
        <p className="font-medium text-ink">{label}</p>
        {detail ? <p className="mt-0.5 text-ink-muted">{detail}</p> : null}
      </div>
      <span className="shrink-0 font-medium tabular-nums text-ink">
        {ok ? "OK" : "Fix"}
      </span>
    </div>
  );
}

import type {
  SubmissionAssemblyAssessment,
  SubmissionPackageSummaryStats,
} from "@/lib/output-utils";
import { Card } from "@/components/ui/Card";

type SubmissionPackageSummaryProps = {
  bidNumber: string;
  stats: SubmissionPackageSummaryStats;
  assessment: SubmissionAssemblyAssessment;
};

export function SubmissionPackageSummary({
  bidNumber,
  stats,
  assessment,
}: SubmissionPackageSummaryProps) {
  return (
    <Card className="overflow-hidden border-zinc-200/90 p-0">
      <div className="border-b border-border bg-zinc-50/80 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Submission package summary · {bidNumber}
        </p>
        <h2 className="mt-1 text-base font-semibold leading-snug text-ink">
          {assessment.headline}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
          {assessment.subline}
        </p>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Required items
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {stats.totalRequiredItems}
          </p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Meeting threshold (required)
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-900">
            {stats.completeItems}
          </p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Missing source artifact
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {stats.missingItems}
          </p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Blockers (below threshold)
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-900">
            {stats.blockedItems}
          </p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Rows meeting threshold (all)
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {stats.validatedItems}
          </p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Core checklist
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {stats.readyForFinalAssembly
              ? "All required items linked and meeting threshold"
              : "Gaps remain — see checklist"}
          </p>
          <p className="mt-1 text-[11px] text-ink-subtle">
            Core means each required row is linked and the artifact is Ready,
            Validated, or Locked. Redaction posture is assessed separately.
          </p>
        </div>
      </div>
    </Card>
  );
}

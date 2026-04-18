import { Card } from "@/components/ui/Card";
import type { CoverageSummary } from "@/lib/requirement-utils";

type RequirementCoverageSummaryProps = {
  summary: CoverageSummary;
};

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card className="min-w-[140px] flex-1 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </Card>
  );
}

export function RequirementCoverageSummary({
  summary,
}: RequirementCoverageSummaryProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
      <Metric label="Total requirements" value={summary.total} />
      <Metric
        label="Mandatory"
        value={summary.mandatory}
        hint="Must be addressed in response"
      />
      <Metric label="Covered" value={summary.coveredCount} />
      <Metric label="Partial" value={summary.partialCount} />
      <Metric label="Unresolved" value={summary.unresolvedCount} />
      <Metric
        label="Critical risk"
        value={summary.criticalRiskCount}
        hint="Highest attention"
      />
    </div>
  );
}

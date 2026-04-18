import { Card } from "@/components/ui/Card";

type ReadinessScoreCardProps = {
  label: string;
  value: number;
  explanation: string;
};

export function ReadinessScoreCard({
  label,
  value,
  explanation,
}: ReadinessScoreCardProps) {
  return (
    <Card className="flex flex-col gap-2 border-zinc-400/15 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          {label}
        </h3>
        <span className="text-2xl font-semibold tabular-nums text-ink">
          {value}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-zinc-800 transition-[width]"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs leading-relaxed text-ink-muted">{explanation}</p>
    </Card>
  );
}

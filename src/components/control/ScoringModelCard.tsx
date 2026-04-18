import { Card } from "@/components/ui/Card";
import { formatScoringCategoryWeightLabel } from "@/lib/display-format";
import type { ScoringCategory } from "@/types";

type ScoringModelCardProps = {
  category: ScoringCategory;
  emphasize?: boolean;
};

export function ScoringModelCard({ category, emphasize }: ScoringModelCardProps) {
  return (
    <Card
      className={
        emphasize
          ? "space-y-3 border-zinc-800 ring-1 ring-zinc-900/10"
          : "space-y-3"
      }
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-ink">{category.name}</h3>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-ink">
            {category.maxPoints}{" "}
            <span className="text-sm font-normal text-ink-muted">pts</span>
          </p>
          <p className="text-xs text-ink-subtle">
            {formatScoringCategoryWeightLabel(category.weight)}
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-ink-muted">
        {category.description}
      </p>
    </Card>
  );
}

import { Card } from "@/components/ui/Card";
import type { FileCategory } from "@/types";

export type CategoryCount = {
  category: FileCategory;
  count: number;
};

type CoverageSnapshotCardProps = {
  distribution: CategoryCount[];
  totalFiles: number;
};

export function CoverageSnapshotCard({
  distribution,
  totalFiles,
}: CoverageSnapshotCardProps) {
  return (
    <Card className="h-full space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">Source mix</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Category distribution across the file library ({totalFiles} total).
        </p>
      </div>
      {distribution.length === 0 ? (
        <p className="text-sm text-ink-muted">No files yet.</p>
      ) : (
        <ul className="space-y-3">
          {distribution.map(({ category, count }) => {
            const pct =
              totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0;
            return (
              <li key={category}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-ink">{category}</span>
                  <span className="shrink-0 tabular-nums text-ink-muted">
                    {count} · {pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-800/80"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

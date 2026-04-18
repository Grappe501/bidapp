import { Card } from "@/components/ui/Card";
import { formatRecordDate } from "@/lib/display-format";
import type { FileRecord } from "@/types";

type ActivityCardProps = {
  recentFiles: FileRecord[];
};

export function ActivityCard({ recentFiles }: ActivityCardProps) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">Recent library activity</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Latest uploads and status changes will deepen once activity logging
          ships. For now, recent files surface from the library.
        </p>
      </div>
      {recentFiles.length === 0 ? (
        <p className="text-sm text-ink-muted">No recent files.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {recentFiles.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate font-medium text-ink">
                {f.name}
              </span>
              <span className="shrink-0 text-xs text-ink-subtle">
                {formatRecordDate(f.uploadedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

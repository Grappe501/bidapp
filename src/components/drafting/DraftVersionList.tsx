import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DraftVersion } from "@/types";

type DraftVersionListProps = {
  versions: DraftVersion[];
  activeVersionId: string | null;
  onSelect: (versionId: string) => void;
};

export function DraftVersionList({
  versions,
  activeVersionId,
  onSelect,
}: DraftVersionListProps) {
  const sorted = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Card className="space-y-2 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Versions
      </h3>
      {sorted.length === 0 ? (
        <p className="text-xs text-ink-muted">No versions yet.</p>
      ) : (
        <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
          {sorted.map((v) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1.5"
            >
              <span className="truncate text-ink-muted">
                {new Date(v.createdAt).toLocaleString()} ·{" "}
                {v.metadata.wordCount} w
                {v.id === activeVersionId ? (
                  <span className="ml-1 font-medium text-ink">(active)</span>
                ) : null}
              </span>
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-2 py-1 text-xs"
                disabled={v.id === activeVersionId}
                onClick={() => onSelect(v.id)}
              >
                Open
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

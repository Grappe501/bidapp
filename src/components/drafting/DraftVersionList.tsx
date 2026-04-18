import { Card } from "@/components/ui/Card";
import { versionOrdinal } from "@/lib/drafting-utils";
import type { DraftVersion } from "@/types";
import { DraftVersionCard } from "./DraftVersionCard";

type DraftVersionListProps = {
  versions: DraftVersion[];
  activeVersionId: string | null;
  sectionLocked: boolean;
  onSetActive: (versionId: string) => void;
  onDuplicate: (versionId: string) => void;
  onNoteCommit: (versionId: string, note: string) => void;
  onToggleVersionLock: (versionId: string, locked: boolean) => void;
};

export function DraftVersionList({
  versions,
  activeVersionId,
  sectionLocked,
  onSetActive,
  onDuplicate,
  onNoteCommit,
  onToggleVersionLock,
}: DraftVersionListProps) {
  const sorted = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          Version history
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-subtle">
          Newest first. Only one version is active in the editor. Protect a version to
          block overwriting it in place; duplicate to branch without losing the original.
        </p>
      </div>
      {sorted.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50/40 px-3 py-3 text-xs text-ink-muted">
          <p className="font-medium text-ink">No saved versions yet</p>
          <p className="mt-1 leading-relaxed">
            Structured generation or <span className="font-medium text-ink">Save new version</span>{" "}
            creates the first entry. Until then, the workspace has no stored versions.
          </p>
        </div>
      ) : (
        <ul className="max-h-[min(28rem,55vh)] space-y-2 overflow-y-auto pr-1">
          {sorted.map((v) => (
            <DraftVersionCard
              key={v.id}
              version={v}
              ordinal={versionOrdinal(versions, v.id)}
              isActive={v.id === activeVersionId}
              sectionLocked={sectionLocked}
              onSetActive={() => onSetActive(v.id)}
              onDuplicate={() => onDuplicate(v.id)}
              onNoteCommit={(note) => onNoteCommit(v.id, note)}
              onToggleLock={() => onToggleVersionLock(v.id, !v.locked)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { formatVersionMetadataSummary } from "@/lib/drafting-utils";
import type { DraftVersion } from "@/types";

type DraftVersionCardProps = {
  version: DraftVersion;
  ordinal: number | null;
  isActive: boolean;
  sectionLocked: boolean;
  onSetActive: () => void;
  onDuplicate: () => void;
  onNoteCommit: (note: string) => void;
  onToggleLock: () => void;
};

export function DraftVersionCard({
  version,
  ordinal,
  isActive,
  sectionLocked,
  onSetActive,
  onDuplicate,
  onNoteCommit,
  onToggleLock,
}: DraftVersionCardProps) {
  const [noteDraft, setNoteDraft] = useState(version.note ?? "");

  useEffect(() => {
    setNoteDraft(version.note ?? "");
  }, [version.id, version.note]);

  const label = ordinal !== null ? `Version ${ordinal}` : "Version";
  const metaLine = formatVersionMetadataSummary(version.metadata);
  const created = new Date(version.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <li
      className={cn(
        "rounded-lg border bg-white px-3 py-2.5 transition-colors",
        isActive
          ? "border-zinc-400 shadow-sm ring-1 ring-zinc-200/80"
          : "border-border hover:border-zinc-300",
        version.locked && "border-l-[3px] border-l-zinc-500",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink">{label}</span>
            {isActive ? (
              <span className="rounded border border-emerald-200/90 bg-emerald-50/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-950/90">
                Active
              </span>
            ) : null}
            {version.locked ? (
              <span className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                Protected
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-ink-subtle">{created}</p>
          <p className="text-[11px] leading-snug text-ink-muted">{metaLine}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Button
            type="button"
            variant="secondary"
            className="px-2 py-1 text-[11px]"
            disabled={isActive}
            onClick={onSetActive}
          >
            Make active
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="px-2 py-1 text-[11px]"
            disabled={sectionLocked}
            onClick={onDuplicate}
          >
            Duplicate
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="px-2 py-1 text-[11px]"
            disabled={sectionLocked}
            onClick={onToggleLock}
          >
            {version.locked ? "Unprotect" : "Protect"}
          </Button>
        </div>
      </div>
      <div className="mt-2 border-t border-border/60 pt-2">
        <label className="block space-y-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
            Note (optional)
          </span>
          <Input
            value={noteDraft}
            disabled={sectionLocked}
            placeholder="e.g. After legal review"
            className="text-xs"
            onChange={(e) => setNoteDraft(e.target.value)}
            onBlur={() => {
              if ((version.note ?? "") !== noteDraft.trim()) {
                onNoteCommit(noteDraft);
              }
            }}
          />
        </label>
      </div>
    </li>
  );
}

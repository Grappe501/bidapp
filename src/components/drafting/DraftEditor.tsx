import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import type { DraftMetadata, DraftStatus } from "@/types";
import {
  countWords,
  estimatePagesFromWords,
} from "@/lib/drafting-utils";
import { DraftStatusSelector } from "./DraftStatusSelector";
import { EditorSaveState } from "./EditorSaveState";

type DraftEditorProps = {
  sectionId: string;
  content: string;
  metadata: DraftMetadata | null;
  status: DraftStatus;
  hasActiveVersion: boolean;
  activeVersionOrdinal: number | null;
  activeVersionProtected: boolean;
  onSaveNewVersion: (
    content: string,
    metadata: DraftMetadata,
  ) => void | Promise<void>;
  onOverwrite: (content: string) => void | Promise<void>;
  onStatusChange: (status: DraftStatus) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

function deriveMeta(content: string, prev: DraftMetadata | null): DraftMetadata {
  const wc = countWords(content);
  return {
    wordCount: wc,
    estimatedPages: estimatePagesFromWords(wc),
    requirementCoverageIds: prev?.requirementCoverageIds ?? [],
    missingRequirementIds: prev?.missingRequirementIds ?? [],
    riskFlags: prev?.riskFlags ?? [],
    unsupportedClaimFlags: prev?.unsupportedClaimFlags ?? [],
    ...(prev?.generationMode ? { generationMode: prev.generationMode } : {}),
  };
}

export function DraftEditor({
  sectionId,
  content,
  metadata,
  status,
  hasActiveVersion,
  activeVersionOrdinal,
  activeVersionProtected,
  onSaveNewVersion,
  onOverwrite,
  onStatusChange,
  onDirtyChange,
}: DraftEditorProps) {
  const [local, setLocal] = useState(content);

  useEffect(() => {
    setLocal(content);
  }, [content, sectionId]);

  const dirty = local !== content;
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const sectionLocked = status === "Locked";
  const isEmpty = !local.trim();
  const overwriteDisabled =
    sectionLocked || !metadata || activeVersionProtected || !dirty;

  return (
    <Card className="overflow-hidden p-0 shadow-sm">
      <div className="border-b border-zinc-200/90 bg-zinc-50/80 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-ink">Draft editor</h2>
              {sectionLocked ? (
                <span className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                  Locked
                </span>
              ) : null}
              {activeVersionProtected && !sectionLocked ? (
                <span className="rounded border border-zinc-300 bg-zinc-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                  Protected version
                </span>
              ) : null}
            </div>
            <EditorSaveState
              hasActiveVersion={hasActiveVersion}
              isDirty={dirty}
              activeOrdinal={activeVersionOrdinal}
              sectionLocked={sectionLocked}
              versionProtected={activeVersionProtected}
            />
          </div>
          <DraftStatusSelector
            value={status}
            onChange={onStatusChange}
            disabled={false}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-200/70 pt-3">
          <Button
            type="button"
            variant="secondary"
            disabled={sectionLocked || isEmpty}
            onClick={() => {
              const meta = deriveMeta(local, metadata);
              void Promise.resolve(onSaveNewVersion(local, meta));
            }}
          >
            Save new version
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={overwriteDisabled}
            onClick={() => void Promise.resolve(onOverwrite(local))}
          >
            Overwrite active
          </Button>
        </div>
      </div>

      <div className="bg-zinc-100/40 px-4 py-4">
        {isEmpty && !sectionLocked ? (
          <div className="mb-3 rounded-md border border-dashed border-zinc-300 bg-white/70 px-3 py-2 text-xs text-ink-muted">
            <span className="font-medium text-ink">No draft text yet.</span>{" "}
            Generate from the panel above or paste a starting point. Saves create
            versions you can revisit below.
          </div>
        ) : null}

        <div className="rounded-xl border border-zinc-200/95 bg-[#fafaf9] p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
          <Textarea
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            disabled={sectionLocked}
            rows={24}
            className="min-h-[32rem] resize-y border-0 bg-transparent px-4 py-4 font-serif text-[15px] leading-[1.68] text-ink shadow-none placeholder:text-ink-subtle focus:border-transparent focus:ring-0 focus-visible:ring-0"
            aria-label="Draft content"
          />
        </div>

        {sectionLocked ? (
          <p className="mt-3 text-xs text-ink-muted">
            Unlock the section from status above if you need to edit this volume
            again.
          </p>
        ) : null}
      </div>
    </Card>
  );
}

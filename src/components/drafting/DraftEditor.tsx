import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import type { DraftMetadata, DraftStatus } from "@/types";
import {
  countWords,
  estimatePagesFromWords,
} from "@/lib/drafting-utils";

type DraftEditorProps = {
  sectionId: string;
  content: string;
  metadata: DraftMetadata | null;
  status: DraftStatus;
  onSaveNewVersion: (content: string, metadata: DraftMetadata) => void;
  onOverwrite: (content: string) => void;
  onStatusChange: (status: DraftStatus) => void;
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
  };
}

export function DraftEditor({
  sectionId,
  content,
  metadata,
  status,
  onSaveNewVersion,
  onOverwrite,
  onStatusChange,
}: DraftEditorProps) {
  const [local, setLocal] = useState(content);

  useEffect(() => {
    setLocal(content);
  }, [content, sectionId]);

  const locked = status === "Locked";

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Draft workspace</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={locked}
            onClick={() => {
              const meta = deriveMeta(local, metadata);
              onSaveNewVersion(local, meta);
            }}
          >
            Save new version
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={locked || !metadata}
            onClick={() => onOverwrite(local)}
          >
            Overwrite active
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={locked}
            onClick={() => onStatusChange("Approved")}
          >
            Mark approved
          </Button>
        </div>
      </div>

      <Textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        disabled={locked}
        rows={22}
        className="min-h-[28rem] font-serif text-sm leading-relaxed text-ink"
        aria-label="Draft content"
      />

      {locked ? (
        <p className="text-xs text-ink-muted">Section is locked for editing.</p>
      ) : null}
    </Card>
  );
}

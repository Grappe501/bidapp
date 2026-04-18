import { Button } from "@/components/ui/Button";
import type { FileRecord } from "@/types";

type ExtractionRunPanelProps = {
  selectedFile: FileRecord | null;
  hasRun: boolean;
  candidateCount: number;
  onRun: () => void;
};

export function ExtractionRunPanel({
  selectedFile,
  hasRun,
  candidateCount,
  onRun,
}: ExtractionRunPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-ink">Extraction run</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        This console simulates a bounded extraction job. When you run extraction,
        the application loads <span className="font-medium text-ink">review-ready candidates</span>{" "}
        for the selected file—no live model calls. Your team reviews, edits, and
        approves each obligation before it enters the compliance matrix.
      </p>
      {selectedFile ? (
        <div className="mt-4 rounded-md border border-border bg-zinc-50/60 px-4 py-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Selected
          </p>
          <p className="mt-1 font-medium text-ink">{selectedFile.name}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {selectedFile.category} · {selectedFile.fileType.toUpperCase()}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">
          Select a source file to enable extraction.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={!selectedFile}
          onClick={onRun}
        >
          Run extraction
        </Button>
        {hasRun ? (
          <span className="text-sm text-ink-muted">
            {candidateCount} candidate{candidateCount === 1 ? "" : "s"} in review
            queue
          </span>
        ) : (
          <span className="text-sm text-ink-muted">
            Candidates appear only after a run.
          </span>
        )}
      </div>
    </div>
  );
}

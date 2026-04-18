import { Badge } from "@/components/ui/Badge";
import { sortFilesForExtractionPicker } from "@/lib/requirement-utils";
import type { FileRecord } from "@/types";
import { cn } from "@/lib/utils";

type ExtractionSourcePickerProps = {
  files: FileRecord[];
  selectedFileId: string | null;
  onSelect: (fileId: string) => void;
};

export function ExtractionSourcePicker({
  files,
  selectedFileId,
  onSelect,
}: ExtractionSourcePickerProps) {
  const ordered = sortFilesForExtractionPicker(files);

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-ink">Source document</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Solicitation and compliance files are listed first. Extraction is mock
        only—candidates are loaded from seeded data for eligible records.
      </p>
      <ul className="mt-4 max-h-64 space-y-1 overflow-y-auto pr-1">
        {ordered.map((f) => {
          const active = f.id === selectedFileId;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => onSelect(f.id)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  active
                    ? "bg-zinc-100 font-medium text-ink"
                    : "text-ink-muted hover:bg-zinc-50 hover:text-ink",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <Badge variant="muted" className="shrink-0 text-[10px]">
                  {f.category}
                </Badge>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

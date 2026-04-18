import { useCallback, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import type { UploadFileInput } from "@/context/workspace-context";
import {
  FILE_CATEGORIES,
  FILE_SOURCE_TYPES,
  type FileCategory,
  type FileSourceType,
} from "@/types";

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

type FileUploadPanelProps = {
  onUpload: (inputs: UploadFileInput[]) => void;
};

export function FileUploadPanel({ onUpload }: FileUploadPanelProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [category, setCategory] = useState<FileCategory>("Other");
  const [sourceType, setSourceType] = useState<FileSourceType>("Internal");
  const [tagsRaw, setTagsRaw] = useState("");

  const ingestFileList = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const tags = parseTags(tagsRaw);
      const inputs: UploadFileInput[] = Array.from(list).map((file) => ({
        file,
        category,
        sourceType,
        tags,
      }));
      onUpload(inputs);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [category, onUpload, sourceType, tagsRaw],
  );

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">Ingest documents</h2>
          <p className="mt-1 max-w-xl text-sm text-ink-muted">
            Uploads are stored in workspace memory for this session. Defaults:
            status <span className="font-medium text-ink">Uploaded</span>,
            refine category and source before adding files.
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[280px]">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">
              Category
            </span>
            <Select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as FileCategory)
              }
              aria-label="Default category for upload"
            >
              {FILE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">
              Source type
            </span>
            <Select
              value={sourceType}
              onChange={(e) =>
                setSourceType(e.target.value as FileSourceType)
              }
              aria-label="Default source type for upload"
            >
              {FILE_SOURCE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </label>
          <label className="col-span-full block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">
              Tags (comma-separated)
            </span>
            <Input
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              placeholder="e.g. amendment, pricing"
              aria-label="Tags for uploaded files"
            />
          </label>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-8 text-center transition-colors",
          isDragging
            ? "border-zinc-500 bg-zinc-100/80"
            : "border-border bg-zinc-50/60 hover:bg-zinc-50",
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          ingestFileList(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-labelledby={`${inputId}-label`}
      >
        <p id={`${inputId}-label`} className="text-sm font-medium text-ink">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          Multiple files use the same category, source, and tags above.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => ingestFileList(e.target.files)}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Browse files
        </Button>
      </div>
    </div>
  );
}

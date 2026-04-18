import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  FILE_CATEGORIES,
  FILE_PROCESSING_STATUSES,
  FILE_SOURCE_TYPES,
  type FileCategory,
  type FileProcessingStatus,
  type FileSourceType,
} from "@/types";

export type FileLibraryFilters = {
  category: FileCategory | "all";
  sourceType: FileSourceType | "all";
  status: FileProcessingStatus | "all";
  search: string;
};

type FileFilterBarProps = {
  value: FileLibraryFilters;
  onChange: (next: FileLibraryFilters) => void;
};

export function FileFilterBar({ value, onChange }: FileFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
      <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Search</span>
          <Input
            placeholder="File name…"
            value={value.search}
            onChange={(e) =>
              onChange({ ...value, search: e.target.value })
            }
            aria-label="Search files by name"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Category</span>
          <Select
            value={value.category}
            onChange={(e) =>
              onChange({
                ...value,
                category: e.target.value as FileCategory | "all",
              })
            }
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
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
            value={value.sourceType}
            onChange={(e) =>
              onChange({
                ...value,
                sourceType: e.target.value as FileSourceType | "all",
              })
            }
            aria-label="Filter by source type"
          >
            <option value="all">All sources</option>
            {FILE_SOURCE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Status</span>
          <Select
            value={value.status}
            onChange={(e) =>
              onChange({
                ...value,
                status: e.target.value as FileProcessingStatus | "all",
              })
            }
            aria-label="Filter by processing status"
          >
            <option value="all">All statuses</option>
            {FILE_PROCESSING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
      </div>
    </div>
  );
}

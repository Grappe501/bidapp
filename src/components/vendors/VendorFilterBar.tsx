import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { VendorDirectoryFilters } from "@/lib/vendor-utils";
import {
  VENDOR_CATEGORIES,
  VENDOR_FIT_SCORES,
  VENDOR_STATUSES,
  type VendorCategory,
  type VendorFitScore,
  type VendorStatus,
} from "@/types";

type VendorFilterBarProps = {
  value: VendorDirectoryFilters;
  onChange: (next: VendorDirectoryFilters) => void;
};

export function VendorFilterBar({ value, onChange }: VendorFilterBarProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <label className="block space-y-1.5 lg:col-span-2">
        <span className="text-xs font-medium text-ink-muted">Search</span>
        <Input
          placeholder="Vendor name, summary, notes…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Category</span>
        <Select
          value={value.category}
          onChange={(e) =>
            onChange({
              ...value,
              category: e.target.value as VendorCategory | "all",
            })
          }
        >
          <option value="all">All categories</option>
          {VENDOR_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
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
              status: e.target.value as VendorStatus | "all",
            })
          }
        >
          <option value="all">All statuses</option>
          {VENDOR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Min fit score</span>
        <Select
          value={value.minFitScore === "all" ? "all" : String(value.minFitScore)}
          onChange={(e) =>
            onChange({
              ...value,
              minFitScore:
                e.target.value === "all"
                  ? "all"
                  : (Number(e.target.value) as VendorFitScore),
            })
          }
        >
          <option value="all">Any</option>
          {VENDOR_FIT_SCORES.map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { MatrixFilters } from "@/lib/requirement-utils";
import {
  REQUIREMENT_RISK_LEVELS,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TAG_TYPES,
  REQUIREMENT_TYPES,
  type RequirementRiskLevel,
  type RequirementStatus,
  type RequirementTagType,
  type RequirementType,
} from "@/types";

type RequirementMatrixFilterBarProps = {
  value: MatrixFilters;
  onChange: (next: MatrixFilters) => void;
};

export function RequirementMatrixFilterBar({
  value,
  onChange,
}: RequirementMatrixFilterBarProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
      <label className="block space-y-1.5 lg:col-span-2">
        <span className="text-xs font-medium text-ink-muted">Search</span>
        <Input
          placeholder="Title, summary, source…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          aria-label="Search requirements"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Status</span>
        <Select
          value={value.status}
          onChange={(e) =>
            onChange({
              ...value,
              status: e.target.value as RequirementStatus | "all",
            })
          }
        >
          <option value="all">All statuses</option>
          {REQUIREMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Type</span>
        <Select
          value={value.type}
          onChange={(e) =>
            onChange({
              ...value,
              type: e.target.value as RequirementType | "all",
            })
          }
        >
          <option value="all">All types</option>
          {REQUIREMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Risk</span>
        <Select
          value={value.risk}
          onChange={(e) =>
            onChange({
              ...value,
              risk: e.target.value as RequirementRiskLevel | "all",
            })
          }
        >
          <option value="all">All risks</option>
          {REQUIREMENT_RISK_LEVELS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Ops tag</span>
        <Select
          value={value.tag}
          onChange={(e) =>
            onChange({
              ...value,
              tag: e.target.value as RequirementTagType | "all",
            })
          }
        >
          <option value="all">All tags</option>
          {REQUIREMENT_TAG_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex cursor-pointer items-end gap-2 pb-2">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border"
          checked={value.mandatoryOnly}
          onChange={(e) =>
            onChange({ ...value, mandatoryOnly: e.target.checked })
          }
        />
        <span className="text-sm text-ink">Mandatory only</span>
      </label>
    </div>
  );
}

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ReviewFilters } from "@/lib/review-utils";
import {
  REVIEW_ISSUE_TYPES,
  REVIEW_SEVERITIES,
  REVIEW_ISSUE_STATUSES,
} from "@/types";

const ENTITY_TYPES = [
  "all",
  "requirement",
  "submission_item",
  "draft_section",
  "vendor",
  "architecture_option",
  "discussion_item",
  "contract_risk",
  "project",
] as const;

type ReviewFilterBarProps = {
  filters: ReviewFilters;
  onChange: (patch: Partial<ReviewFilters>) => void;
};

export function ReviewFilterBar({ filters, onChange }: ReviewFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="block min-w-[8rem] flex-1 space-y-1">
        <span className="text-xs text-ink-muted">Severity</span>
        <Select
          value={filters.severity}
          onChange={(e) =>
            onChange({
              severity: e.target.value as ReviewFilters["severity"],
            })
          }
        >
          <option value="all">All</option>
          {REVIEW_SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>
      <label className="block min-w-[10rem] flex-1 space-y-1">
        <span className="text-xs text-ink-muted">Issue type</span>
        <Select
          value={filters.issueType}
          onChange={(e) => onChange({ issueType: e.target.value })}
        >
          <option value="all">All</option>
          {REVIEW_ISSUE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </label>
      <label className="block min-w-[8rem] flex-1 space-y-1">
        <span className="text-xs text-ink-muted">Status</span>
        <Select
          value={filters.status}
          onChange={(e) =>
            onChange({
              status: e.target.value as ReviewFilters["status"],
            })
          }
        >
          <option value="all">All</option>
          {REVIEW_ISSUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>
      <label className="block min-w-[8rem] flex-1 space-y-1">
        <span className="text-xs text-ink-muted">Entity</span>
        <Select
          value={filters.entityType}
          onChange={(e) => onChange({ entityType: e.target.value })}
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </label>
      <label className="block min-w-[12rem] flex-[2] space-y-1">
        <span className="text-xs text-ink-muted">Search</span>
        <Input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Title, description, fix…"
        />
      </label>
    </div>
  );
}

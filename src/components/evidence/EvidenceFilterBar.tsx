import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { EvidenceExplorerFilters } from "@/lib/evidence-utils";
import {
  EVIDENCE_TYPES,
  EVIDENCE_VALIDATION_STATUSES,
  type EvidenceType,
  type EvidenceValidationStatus,
} from "@/types";

type EvidenceFilterBarProps = {
  value: EvidenceExplorerFilters;
  onChange: (next: EvidenceExplorerFilters) => void;
  sourceFileOptions: { id: string; name: string }[];
};

export function EvidenceFilterBar({
  value,
  onChange,
  sourceFileOptions,
}: EvidenceFilterBarProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <label className="block space-y-1.5 lg:col-span-2">
        <span className="text-xs font-medium text-ink-muted">Search</span>
        <Input
          placeholder="Title, excerpt, section…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Evidence type</span>
        <Select
          value={value.evidenceType}
          onChange={(e) =>
            onChange({
              ...value,
              evidenceType: e.target.value as EvidenceType | "all",
            })
          }
        >
          <option value="all">All types</option>
          {EVIDENCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Validation</span>
        <Select
          value={value.validationStatus}
          onChange={(e) =>
            onChange({
              ...value,
              validationStatus: e.target.value as
                | EvidenceValidationStatus
                | "all",
            })
          }
        >
          <option value="all">All</option>
          {EVIDENCE_VALIDATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Source file</span>
        <Select
          value={value.sourceFileId}
          onChange={(e) =>
            onChange({ ...value, sourceFileId: e.target.value })
          }
        >
          <option value="all">All files</option>
          {sourceFileOptions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-ink-muted">Link status</span>
        <Select
          value={value.linkStatus}
          onChange={(e) =>
            onChange({
              ...value,
              linkStatus: e.target.value as EvidenceExplorerFilters["linkStatus"],
            })
          }
        >
          <option value="all">All items</option>
          <option value="linked">Linked to a requirement</option>
          <option value="unlinked">Not linked</option>
        </Select>
      </label>
    </div>
  );
}

import { Select } from "@/components/ui/Select";
import { DRAFT_STATUSES, type DraftStatus } from "@/types";

const STATUS_HINTS: Record<DraftStatus, string> = {
  "Not Started": "No saved version yet — generate or save to begin history.",
  Drafting: "Active drafting — content may change frequently.",
  "Needs Review": "Ready for editorial or compliance review before approval.",
  Approved: "Accepted for this volume — lock when final.",
  Locked: "Frozen in this workspace — switch status to unlock if policy allows.",
};

type DraftStatusSelectorProps = {
  value: DraftStatus;
  onChange: (status: DraftStatus) => void;
  disabled?: boolean;
};

export function DraftStatusSelector({
  value,
  onChange,
  disabled,
}: DraftStatusSelectorProps) {
  return (
    <div className="min-w-[11rem] space-y-1">
      <label className="text-xs font-medium text-ink" htmlFor="draft-section-status">
        Draft status
      </label>
      <Select
        id="draft-section-status"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as DraftStatus)}
        aria-label="Draft status"
      >
        {DRAFT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <p className="text-[11px] leading-snug text-ink-subtle">{STATUS_HINTS[value]}</p>
    </div>
  );
}

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type {
  Requirement,
  RequirementResponseCategory,
  RequirementRiskLevel,
  RequirementStatus,
  RequirementType,
} from "@/types";
import type { RequirementTagType } from "@/types";
import {
  REQUIREMENT_RESPONSE_CATEGORIES,
  REQUIREMENT_RISK_LEVELS,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TAG_TYPES,
  REQUIREMENT_TYPES,
} from "@/types";

export type RequirementEditFormProps = {
  value: Requirement;
  onSave: (patch: Partial<Requirement>) => void;
};

export function RequirementEditForm({
  value,
  onSave,
}: RequirementEditFormProps) {
  return (
    <form
      key={value.updatedAt}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const tags = REQUIREMENT_TAG_TYPES.filter(
          (t) => fd.get(`tag-${t}`) === "on",
        ) as RequirementTagType[];
        onSave({
          title: String(fd.get("title") ?? ""),
          summary: String(fd.get("summary") ?? ""),
          status: String(fd.get("status")) as RequirementStatus,
          riskLevel: String(fd.get("riskLevel")) as RequirementRiskLevel,
          mandatory: fd.get("mandatory") === "true",
          responseCategory: String(
            fd.get("responseCategory"),
          ) as RequirementResponseCategory,
          requirementType: String(
            fd.get("requirementType"),
          ) as RequirementType,
          owner: String(fd.get("owner") ?? ""),
          notes: String(fd.get("notes") ?? ""),
          tags,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">Title</span>
          <Input name="title" required defaultValue={value.title} />
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">Summary</span>
          <Textarea name="summary" rows={4} defaultValue={value.summary} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Type</span>
          <Select
            name="requirementType"
            defaultValue={value.requirementType}
          >
            {REQUIREMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Status</span>
          <Select name="status" defaultValue={value.status}>
            {REQUIREMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Risk</span>
          <Select name="riskLevel" defaultValue={value.riskLevel}>
            {REQUIREMENT_RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Mandatory</span>
          <Select
            name="mandatory"
            defaultValue={value.mandatory ? "true" : "false"}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </Select>
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">
            Response category
          </span>
          <Select
            name="responseCategory"
            defaultValue={value.responseCategory}
          >
            {REQUIREMENT_RESPONSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </label>
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-xs font-medium text-ink-muted">
            Operational tags (RFP)
          </legend>
          <div className="flex flex-wrap gap-3">
            {REQUIREMENT_TAG_TYPES.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name={`tag-${t}`}
                  defaultChecked={value.tags.includes(t)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm text-ink">{t}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">Owner</span>
          <Input name="owner" defaultValue={value.owner} />
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">Notes</span>
          <Textarea name="notes" rows={3} defaultValue={value.notes} />
        </label>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  );
}

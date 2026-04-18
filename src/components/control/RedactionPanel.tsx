import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { RedactionFlagBadge } from "@/components/control/RedactionFlagBadge";
import type { RedactionFlag, RedactionFlagStatus } from "@/types";
import {
  REDACTION_ENTITY_TYPES,
  REDACTION_FLAG_STATUSES,
} from "@/types";

type RedactionPanelProps = {
  flags: RedactionFlag[];
  onUpdate: (id: string, patch: Partial<RedactionFlag>) => void;
  onAdd: (draft: Omit<RedactionFlag, "id">) => void;
};

export function RedactionPanel({ flags, onUpdate, onAdd }: RedactionPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">Log a redaction / FOIA flag</h3>
        <p className="text-xs text-ink-muted">
          Session-only tracking. Tie each flag to a workspace entity for audit
          prep—no external calls.
        </p>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onAdd({
              entityType: String(fd.get("entityType")) as RedactionFlag["entityType"],
              entityId: String(fd.get("entityId") ?? "").trim() || "unknown",
              entityLabel: String(fd.get("entityLabel") ?? "").trim() || "Untitled",
              reason: String(fd.get("reason") ?? "").trim(),
              status: "Open",
            });
            e.currentTarget.reset();
          }}
        >
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Entity type</span>
            <Select name="entityType" required defaultValue="File">
              {REDACTION_ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Entity ID</span>
            <Input name="entityId" placeholder="file-001" required />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-ink-muted">Label</span>
            <Input name="entityLabel" placeholder="Human-readable name" required />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-ink-muted">Reason</span>
            <Textarea name="reason" rows={2} required />
          </label>
          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" variant="secondary">
              Add flag
            </Button>
          </div>
        </form>
      </Card>

      <ul className="space-y-3">
        {flags.map((f) => (
          <li key={f.id}>
            <Card className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{f.entityLabel}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {f.entityType} · {f.entityId}
                  </p>
                </div>
                <RedactionFlagBadge status={f.status} />
              </div>
              <p className="text-sm text-ink-muted">{f.reason}</p>
              <label className="block max-w-xs space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">Status</span>
                <Select
                  value={f.status}
                  onChange={(e) =>
                    onUpdate(f.id, {
                      status: e.target.value as RedactionFlagStatus,
                    })
                  }
                >
                  {REDACTION_FLAG_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </label>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

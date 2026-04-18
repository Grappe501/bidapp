import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { WinTheme, WinThemeStatus } from "@/types";

const STATUSES: WinThemeStatus[] = ["Draft", "Active", "Approved", "Retired"];

const SECTION_PRESETS = [
  "Experience",
  "Solution",
  "Risk",
  "Architecture Narrative",
  "Executive Summary",
  "Interview Prep",
  "Discussion documents",
];

export function WinThemeEditor({
  theme,
  onSave,
}: {
  theme: WinTheme | null;
  onSave: (patch: Partial<WinTheme>) => void;
}) {
  if (!theme) {
    return (
      <Card className="p-6 text-sm text-ink-muted">
        Select a win theme to edit.
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink">Edit theme</h3>
      <div className="mt-4 space-y-3">
        <label className="block text-xs">
          <span className="text-ink-subtle">Title</span>
          <input
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
            defaultValue={theme.title}
            key={`title-${theme.id}`}
            onBlur={(e) => onSave({ title: e.target.value })}
          />
        </label>
        <label className="block text-xs">
          <span className="text-ink-subtle">Summary</span>
          <textarea
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
            rows={3}
            defaultValue={theme.summary}
            key={`sum-${theme.id}`}
            onBlur={(e) => onSave({ summary: e.target.value })}
          />
        </label>
        <label className="block text-xs">
          <span className="text-ink-subtle">Supporting points (one per line)</span>
          <textarea
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
            rows={4}
            defaultValue={theme.supportingPoints.join("\n")}
            key={`pts-${theme.id}`}
            onBlur={(e) =>
              onSave({
                supportingPoints: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
        <fieldset className="text-xs">
          <legend className="text-ink-subtle">Target sections</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SECTION_PRESETS.map((s) => {
              const on = theme.targetSections.includes(s);
              return (
                <Button
                  key={s}
                  type="button"
                  variant={on ? "primary" : "secondary"}
                  className="text-xs"
                  onClick={() => {
                    const next = on
                      ? theme.targetSections.filter((x) => x !== s)
                      : [...theme.targetSections, s];
                    onSave({ targetSections: next });
                  }}
                >
                  {s}
                </Button>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs">
            <span className="text-ink-subtle">Priority (lower = higher)</span>
            <input
              type="number"
              min={1}
              max={9}
              className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
              defaultValue={theme.priority}
              key={`pri-${theme.id}`}
              onBlur={(e) =>
                onSave({ priority: Math.max(1, Number(e.target.value) || 1) })
              }
            />
          </label>
          <label className="text-xs">
            <span className="text-ink-subtle">Status</span>
            <select
              className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
              value={theme.status}
              onChange={(e) => onSave({ status: e.target.value as WinThemeStatus })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </Card>
  );
}

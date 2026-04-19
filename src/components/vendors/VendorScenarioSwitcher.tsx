import { useMemo } from "react";
import { Select } from "@/components/ui/Select";
import type { ArchitectureOption } from "@/types";

type VendorScenarioSwitcherProps = {
  options: ArchitectureOption[];
  architectureOptionId: string | null;
  onArchitectureOptionChange: (id: string | null) => void;
};

/**
 * Re-run comparison with an architecture option to bias vendor stack context.
 */
export function VendorScenarioSwitcher({
  options,
  architectureOptionId,
  onArchitectureOptionChange,
}: VendorScenarioSwitcherProps) {
  const sorted = useMemo(
    () => [...options].sort((a, b) => a.name.localeCompare(b.name)),
    [options],
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-slate-50/60 p-3">
      <div className="min-w-[200px] flex-1 space-y-1">
        <label className="text-xs font-medium text-ink-muted" htmlFor="arch-scenario">
          Architecture scenario (optional)
        </label>
        <Select
          id="arch-scenario"
          value={architectureOptionId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onArchitectureOptionChange(v ? v : null);
          }}
        >
          <option value="">All vendors (no option filter)</option>
          {sorted.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
              {o.recommended ? " (recommended)" : ""}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-[10px] text-ink-muted">
        When set, vendors in that option get a small boost and integration context is
        scoped.
      </p>
    </div>
  );
}

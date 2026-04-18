import { ArchitectureRoleSelector } from "@/components/architecture/ArchitectureRoleSelector";
import { Badge } from "@/components/ui/Badge";
import { formatArchitectureComponentRoleLabel } from "@/lib/display-format";
import type { ArchitectureComponent } from "@/types";

type ArchitectureComponentListProps = {
  components: ArchitectureComponent[];
  onRoleChange?: (
    componentId: string,
    role: ArchitectureComponent["role"],
  ) => void;
  editable?: boolean;
};

export function ArchitectureComponentList({
  components,
  onRoleChange,
  editable,
}: ArchitectureComponentListProps) {
  if (components.length === 0) {
    return (
      <p className="text-sm text-ink-muted">No components defined.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {components.map((c) => (
        <li
          key={c.id}
          className="rounded-lg border border-border bg-zinc-50/50 px-4 py-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{c.vendorName}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {c.responsibilitySummary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {c.optional ? (
                <Badge variant="muted">Optional</Badge>
              ) : (
                <Badge variant="emphasis">Core</Badge>
              )}
            </div>
          </div>
          {editable && onRoleChange ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="text-xs text-ink-subtle">Role</span>
              <ArchitectureRoleSelector
                value={c.role}
                onChange={(role) => onRoleChange(c.id, role)}
                ariaLabel={`Role for ${c.vendorName}`}
              />
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Badge variant="neutral">
                {formatArchitectureComponentRoleLabel(c.role)}
              </Badge>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ArchitectureComponentList } from "@/components/architecture/ArchitectureComponentList";
import { ArchitectureNarrativeCard } from "@/components/architecture/ArchitectureNarrativeCard";
import { ArchitectureRiskCard } from "@/components/architecture/ArchitectureRiskCard";
import { MalonePositionCard } from "@/components/architecture/MalonePositionCard";
import { formatArchitectureOptionStatusLabel } from "@/lib/display-format";
import {
  ARCHITECTURE_OPTION_STATUSES,
  type ArchitectureOption,
  type ArchitectureOptionStatus,
} from "@/types";

type ArchitectureOptionDetailProps = {
  option: ArchitectureOption;
  onSetRecommended: () => void;
  onStatusChange: (status: ArchitectureOptionStatus) => void;
  onNotesSave: (notes: string) => void;
  onMaloneSave: (summary: string) => void;
  onComponentRoleChange: (
    componentId: string,
    role: ArchitectureOption["components"][0]["role"],
  ) => void;
};

export function ArchitectureOptionDetail({
  option,
  onSetRecommended,
  onStatusChange,
  onNotesSave,
  onMaloneSave,
  onComponentRoleChange,
}: ArchitectureOptionDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {option.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            {option.summary}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {option.recommended ? (
            <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">
              Recommended option
            </span>
          ) : (
            <Button type="button" variant="secondary" onClick={onSetRecommended}>
              Mark as recommended
            </Button>
          )}
        </div>
      </div>

      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">Option status</h3>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            className="max-w-xs"
            value={option.status}
            onChange={(e) =>
              onStatusChange(e.target.value as ArchitectureOptionStatus)
            }
            aria-label="Architecture option status"
          >
            {ARCHITECTURE_OPTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatArchitectureOptionStatusLabel(s)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-sm font-semibold text-ink">Stack components</h3>
        <ArchitectureComponentList
          components={option.components}
          editable
          onRoleChange={onComponentRoleChange}
        />
      </Card>

      <MalonePositionCard
        summary={option.malonePositionSummary}
        editable
        onSave={onMaloneSave}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ArchitectureNarrativeCard items={option.narrativeStrengths} />
        <ArchitectureRiskCard risks={option.implementationRisks} />
      </div>

      <Card className="space-y-3">
        <h3 className="text-sm font-semibold text-ink">Notes</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onNotesSave(String(fd.get("notes") ?? ""));
          }}
        >
          <Textarea name="notes" rows={4} defaultValue={option.notes} />
          <div className="mt-2 flex justify-end">
            <Button type="submit" variant="secondary">
              Save notes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

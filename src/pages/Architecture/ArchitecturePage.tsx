import { useEffect, useMemo, useState } from "react";
import { ArchitectureCompetitorStrip } from "@/components/architecture/ArchitectureCompetitorStrip";
import { ArchitectureRoleOwnershipStrip } from "@/components/architecture/ArchitectureRoleOwnershipStrip";
import { ArchitectureOptionCard } from "@/components/architecture/ArchitectureOptionCard";
import { ArchitectureOptionDetail } from "@/components/architecture/ArchitectureOptionDetail";
import { useArchitecture } from "@/context/useArchitecture";
import { useProjectWorkspace } from "@/context/project-workspace-context";
import { getRecommendedOption, sortArchitectureOptions } from "@/lib/architecture-utils";
import type { ArchitectureOptionStatus } from "@/types";

export function ArchitecturePage() {
  const { projectId } = useProjectWorkspace();
  const {
    options,
    updateOption,
    setRecommendedOption,
    setOptionStatus,
    updateComponent,
  } = useArchitecture();

  const sorted = useMemo(() => sortArchitectureOptions(options), [options]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (sorted.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => {
      if (prev && sorted.some((o) => o.id === prev)) return prev;
      return getRecommendedOption(sorted)?.id ?? sorted[0]?.id ?? null;
    });
  }, [sorted]);

  const selected = sorted.find((o) => o.id === selectedId) ?? null;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Architecture workspace
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-ink-muted">
            Stack strategy for the Arkansas DHS PBM response: compare options,
            assign vendor roles, and make Malone&apos;s orchestration story
            explicit before drafting.
          </p>
        </div>

        <ArchitectureCompetitorStrip options={sorted} />

        {projectId && selected ? (
          <ArchitectureRoleOwnershipStrip
            projectId={projectId}
            components={selected.components}
          />
        ) : null}

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Options
            </h2>
            <div className="space-y-2">
              {sorted.map((o) => (
                <ArchitectureOptionCard
                  key={o.id}
                  option={o}
                  selected={o.id === selectedId}
                  onSelect={() => setSelectedId(o.id)}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            {selected ? (
              <ArchitectureOptionDetail
                key={`${selected.id}-${selected.updatedAt}`}
                option={selected}
                onSetRecommended={() => setRecommendedOption(selected.id)}
                onStatusChange={(status: ArchitectureOptionStatus) =>
                  setOptionStatus(selected.id, status)
                }
                onNotesSave={(notes) => updateOption(selected.id, { notes })}
                onMaloneSave={(malonePositionSummary) =>
                  updateOption(selected.id, { malonePositionSummary })
                }
                onComponentRoleChange={(componentId, role) =>
                  updateComponent(selected.id, componentId, { role })
                }
              />
            ) : (
              <p className="text-sm text-ink-muted">No architecture options.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

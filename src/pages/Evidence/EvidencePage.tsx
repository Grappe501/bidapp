import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EvidenceExplorerTable } from "@/components/evidence/EvidenceExplorerTable";
import { EvidenceFilterBar } from "@/components/evidence/EvidenceFilterBar";
import { useEvidence } from "@/context/useEvidence";
import { useWorkspace } from "@/context/useWorkspace";
import {
  countLinkedRequirements,
  filterEvidenceItems,
  type EvidenceExplorerFilters,
} from "@/lib/evidence-utils";

const defaultFilters: EvidenceExplorerFilters = {
  evidenceType: "all",
  validationStatus: "all",
  sourceFileId: "all",
  linkStatus: "all",
  search: "",
};

export function EvidencePage() {
  const navigate = useNavigate();
  const { files } = useWorkspace();
  const { evidenceItems, links } = useEvidence();
  const [filters, setFilters] = useState<EvidenceExplorerFilters>(defaultFilters);

  const filtered = useMemo(
    () => filterEvidenceItems(evidenceItems, links, filters),
    [evidenceItems, links, filters],
  );

  const sourceFileOptions = useMemo(
    () => files.map((f) => ({ id: f.id, name: f.name })),
    [files],
  );

  const linkedCount = (evidenceId: string) =>
    countLinkedRequirements(links, evidenceId);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Evidence vault
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-ink-muted">
            Managed support passages tied to library files. Link evidence to
            requirements to show what the team can prove versus what still needs
            validation—retrieval and AI grounding follow in later packets.
          </p>
        </div>

        <EvidenceFilterBar
          value={filters}
          onChange={setFilters}
          sourceFileOptions={sourceFileOptions}
        />

        <EvidenceExplorerTable
          items={filtered}
          linkedRequirementCount={linkedCount}
          onOpen={(e) => navigate(`/evidence/${e.id}`)}
        />
      </div>
    </div>
  );
}

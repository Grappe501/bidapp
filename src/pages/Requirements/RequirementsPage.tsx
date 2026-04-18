import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ComplianceMatrixTable } from "@/components/requirements/ComplianceMatrixTable";
import { RequirementCoverageSummary } from "@/components/requirements/RequirementCoverageSummary";
import { RequirementMatrixFilterBar } from "@/components/requirements/RequirementMatrixFilterBar";
import { useEvidence } from "@/context/useEvidence";
import { useRequirements } from "@/context/useRequirements";
import { buildSupportLevelByRequirementId } from "@/lib/evidence-utils";
import {
  computeCoverageSummary,
  filterRequirements,
  type MatrixFilters,
} from "@/lib/requirement-utils";

const defaultFilters: MatrixFilters = {
  status: "all",
  type: "all",
  risk: "all",
  tag: "all",
  mandatoryOnly: false,
  search: "",
};

export function RequirementsPage() {
  const navigate = useNavigate();
  const { requirements } = useRequirements();
  const { links } = useEvidence();
  const [filters, setFilters] = useState<MatrixFilters>(defaultFilters);

  const filtered = useMemo(
    () => filterRequirements(requirements, filters),
    [requirements, filters],
  );

  const supportLevelByRequirementId = useMemo(
    () => buildSupportLevelByRequirementId(filtered, links),
    [filtered, links],
  );

  const summary = useMemo(
    () => computeCoverageSummary(requirements),
    [requirements],
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Compliance matrix
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Tracked obligations with evidence support indicators. Link passages
              in the evidence vault to strengthen defensibility before drafting.
            </p>
          </div>
          <Link to="/requirements/extract" className="shrink-0">
            <Button type="button">Extraction console</Button>
          </Link>
        </div>

        <RequirementCoverageSummary summary={summary} />

        <div className="space-y-4">
          <RequirementMatrixFilterBar value={filters} onChange={setFilters} />
          <ComplianceMatrixTable
            requirements={filtered}
            supportLevelByRequirementId={supportLevelByRequirementId}
            onOpen={(r) => navigate(`/requirements/${r.id}`)}
          />
        </div>
      </div>
    </div>
  );
}

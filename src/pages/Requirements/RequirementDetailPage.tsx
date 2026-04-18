import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EvidenceLinkPanel } from "@/components/evidence/EvidenceLinkPanel";
import { LinkedEvidenceList } from "@/components/evidence/LinkedEvidenceList";
import { RequirementSupportSummary } from "@/components/evidence/RequirementSupportSummary";
import { RequirementEditForm } from "@/components/requirements/RequirementEditForm";
import { RequirementMetadataCard } from "@/components/requirements/RequirementMetadataCard";
import { RequirementSourceCard } from "@/components/requirements/RequirementSourceCard";
import { useEvidence } from "@/context/useEvidence";
import { useRequirements } from "@/context/useRequirements";
import {
  computeRequirementSupportLevel,
  linksForRequirement,
} from "@/lib/evidence-utils";

export function RequirementDetailPage() {
  const { requirementId } = useParams<{ requirementId: string }>();
  const navigate = useNavigate();
  const { requirements, updateRequirement } = useRequirements();
  const {
    evidenceItems,
    links,
    linkEvidence,
    unlink,
    updateLink,
  } = useEvidence();
  const req = requirements.find((r) => r.id === requirementId);

  const reqLinks = useMemo(
    () => (requirementId ? linksForRequirement(links, requirementId) : []),
    [links, requirementId],
  );

  const evidenceById = useMemo(
    () => new Map(evidenceItems.map((e) => [e.id, e])),
    [evidenceItems],
  );

  const linkedEvidenceIds = useMemo(
    () => new Set(reqLinks.map((l) => l.evidenceId)),
    [reqLinks],
  );

  const supportLevel = useMemo(
    () => computeRequirementSupportLevel(reqLinks),
    [reqLinks],
  );

  if (!requirementId || !req) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-xl font-semibold text-ink">
            Requirement not found
          </h1>
          <p className="text-sm text-ink-muted">
            This identifier is not in the current matrix.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/requirements")}
          >
            Back to matrix
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/requirements")}
          >
            ← Compliance matrix
          </Button>
        </div>

        <RequirementSupportSummary level={supportLevel} variant="detail" />

        <RequirementMetadataCard req={req} />

        <RequirementSourceCard
          sourceFileId={req.sourceFileId}
          sourceFileName={req.sourceFileName}
          sourceSection={req.sourceSection}
          verbatimText={req.verbatimText}
        />

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">
            Interpretation & handling
          </h2>
          <p className="text-sm text-ink-muted">
            Summary and notes guide how the team treats this obligation during
            drafting and review. Source language stays fixed above; narrative
            evolves here.
          </p>
          <RequirementEditForm
            key={req.updatedAt}
            value={req}
            onSave={(patch) => updateRequirement(req.id, patch)}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">Evidence support</h2>
          <p className="text-sm text-ink-muted">
            Ground this requirement in vault passages. Set support strength to
            reflect how directly each passage backs the obligation.
          </p>
          <EvidenceLinkPanel
            evidenceItems={evidenceItems}
            linkedEvidenceIds={linkedEvidenceIds}
            onLink={(input) =>
              linkEvidence({
                requirementId: req.id,
                evidenceId: input.evidenceId,
                supportStrength: input.supportStrength,
                linkNote: input.linkNote,
              })
            }
          />
          <LinkedEvidenceList
            links={reqLinks}
            evidenceById={evidenceById}
            onUnlink={unlink}
            onStrengthChange={(linkId, strength) =>
              updateLink(linkId, { supportStrength: strength })
            }
            onOpenEvidence={(id) => navigate(`/evidence/${id}`)}
          />
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Draft sections</h2>
          <p className="text-sm text-ink-muted">
            Proposal sections that cite this requirement will appear here.
          </p>
          <div className="rounded-md border border-dashed border-border bg-zinc-50/50 px-4 py-6 text-center text-sm text-ink-muted">
            No linked draft sections yet.
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Review issues</h2>
          <p className="text-sm text-ink-muted">
            Red-team findings from the review center will map back to this
            record.
          </p>
          <div className="rounded-md border border-dashed border-border bg-zinc-50/50 px-4 py-6 text-center text-sm text-ink-muted">
            No open review issues.
          </div>
        </Card>
      </div>
    </div>
  );
}

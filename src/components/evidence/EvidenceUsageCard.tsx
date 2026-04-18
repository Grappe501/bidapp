import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EvidenceStrengthBadge } from "@/components/evidence/EvidenceStrengthBadge";
import { useNavigate } from "react-router-dom";
import type { RequirementEvidenceLink } from "@/types";

export type EvidenceUsageRow = {
  link: RequirementEvidenceLink;
  requirementTitle: string;
};

type EvidenceUsageCardProps = {
  rows: EvidenceUsageRow[];
};

export function EvidenceUsageCard({ rows }: EvidenceUsageCardProps) {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return (
      <Card className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Linked requirements</h2>
        <p className="text-sm text-ink-muted">
          This evidence is not yet tied to any requirement.
        </p>
        <div className="rounded-md border border-dashed border-border bg-zinc-50/50 px-4 py-6 text-center text-sm text-ink-muted">
          No requirement links.
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold text-ink">Linked requirements</h2>
      <p className="text-sm text-ink-muted">
        Where this passage supports a tracked obligation and the declared
        support strength.
      </p>
      <ul className="divide-y divide-border rounded-md border border-border">
        {rows.map(({ link, requirementTitle }) => (
          <li
            key={link.id}
            className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{requirementTitle}</p>
              {link.linkNote ? (
                <p className="mt-1 text-xs text-ink-muted">{link.linkNote}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <EvidenceStrengthBadge strength={link.supportStrength} />
              <Button
                type="button"
                variant="secondary"
                className="text-xs"
                onClick={() => navigate(`/requirements/${link.requirementId}`)}
              >
                Requirement
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

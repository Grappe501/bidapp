import { Button } from "@/components/ui/Button";
import { EvidenceTypeBadge } from "@/components/evidence/EvidenceTypeBadge";
import { Select } from "@/components/ui/Select";
import { formatEvidenceValidationLabel } from "@/lib/display-format";
import { Badge } from "@/components/ui/Badge";
import type {
  EvidenceItem,
  EvidenceSupportStrength,
  RequirementEvidenceLink,
} from "@/types";
import { EVIDENCE_SUPPORT_STRENGTHS } from "@/types";

type LinkedEvidenceListProps = {
  links: RequirementEvidenceLink[];
  evidenceById: Map<string, EvidenceItem>;
  onUnlink: (linkId: string) => void;
  onStrengthChange: (
    linkId: string,
    strength: EvidenceSupportStrength,
  ) => void;
  onOpenEvidence: (evidenceId: string) => void;
};

export function LinkedEvidenceList({
  links,
  evidenceById,
  onUnlink,
  onStrengthChange,
  onOpenEvidence,
}: LinkedEvidenceListProps) {
  if (links.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-zinc-50/50 px-4 py-6 text-center text-sm text-ink-muted">
        No linked evidence. Add passages from the vault to ground this
        obligation.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {links.map((link) => {
        const ev = evidenceById.get(link.evidenceId);
        if (!ev) return null;
        return (
          <li
            key={link.id}
            className="rounded-lg border border-border bg-surface-raised p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-medium leading-snug text-ink">{ev.title}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <EvidenceTypeBadge type={ev.evidenceType} />
                  <Badge variant="muted">
                    {formatEvidenceValidationLabel(ev.validationStatus)}
                  </Badge>
                </div>
                <p className="text-xs text-ink-muted line-clamp-2">
                  {ev.excerpt}
                </p>
                {link.linkNote ? (
                  <p className="text-xs text-ink-subtle">
                    Link note: {link.linkNote}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="whitespace-nowrap">Strength</span>
                  <Select
                    className="w-36 py-1.5 text-xs"
                    value={link.supportStrength}
                    onChange={(e) =>
                      onStrengthChange(
                        link.id,
                        e.target.value as EvidenceSupportStrength,
                      )
                    }
                    aria-label={`Support strength for ${ev.title}`}
                  >
                    {EVIDENCE_SUPPORT_STRENGTHS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => onOpenEvidence(ev.id)}
                >
                  Evidence detail
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs text-red-800 hover:bg-red-50"
                  onClick={() => onUnlink(link.id)}
                >
                  Unlink
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

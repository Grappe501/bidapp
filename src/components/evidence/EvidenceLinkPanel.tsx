import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { EvidenceItem, EvidenceSupportStrength } from "@/types";
import { EVIDENCE_SUPPORT_STRENGTHS } from "@/types";

type EvidenceLinkPanelProps = {
  evidenceItems: EvidenceItem[];
  linkedEvidenceIds: Set<string>;
  onLink: (input: {
    evidenceId: string;
    supportStrength: EvidenceSupportStrength;
    linkNote: string;
  }) => void;
};

export function EvidenceLinkPanel({
  evidenceItems,
  linkedEvidenceIds,
  onLink,
}: EvidenceLinkPanelProps) {
  const [evidenceId, setEvidenceId] = useState("");
  const [strength, setStrength] = useState<EvidenceSupportStrength>("Moderate");
  const [note, setNote] = useState("");

  const available = evidenceItems.filter((e) => !linkedEvidenceIds.has(e.id));

  const submit = () => {
    if (!evidenceId) return;
    onLink({
      evidenceId,
      supportStrength: strength,
      linkNote: note.trim(),
    });
    setEvidenceId("");
    setNote("");
    setStrength("Moderate");
  };

  return (
    <div className="rounded-lg border border-border bg-zinc-50/50 p-4">
      <h3 className="text-sm font-semibold text-ink">Link evidence</h3>
      <p className="mt-1 text-xs text-ink-muted">
        Choose a vault passage and declare how strongly it supports this
        requirement.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">Evidence</span>
          <Select
            value={evidenceId}
            onChange={(e) => setEvidenceId(e.target.value)}
            aria-label="Evidence item to link"
          >
            <option value="">Select evidence…</option>
            {available.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">
            Support strength
          </span>
          <Select
            value={strength}
            onChange={(e) =>
              setStrength(e.target.value as EvidenceSupportStrength)
            }
          >
            {EVIDENCE_SUPPORT_STRENGTHS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">
            Link note (optional)
          </span>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Primary cite for pricing format"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          disabled={!evidenceId || available.length === 0}
          onClick={submit}
        >
          Add link
        </Button>
      </div>
      {available.length === 0 ? (
        <p className="mt-2 text-xs text-ink-muted">
          All evidence items are already linked, or the vault is empty.
        </p>
      ) : null}
    </div>
  );
}

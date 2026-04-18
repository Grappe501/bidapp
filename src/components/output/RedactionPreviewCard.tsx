import { Card } from "@/components/ui/Card";
import type { RedactionFlag } from "@/types";
import { OutputStatusBadge } from "./OutputStatusBadge";
import type { OutputStatus } from "@/types";

function flagToOutputStatus(s: RedactionFlag["status"]): OutputStatus {
  if (s === "Cleared") return "Validated";
  if (s === "Under Review") return "In Progress";
  return "Draft";
}

export function RedactionPreviewCard({ flag }: { flag: RedactionFlag }) {
  const needsRedactedVersion = flag.status !== "Cleared";
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-ink-subtle">{flag.entityType}</p>
          <h3 className="mt-0.5 text-sm font-medium text-ink">{flag.entityLabel}</h3>
        </div>
        <OutputStatusBadge status={flagToOutputStatus(flag.status)} />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-muted">{flag.reason}</p>
      <div className="mt-4 space-y-2 rounded-md bg-zinc-50 px-3 py-2 text-xs text-ink-muted">
        <p>
          <span className="font-medium text-ink">Redacted version needed:</span>{" "}
          {needsRedactedVersion ? "Yes — confirm legal/business judgment." : "Cleared."}
        </p>
        <p>
          Placeholder: map this flag to the public packet appendix; do not rely on
          automated text redaction in this release.
        </p>
      </div>
    </Card>
  );
}

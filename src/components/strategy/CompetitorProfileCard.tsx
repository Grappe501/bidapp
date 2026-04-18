import { Card } from "@/components/ui/Card";
import { evidenceCharacterLabel } from "@/lib/strategy-utils";
import type { CompetitorProfile } from "@/types";
import { ThreatLevelBadge } from "./ThreatLevelBadge";

export function CompetitorProfileCard({ c }: { c: CompetitorProfile }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-ink">{c.name}</h2>
          <p className="mt-1 text-xs text-ink-muted">
            {c.competitorType}
            {c.incumbent ? " · Incumbent" : ""}
          </p>
        </div>
        <ThreatLevelBadge level={c.threatLevel} />
      </div>
      <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-ink-subtle">Likely status</dt>
          <dd className="font-medium text-ink">{c.likelyStatus}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Evidence basis</dt>
          <dd className="text-ink-muted">{evidenceCharacterLabel(c.evidenceCharacter)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">{c.summary}</p>
    </Card>
  );
}

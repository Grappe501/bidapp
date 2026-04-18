import { Card } from "@/components/ui/Card";
import type { CompetitorProfile } from "@/types";
import { ThreatLevelBadge } from "./ThreatLevelBadge";

export function ThreatMapCard({ threats }: { threats: CompetitorProfile[] }) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-ink">Threat map</h3>
      <p className="mt-1 text-xs text-ink-muted">
        Why they matter to S000000479 — not rumor, structured judgment.
      </p>
      <ul className="mt-4 space-y-4">
        {threats.map((c) => (
          <li key={c.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink">{c.name}</span>
              <ThreatLevelBadge level={c.threatLevel} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              {c.threatInterpretation}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

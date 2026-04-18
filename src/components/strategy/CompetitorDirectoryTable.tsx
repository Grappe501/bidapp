import { Link } from "react-router-dom";
import { evidenceCharacterLabel } from "@/lib/strategy-utils";
import type { CompetitorProfile } from "@/types";
import { ThreatLevelBadge } from "./ThreatLevelBadge";

export function CompetitorDirectoryTable({
  competitors,
}: {
  competitors: CompetitorProfile[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-zinc-50/80">
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Competitor
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Status
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Type
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Inc.
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Threat
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Evidence
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Summary
            </th>
          </tr>
        </thead>
        <tbody>
          {competitors.map((c) => (
            <tr key={c.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2.5">
                <Link
                  to={`/strategy/competitors/${encodeURIComponent(c.id)}`}
                  className="font-medium text-ink underline-offset-2 hover:underline"
                >
                  {c.name}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-xs text-ink-muted">{c.likelyStatus}</td>
              <td className="max-w-[140px] px-3 py-2.5 text-xs text-ink-muted">
                {c.competitorType}
              </td>
              <td className="px-3 py-2.5 text-xs">{c.incumbent ? "Y" : "—"}</td>
              <td className="px-3 py-2.5">
                <ThreatLevelBadge level={c.threatLevel} />
              </td>
              <td className="px-3 py-2.5 text-xs text-ink-muted">
                {evidenceCharacterLabel(c.evidenceCharacter)}
              </td>
              <td className="max-w-md px-3 py-2.5 text-xs text-ink-muted">
                {c.summary.slice(0, 160)}
                {c.summary.length > 160 ? "…" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

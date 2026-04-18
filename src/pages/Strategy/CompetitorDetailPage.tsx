import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { CompetitorProfileCard } from "@/components/strategy/CompetitorProfileCard";
import { CompetitorStrengthList } from "@/components/strategy/CompetitorStrengthList";
import { CompetitorWeaknessList } from "@/components/strategy/CompetitorWeaknessList";
import { PositioningAngleCard } from "@/components/strategy/PositioningAngleCard";
import { StrategySubNav } from "@/components/strategy/StrategySubNav";
import { Card } from "@/components/ui/Card";
import { useStrategy } from "@/context/useStrategy";
import { evidenceCharacterLabel } from "@/lib/strategy-utils";
import type { CompetitorLikelyStatus, CompetitorType, EvidenceCharacter, ThreatLevel } from "@/types";
import { COMPETITOR_LIKELY_STATUSES, COMPETITOR_TYPES, EVIDENCE_CHARACTERS, THREAT_LEVELS } from "@/types";

export function CompetitorDetailPage() {
  const { competitorId } = useParams<{ competitorId: string }>();
  const { competitors, updateCompetitor } = useStrategy();
  const c = useMemo(
    () => competitors.find((x) => x.id === competitorId),
    [competitors, competitorId],
  );

  if (!c) {
    return (
      <div className="p-8">
        <StrategySubNav />
        <p className="mt-6 text-sm text-ink-muted">Competitor not found.</p>
        <Link to="/strategy/competitors" className="mt-2 text-sm text-ink underline">
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <StrategySubNav />
        <Link
          to="/strategy/competitors"
          className="text-xs font-medium text-ink-muted hover:text-ink"
        >
          ← Competitors
        </Link>

        <CompetitorProfileCard c={c} />

        <label className="block text-xs">
          <span className="text-ink-subtle">Executive summary (profile)</span>
          <textarea
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
            rows={3}
            defaultValue={c.summary}
            key={`sum-${c.id}`}
            onBlur={(e) => updateCompetitor(c.id, { summary: e.target.value })}
          />
        </label>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold text-ink">Metadata</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-ink-subtle">Type</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
                value={c.competitorType}
                onChange={(e) =>
                  updateCompetitor(c.id, {
                    competitorType: e.target.value as CompetitorType,
                  })
                }
              >
                {COMPETITOR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="text-ink-subtle">Likely status</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
                value={c.likelyStatus}
                onChange={(e) =>
                  updateCompetitor(c.id, {
                    likelyStatus: e.target.value as CompetitorLikelyStatus,
                  })
                }
              >
                {COMPETITOR_LIKELY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="text-ink-subtle">Threat level</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
                value={c.threatLevel}
                onChange={(e) =>
                  updateCompetitor(c.id, { threatLevel: e.target.value as ThreatLevel })
                }
              >
                {THREAT_LEVELS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={c.incumbent}
                onChange={(e) =>
                  updateCompetitor(c.id, { incumbent: e.target.checked })
                }
              />
              Incumbent
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="text-ink-subtle">Evidence character</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
                value={c.evidenceCharacter}
                onChange={(e) =>
                  updateCompetitor(c.id, {
                    evidenceCharacter: e.target.value as EvidenceCharacter,
                  })
                }
              >
                {EVIDENCE_CHARACTERS.map((x) => (
                  <option key={x} value={x}>
                    {evidenceCharacterLabel(x)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <CompetitorStrengthList
            items={c.likelyStrengths}
            footer={
              <label className="mt-3 block text-xs">
                <span className="text-ink-subtle">Edit (one per line)</span>
                <textarea
                  className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 font-mono text-xs"
                  rows={5}
                  defaultValue={c.likelyStrengths.join("\n")}
                  key={c.likelyStrengths.join("|")}
                  onBlur={(e) =>
                    updateCompetitor(c.id, {
                      likelyStrengths: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
            }
          />
          <CompetitorWeaknessList
            items={c.likelyWeaknesses}
            footer={
              <label className="mt-3 block text-xs">
                <span className="text-ink-subtle">Edit (one per line)</span>
                <textarea
                  className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 font-mono text-xs"
                  rows={5}
                  defaultValue={c.likelyWeaknesses.join("\n")}
                  key={c.likelyWeaknesses.join("|")}
                  onBlur={(e) =>
                    updateCompetitor(c.id, {
                      likelyWeaknesses: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
            }
          />
        </Card>

        <PositioningAngleCard
          kicker="Likely positioning"
          title="How they may frame themselves"
          body={c.likelyPositioning}
        />
        <label className="block text-xs">
          <span className="text-ink-subtle">Edit positioning</span>
          <textarea
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
            rows={4}
            defaultValue={c.likelyPositioning}
            key={c.likelyPositioning.slice(0, 40)}
            onBlur={(e) =>
              updateCompetitor(c.id, { likelyPositioning: e.target.value })
            }
          />
        </label>

        <Card className="space-y-3 p-5">
          <h2 className="text-sm font-semibold text-ink">Threat interpretation</h2>
          <textarea
            className="w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-ink-muted"
            rows={3}
            defaultValue={c.threatInterpretation}
            key={`ti-${c.id}`}
            onBlur={(e) =>
              updateCompetitor(c.id, { threatInterpretation: e.target.value })
            }
          />
          <h2 className="text-sm font-semibold text-ink">Counter-positioning</h2>
          <textarea
            className="w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm text-ink-muted"
            rows={3}
            defaultValue={c.counterPositioningNotes}
            key={`cp-${c.id}`}
            onBlur={(e) =>
              updateCompetitor(c.id, { counterPositioningNotes: e.target.value })
            }
          />
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Evidence basis</h2>
          <p className="mt-1 text-xs text-ink-subtle">
            {evidenceCharacterLabel(c.evidenceCharacter)}
          </p>
          <textarea
            className="mt-2 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
            rows={4}
            defaultValue={c.evidenceBasis}
            key={`eb-${c.id}`}
            onBlur={(e) => updateCompetitor(c.id, { evidenceBasis: e.target.value })}
          />
        </Card>

        <label className="block text-xs">
          <span className="text-ink-subtle">Analyst notes</span>
          <textarea
            className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
            rows={2}
            defaultValue={c.notes}
            key={`n-${c.id}`}
            onBlur={(e) => updateCompetitor(c.id, { notes: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

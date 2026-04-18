import { useMemo, useState } from "react";
import { CompetitorDirectoryTable } from "@/components/strategy/CompetitorDirectoryTable";
import { StrategySubNav } from "@/components/strategy/StrategySubNav";
import { Card } from "@/components/ui/Card";
import { useStrategy } from "@/context/useStrategy";
import { filterCompetitors } from "@/lib/strategy-utils";
import type {
  CompetitorLikelyStatus,
  StrategyCompetitorFilters,
  ThreatLevel,
} from "@/types";

const THREATS: Array<ThreatLevel | "all"> = [
  "all",
  "Critical",
  "High",
  "Moderate",
  "Low",
];
const STATUSES: Array<CompetitorLikelyStatus | "all"> = [
  "all",
  "Strong Threat",
  "Likely Bidder",
  "Secondary Threat",
  "Monitoring",
  "Unclear",
];

export function CompetitorsPage() {
  const { competitors } = useStrategy();
  const [filters, setFilters] = useState<StrategyCompetitorFilters>({
    threatLevel: "all",
    likelyStatus: "all",
    incumbent: "all",
    search: "",
  });

  const filtered = useMemo(
    () => filterCompetitors(competitors, filters),
    [competitors, filters],
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <StrategySubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Competitive landscape
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            Structured archetypes and judgment — label evidence character honestly.
          </p>
        </div>

        <Card className="flex flex-wrap gap-3 p-4">
          <label className="text-xs">
            <span className="text-ink-subtle">Threat</span>
            <select
              className="mt-1 block rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
              value={filters.threatLevel}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  threatLevel: e.target.value as StrategyCompetitorFilters["threatLevel"],
                }))
              }
            >
              {THREATS.map((t) => (
                <option key={t} value={t}>
                  {t === "all" ? "All threats" : t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-ink-subtle">Likely status</span>
            <select
              className="mt-1 block rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
              value={filters.likelyStatus}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  likelyStatus: e.target.value as StrategyCompetitorFilters["likelyStatus"],
                }))
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-ink-subtle">Incumbent</span>
            <select
              className="mt-1 block rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
              value={filters.incumbent}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  incumbent: e.target.value as StrategyCompetitorFilters["incumbent"],
                }))
              }
            >
              <option value="all">All</option>
              <option value="yes">Incumbent only</option>
              <option value="no">Non-incumbent</option>
            </select>
          </label>
          <label className="min-w-[200px] flex-1 text-xs">
            <span className="text-ink-subtle">Search</span>
            <input
              className="mt-1 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
              value={filters.search}
              placeholder="Name, type, summary…"
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
            />
          </label>
        </Card>

        <p className="text-xs text-ink-muted">
          Showing {filtered.length} of {competitors.length}
        </p>
        <CompetitorDirectoryTable competitors={filtered} />
      </div>
    </div>
  );
}

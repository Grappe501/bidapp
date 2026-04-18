import type { GroundingBundleStats as BundleStats } from "@/lib/drafting-utils";

type GroundingBundleStatsProps = {
  stats: BundleStats;
  className?: string;
  /** Compact one-line for list rows */
  variant?: "inline" | "grid";
};

export function GroundingBundleStatsRow({
  stats,
  className,
  variant = "inline",
}: GroundingBundleStatsProps) {
  if (variant === "inline") {
    return (
      <p className={className ?? "text-[11px] text-ink-muted"}>
        <span className="text-ink-subtle">Reqs</span> {stats.requirementCount}
        <span className="mx-1.5 text-ink-subtle">·</span>
        <span className="text-ink-subtle">Evidence</span> {stats.evidenceCount}
        <span className="mx-1.5 text-ink-subtle">·</span>
        <span className="text-ink-subtle">Facts</span> {stats.vendorFactCount}
        <span className="mx-1.5 text-ink-subtle">·</span>
        <span className="text-ink-subtle">Chunks</span> {stats.chunkCount}
        <span className="mx-1.5 text-ink-subtle">·</span>
        <span className="text-ink-subtle">Gaps</span> {stats.gapCount}
        {stats.architectureOptionCount > 0 ? (
          <>
            <span className="mx-1.5 text-ink-subtle">·</span>
            <span className="text-ink-subtle">Architecture</span>{" "}
            {stats.architectureOptionCount}
          </>
        ) : null}
      </p>
    );
  }

  return (
    <dl
      className={
        className ??
        "grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-4"
      }
    >
      <div>
        <dt className="text-ink-subtle">Requirements</dt>
        <dd className="font-medium text-ink">{stats.requirementCount}</dd>
      </div>
      <div>
        <dt className="text-ink-subtle">Evidence</dt>
        <dd className="font-medium text-ink">{stats.evidenceCount}</dd>
      </div>
      <div>
        <dt className="text-ink-subtle">Company facts</dt>
        <dd className="font-medium text-ink">{stats.vendorFactCount}</dd>
      </div>
      <div>
        <dt className="text-ink-subtle">Retrieval chunks</dt>
        <dd className="font-medium text-ink">{stats.chunkCount}</dd>
      </div>
      <div>
        <dt className="text-ink-subtle">Open gaps</dt>
        <dd className="font-medium text-ink">{stats.gapCount}</dd>
      </div>
      <div>
        <dt className="text-ink-subtle">Architecture options</dt>
        <dd className="font-medium text-ink">{stats.architectureOptionCount}</dd>
      </div>
    </dl>
  );
}

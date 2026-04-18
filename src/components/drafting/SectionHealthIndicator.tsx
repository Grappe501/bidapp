import { cn } from "@/lib/utils";
import type { DraftSectionHealthSnapshot } from "@/lib/drafting-utils";

type SectionHealthIndicatorProps = {
  snapshot: DraftSectionHealthSnapshot;
};

const surface: Record<
  DraftSectionHealthSnapshot["health"],
  string
> = {
  on_track:
    "border-emerald-200/80 bg-emerald-50/45 text-emerald-950/90",
  mixed: "border-zinc-300 bg-zinc-50/90 text-ink",
  at_risk:
    "border-amber-200/90 bg-amber-50/50 text-amber-950",
};

export function SectionHealthIndicator({ snapshot }: SectionHealthIndicatorProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-xs",
        surface[snapshot.health],
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
        Draft health (from metadata)
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug">{snapshot.headline}</p>
      <p className="mt-1 leading-relaxed opacity-90">{snapshot.subline}</p>
    </div>
  );
}

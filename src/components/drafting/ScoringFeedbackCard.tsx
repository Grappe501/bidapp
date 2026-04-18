import { Card } from "@/components/ui/Card";
import type {
  DraftMetadata,
  DraftSectionType,
  GroundingBundlePayload,
} from "@/types";
import {
  explainScoringStrength,
  pointsLabel,
  scoringCategoriesForSection,
} from "@/lib/drafting-utils";

type ScoringFeedbackCardProps = {
  sectionType: DraftSectionType;
  metadata: DraftMetadata | null;
  bundle: GroundingBundlePayload | null;
};

export function ScoringFeedbackCard({
  sectionType,
  metadata,
  bundle,
}: ScoringFeedbackCardProps) {
  const cats = scoringCategoriesForSection(sectionType);
  const expl = explainScoringStrength(sectionType, metadata, bundle);

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Score strength</h2>
        <p className="text-xs text-ink-muted">
          Signal:{" "}
          <span className="font-semibold text-ink">{expl.strength}</span>
          <span className="text-ink-subtle">
            {" "}
            (metadata + proof graph when available)
          </span>
        </p>
      </div>

      <div className="rounded-md border border-zinc-200/80 bg-zinc-50/60 px-3 py-2 text-xs leading-relaxed text-ink-muted">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          What evaluators weight here
        </p>
        <p className="mt-1 text-ink">{expl.sectionLens}</p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Why this strength label
        </p>
        <ul className="list-inside list-disc space-y-1.5 text-xs text-ink-muted">
          {expl.driverLines.map((line) => (
            <li key={line.slice(0, 48)}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Practical focus for this volume
        </p>
        <ul className="space-y-1.5 text-[11px] text-ink-muted">
          {expl.evaluatorTips.map((t) => (
            <li key={t.slice(0, 40)} className="flex gap-2">
              <span className="text-ink-subtle">—</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Score categories (this section)
        </p>
        <ul className="space-y-2 text-xs text-ink-muted">
          {cats.map((c) => (
            <li
              key={c.id}
              className="rounded border border-border/80 bg-white px-2.5 py-2 leading-snug"
            >
              <span className="font-medium text-ink">{c.name}</span> —{" "}
              {pointsLabel(c.weight)}
              <br />
              <span className="text-ink-muted">{c.description}</span>
            </li>
          ))}
        </ul>
      </div>

      {metadata && metadata.riskFlags.length > 0 ? (
        <div className="border-t border-border/60 pt-3 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Structured risk flags
          </p>
          <ul className="mt-1.5 list-inside list-disc text-ink-muted">
            {metadata.riskFlags.slice(0, 6).map((f) => (
              <li key={f.slice(0, 32)}>{f}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[11px] leading-relaxed text-ink-subtle">
        Guidance blends structured metadata with proof-graph support when the bundle
        includes it — not a prediction of actual evaluation scores.
      </p>
    </Card>
  );
}

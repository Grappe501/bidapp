import { Card } from "@/components/ui/Card";
import type { EvaluatorLens } from "@/types";

export function EvaluatorLensCard({ lens }: { lens: EvaluatorLens }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <h3 className="text-sm font-semibold text-ink">{lens.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{lens.description}</p>
      <div className="mt-4 flex-1 space-y-4">
        <div>
          <p className="text-xs font-medium text-ink-subtle">Likely concerns</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-ink-muted">
            {lens.likelyConcerns.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-medium text-ink-subtle">Value signals</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-ink-muted">
            {lens.likelyValueSignals.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md bg-zinc-50 px-3 py-2">
          <p className="text-xs font-medium text-ink-subtle">Strategic response</p>
          <p className="mt-1 text-xs leading-relaxed text-ink">{lens.strategicResponse}</p>
        </div>
      </div>
    </Card>
  );
}

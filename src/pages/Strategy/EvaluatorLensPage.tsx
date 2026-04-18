import { EvaluatorLensCard } from "@/components/strategy/EvaluatorLensCard";
import { StrategySubNav } from "@/components/strategy/StrategySubNav";
import { Card } from "@/components/ui/Card";
import { useStrategy } from "@/context/useStrategy";

export function EvaluatorLensPage() {
  const { evaluatorLenses, updateEvaluatorLens } = useStrategy();

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <StrategySubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Evaluator lens & positioning
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            Think like the scoring committee: concerns, value signals, and how we frame
            the answer — advisory, not pseudo-certainty.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {evaluatorLenses.map((lens) => (
            <div key={lens.id} className="flex flex-col gap-3">
              <EvaluatorLensCard lens={lens} />
              <Card className="p-4">
                <p className="text-xs font-medium text-ink-subtle">
                  Refine strategic response
                </p>
                <textarea
                  className="mt-2 w-full rounded-md border border-border bg-surface-raised px-2 py-1.5 text-sm"
                  rows={4}
                  defaultValue={lens.strategicResponse}
                  key={`sr-${lens.id}-${lens.updatedAt}`}
                  onBlur={(e) =>
                    updateEvaluatorLens(lens.id, {
                      strategicResponse: e.target.value,
                    })
                  }
                />
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { DifferentiationMatrix } from "@/components/strategy/DifferentiationMatrix";
import { StrategySubNav } from "@/components/strategy/StrategySubNav";
import { Card } from "@/components/ui/Card";
import { useStrategy } from "@/context/useStrategy";

export function DifferentiationPage() {
  const { differentiators } = useStrategy();

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <StrategySubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Differentiation matrix
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            Side-by-side view of where we should earn separation — grounded in
            sourced, inferred, and judgment-labeled proof.
          </p>
        </div>

        <Card className="p-4">
          <p className="text-xs leading-relaxed text-ink-muted">
            Use this matrix in red-team and interview prep: every row should trace to
            something you can defend in the room without exaggeration.
          </p>
        </Card>

        <DifferentiationMatrix rows={differentiators} />
      </div>
    </div>
  );
}

import { Card } from "@/components/ui/Card";
import type { RunbookStep } from "@/data/mockSubmissionRunbook";

export function RunbookStepCard({ step, index }: { step: RunbookStep; index: number }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-zinc-50/80 px-4 py-2">
        <p className="text-[10px] font-medium text-ink-subtle">Step {index + 1}</p>
        <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
      </div>
      <div className="space-y-3 px-4 py-3 text-sm">
        <p className="whitespace-pre-wrap leading-relaxed text-ink-muted">
          {step.instructions.replace(/\*\*(.*?)\*\*/g, "$1")}
        </p>
        <div>
          <p className="text-xs font-medium text-ink-subtle">Validation checks</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-ink-muted">
            {step.validationChecks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        {step.requiredArtifacts.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-ink-subtle">Required artifacts</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-ink-muted">
              {step.requiredArtifacts.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

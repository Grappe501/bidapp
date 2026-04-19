import { useState } from "react";
import { AgentActionResult } from "@/components/agent/AgentActionResult";
import { AgentConfidenceBadge } from "@/components/agent/AgentConfidenceBadge";
import { AgentEvidenceList } from "@/components/agent/AgentEvidenceList";
import { AgentSuggestedActions } from "@/components/agent/AgentSuggestedActions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AgentMaloneAnswer } from "@/types";

function copyText(answer: AgentMaloneAnswer): string {
  const lines = [
    answer.headline,
    "",
    answer.shortAnswer,
    "",
    ...answer.sections.map((s) => `${s.title}\n${s.content}`),
  ];
  if (answer.executedAction) {
    lines.push(
      "",
      `Workflow: ${answer.executedAction.actionType} (${answer.executedAction.status})`,
      answer.executedAction.summary,
    );
  }
  return lines.join("\n");
}

export function AgentAnswerCard({ answer }: { answer: AgentMaloneAnswer }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText(answer));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <Card className="space-y-4 border-zinc-200/80">
      {answer.executedAction ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Executed workflow
          </p>
          <AgentActionResult result={answer.executedAction} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-ink">{answer.headline}</h3>
          <p className="mt-1 text-sm text-ink-muted">{answer.shortAnswer}</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <AgentConfidenceBadge confidence={answer.confidence} />
          <Button
            type="button"
            variant="secondary"
            className="py-1 text-xs"
            onClick={() => void copy()}
          >
            {copied ? "Copied" : "Copy answer"}
          </Button>
        </div>
      </div>

      {answer.sections.length > 0 ? (
        <div className="space-y-3 border-t border-border pt-3">
          {answer.sections.map((s, i) => (
            <div key={i}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {s.title}
              </h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{s.content}</p>
            </div>
          ))}
        </div>
      ) : null}

      {answer.caveats.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          <span className="font-medium">Caveats: </span>
          {answer.caveats.join(" · ")}
        </div>
      ) : null}

      <div className="border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Evidence & provenance
        </p>
        <div className="mt-2">
          <AgentEvidenceList items={answer.evidence} />
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Suggested next actions
        </p>
        <div className="mt-2">
          <AgentSuggestedActions actions={answer.suggestedActions} />
        </div>
      </div>
    </Card>
  );
}

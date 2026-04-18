import { useState } from "react";
import { RunbookStepCard } from "@/components/submission/RunbookStepCard";
import { SubmissionSubNav } from "@/components/submission/SubmissionSubNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  formatRunbookCopy,
  MOCK_SUBMISSION_RUNBOOK_STEPS,
} from "@/data/mockSubmissionRunbook";
import { copyTextToClipboard } from "@/lib/output-utils";

export function SubmissionRunbookPage() {
  const [msg, setMsg] = useState<string | null>(null);

  const copyStep = async (index: number) => {
    const s = MOCK_SUBMISSION_RUNBOOK_STEPS[index];
    const text = [s.title, "", s.instructions, "", ...s.validationChecks.map((c) => `• ${c}`)].join("\n");
    const ok = await copyTextToClipboard(text);
    setMsg(ok ? "Step copied" : "Copy failed");
    setTimeout(() => setMsg(null), 2400);
  };

  const copyAll = async () => {
    const ok = await copyTextToClipboard(
      formatRunbookCopy(MOCK_SUBMISSION_RUNBOOK_STEPS),
    );
    setMsg(ok ? "Full runbook copied" : "Copy failed");
    setTimeout(() => setMsg(null), 2400);
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <SubmissionSubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Submission runbook
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Human execution guide for ARBuy — no API automation. Keep the final
            validation gate at <strong className="font-medium text-ink">PASS</strong>{" "}
            before confirming submission.
          </p>
        </div>

        <Card className="flex flex-wrap gap-2 p-4">
          <Button type="button" variant="secondary" className="text-xs" onClick={copyAll}>
            Copy full runbook
          </Button>
          {msg ? (
            <span className="self-center text-xs text-ink-muted">{msg}</span>
          ) : null}
        </Card>

        <div className="space-y-4">
          {MOCK_SUBMISSION_RUNBOOK_STEPS.map((step, i) => (
            <div key={step.id}>
              <RunbookStepCard step={step} index={i} />
              <Button
                type="button"
                variant="secondary"
                className="mt-2 text-xs"
                onClick={() => copyStep(i)}
              >
                Copy this step
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

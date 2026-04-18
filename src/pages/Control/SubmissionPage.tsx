import { Card } from "@/components/ui/Card";
import { BidControlNav } from "@/components/control/BidControlNav";
import { SubmissionChecklist } from "@/components/control/SubmissionChecklist";
import { useControl } from "@/context/useControl";
import { useWorkspace } from "@/context/useWorkspace";
import {
  openRedactionCount,
  submissionRequiredCompleteCount,
  submissionRequiredTotal,
} from "@/lib/control-utils";
import { formatRecordDate } from "@/lib/display-format";

export function SubmissionPage() {
  const { project } = useWorkspace();
  const { submissionItems, redactionFlags, updateSubmissionItem } = useControl();
  const done = submissionRequiredCompleteCount(submissionItems);
  const total = submissionRequiredTotal(submissionItems);
  const openRed = openRedactionCount(redactionFlags);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <BidControlNav />

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            {project.bidNumber} · {project.issuingOrganization}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
            Submission command center
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            ARBuy is the system of record for this solicitation. Track every
            mandatory artifact, owner, and validation state before lock. FOIA /
            redaction posture is tracked on the Contract tab—{openRed} open
            flag{openRed === 1 ? "" : "s"} right now.
          </p>
          <p className="mt-2 text-xs text-ink-subtle">
            Response due {formatRecordDate(`${project.dueDate}T12:00:00.000Z`)} ·
            validate workbook and signature packages against state checklist.
          </p>
        </div>

        <Card className="flex flex-wrap items-center justify-between gap-4 border-zinc-200 bg-zinc-50/80 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-ink">Required proposal items</p>
            <p className="mt-1 text-xs text-ink-muted">
              {done} of {total} required items validated or submitted
            </p>
          </div>
          <div className="text-right text-xs text-ink-subtle">
            <p>Portal: ARBuy (S000000479)</p>
            <p className="mt-0.5">No alternate submission channels</p>
          </div>
        </Card>

        <SubmissionChecklist
          items={submissionItems}
          onUpdate={updateSubmissionItem}
        />
      </div>
    </div>
  );
}

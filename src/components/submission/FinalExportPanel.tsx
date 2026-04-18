import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useOutput } from "@/context/useOutput";
import {
  artifactsWithRedactionPseudo,
  buildBundlePayload,
  copyTextToClipboard,
} from "@/lib/output-utils";
import {
  formatRunbookCopy,
  MOCK_SUBMISSION_RUNBOOK_STEPS,
} from "@/data/mockSubmissionRunbook";

export function FinalExportPanel() {
  const {
    copyChecklistSummary,
    copyReadinessSummary,
    copySectionPlainText,
    bundles,
    copyBundleJson,
    project,
    artifacts,
    reviewSnapshot,
  } = useOutput();
  const [msg, setMsg] = useState<string | null>(null);

  const subBundle = bundles.find((b) => b.bundleType === "Submission Package");
  const clientBundle = bundles.find(
    (b) => b.bundleType === "Client Review Packet",
  );

  const mergedArtifacts = useMemo(
    () =>
      artifactsWithRedactionPseudo(artifacts, reviewSnapshot.redactionFlags),
    [artifacts, reviewSnapshot.redactionFlags],
  );

  const run = async (label: string, fn: () => Promise<boolean>) => {
    const ok = await fn();
    setMsg(ok ? `${label} copied` : `${label} failed`);
    setTimeout(() => setMsg(null), 2800);
  };

  const downloadJson = (raw: string, filename: string) => {
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-ink">Final export panel</h2>
      <p className="mt-1 text-xs text-ink-muted">
        Clipboard-first exports for manual ARBuy assembly — structured JSON optional.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={() => run("Checklist", copyChecklistSummary)}
        >
          Copy submission checklist
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={() => run("Readiness", copyReadinessSummary)}
        >
          Copy readiness summary
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={() =>
            run("Runbook", () =>
              copyTextToClipboard(formatRunbookCopy(MOCK_SUBMISSION_RUNBOOK_STEPS)),
            )
          }
        >
          Copy full runbook
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="text-xs"
          onClick={() => run("Experience", () =>
            copySectionPlainText("draft-sec-proj-ark-1"),
          )}
        >
          Copy Experience draft
        </Button>
        {subBundle ? (
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={() => run("Submission JSON", () => copyBundleJson(subBundle.id))}
          >
            Copy submission bundle JSON
          </Button>
        ) : null}
        {clientBundle ? (
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={() =>
              run("Client JSON", () => copyBundleJson(clientBundle.id))
            }
          >
            Copy client packet JSON
          </Button>
        ) : null}
        {subBundle ? (
          <Button
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={() => {
              const raw = JSON.stringify(
                buildBundlePayload(subBundle, mergedArtifacts),
                null,
                2,
              );
              downloadJson(raw, `${project.bidNumber}-submission-bundle.json`);
              setMsg("JSON download started");
              setTimeout(() => setMsg(null), 2800);
            }}
          >
            Download submission JSON
          </Button>
        ) : null}
      </div>
      {msg ? (
        <p className="mt-3 text-xs text-ink-muted" role="status">
          {msg}
        </p>
      ) : null}
    </Card>
  );
}

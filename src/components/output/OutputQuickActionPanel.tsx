import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OUTPUT_BUNDLE_WORKSPACE_HREF } from "@/lib/output-utils";
import type { OutputBundleType } from "@/types";

const PRIMARY: { type: OutputBundleType; label: string; desc: string }[] = [
  {
    type: "Submission Package",
    label: "Submission package",
    desc: "Assembly workspace for forms, volumes, and checklist.",
  },
  {
    type: "Client Review Packet",
    label: "Client review packet",
    desc: "Narrative and evidence suited for sponsor review.",
  },
  {
    type: "Redacted Packet",
    label: "Redacted packet",
    desc: "FOIA / public disclosure control for the redacted packet.",
  },
  {
    type: "Final Readiness Bundle",
    label: "Final readiness bundle",
    desc: "Go / no-go view with readiness and submission signals.",
  },
];

type OutputQuickActionPanelProps = {
  onCopyReadiness?: () => void;
  onCopyChecklist?: () => void;
};

export function OutputQuickActionPanel({
  onCopyReadiness,
  onCopyChecklist,
}: OutputQuickActionPanelProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        Workspace shortcuts
      </h2>
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {PRIMARY.map(({ type, label, desc }) => (
            <Link
              key={type}
              to={OUTPUT_BUNDLE_WORKSPACE_HREF[type]}
              className="rounded-lg border border-border bg-zinc-50/40 px-3 py-3 transition-colors hover:border-zinc-300 hover:bg-white"
            >
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {desc}
              </p>
              <span className="mt-2 inline-block text-xs font-medium text-ink underline-offset-2">
                Open →
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border/70 pt-4">
          {onCopyReadiness ? (
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => void onCopyReadiness()}
            >
              Copy readiness summary (text)
            </Button>
          ) : null}
          {onCopyChecklist ? (
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => void onCopyChecklist()}
            >
              Copy submission checklist (Markdown)
            </Button>
          ) : null}
          <Link
            to="/review/readiness"
            className="inline-flex items-center rounded-md border border-border bg-surface-raised px-3 py-2 text-xs font-medium text-ink shadow-sm hover:bg-zinc-50"
          >
            Open readiness model
          </Link>
        </div>
      </Card>
    </div>
  );
}

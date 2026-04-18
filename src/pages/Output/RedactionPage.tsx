import { OutputSubNav } from "@/components/output/OutputSubNav";
import { RedactionArtifactTable } from "@/components/output/RedactionArtifactTable";
import { RedactionPreviewCard } from "@/components/output/RedactionPreviewCard";
import { Card } from "@/components/ui/Card";
import { useControl } from "@/context/useControl";
import { useOutput } from "@/context/useOutput";

export function RedactionPage() {
  const { redactionFlags } = useControl();
  const { redactionSummary } = useOutput();

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <OutputSubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Redaction support
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Packaging aid for FOIA-sensitive materials — flags tie to control center
            records. No automated document redaction in this phase.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-subtle">Flagged items</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {redactionSummary.totalFlagged}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-subtle">Unresolved</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {redactionSummary.unresolvedCount}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-subtle">Redacted packet</p>
            <p className="mt-1 text-sm font-medium text-ink">
              {redactionSummary.redactedCopyArtifactReady &&
              redactionSummary.unresolvedCount === 0
                ? "Ready to assemble"
                : "Gated — see blockers"}
            </p>
          </Card>
        </div>

        {redactionSummary.blockers.length > 0 ? (
          <Card className="border-amber-200/80 bg-amber-50/40 p-4">
            <p className="text-xs font-medium text-ink">Blockers</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-ink-muted">
              {redactionSummary.blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div>
          <h2 className="text-sm font-semibold text-ink">Flag register</h2>
          <div className="mt-3">
            <RedactionArtifactTable flags={redactionFlags} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Preview & judgment notes</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {redactionFlags.map((f) => (
              <RedactionPreviewCard key={f.id} flag={f} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { RedactionArtifactTable } from "@/components/output/RedactionArtifactTable";
import { RedactionDecisionCard } from "@/components/output/RedactionDecisionCard";
import { RedactionPreviewCard } from "@/components/output/RedactionPreviewCard";
import { RedactionSummaryStrip } from "@/components/output/RedactionSummaryStrip";
import { Card } from "@/components/ui/Card";
import { useControl } from "@/context/useControl";
import { useOutput } from "@/context/useOutput";

export function RedactionPage() {
  const { redactionFlags } = useControl();
  const { redactionSummary } = useOutput();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const effectiveSelectedId =
    (selectedId && redactionFlags.some((f) => f.id === selectedId) && selectedId) ||
    redactionFlags[0]?.id ||
    null;

  const selectedFlag = useMemo(
    () =>
      effectiveSelectedId
        ? (redactionFlags.find((f) => f.id === effectiveSelectedId) ?? null)
        : null,
    [redactionFlags, effectiveSelectedId],
  );

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <OutputSubNav />

        <header className="space-y-2 border-b border-border pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Redacted packet
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">Redaction support</span> workspace — FOIA
            and public-disclosure control for this bid. Clarify what is sensitive, what is in
            review, what belongs in the <span className="font-medium text-ink">redacted packet</span>
            , and which <span className="font-medium text-ink">redaction items</span> still need a
            decision. No automated document redaction in this release.
          </p>
        </header>

        <RedactionSummaryStrip summary={redactionSummary} />

        {redactionSummary.blockers.length > 0 ? (
          <Card className="border-amber-200/70 bg-amber-50/30 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-950/80">
              Redacted packet · blockers
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-amber-950/90">
              {redactionSummary.blockers.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-700/80" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            Redaction control table
          </h2>
          <Link
            to="/control/contract"
            className="text-xs font-semibold text-ink underline-offset-2 hover:underline"
          >
            Manage redaction items in control center →
          </Link>
        </div>
        <RedactionArtifactTable
          flags={redactionFlags}
          selectedId={effectiveSelectedId}
          onSelect={setSelectedId}
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Quick scan
            </h2>
            <p className="text-xs text-ink-muted">
              Compact view of each <span className="font-medium text-ink">redaction item</span>.
              Select a row above for full decision context.
            </p>
            <div className="space-y-2">
              {redactionFlags.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedId(f.id)}
                  aria-pressed={effectiveSelectedId === f.id}
                >
                  <RedactionPreviewCard flag={f} compact />
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Item detail & judgment
            </h2>
            <div className="mt-3">
              <RedactionDecisionCard flag={selectedFlag} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

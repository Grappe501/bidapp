import { Card } from "@/components/ui/Card";
import {
  assessGroundingBundleQuality,
  getGroundingBundleStats,
} from "@/lib/drafting-utils";
import { computePricingHealth } from "@/lib/pricing-structure";
import type { DraftSectionType, GroundingBundlePayload } from "@/types";
import { GroundingBundleQualityBadge } from "./GroundingBundleQualityBadge";
import { GroundingBundleStatsRow } from "./GroundingBundleStats";

const PREVIEW_LIMIT = 6;
const GAP_LIMIT = 8;

type GroundingBundlePreviewProps = {
  bundleId: string;
  payload: GroundingBundlePayload;
  /** Shown as subtle context; does not change layout structure. */
  sectionType?: DraftSectionType;
  createdAtLabel?: string;
};

function formatWhen(iso: string | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function GroundingBundlePreview({
  bundleId,
  payload,
  sectionType,
  createdAtLabel,
}: GroundingBundlePreviewProps) {
  const stats = getGroundingBundleStats(payload);
  const quality = assessGroundingBundleQuality(payload);
  const pricingHealth = payload.pricing
    ? computePricingHealth(payload.pricing)
    : null;
  const assembled = formatWhen(payload.assembledAt);
  const title = payload.title?.trim() || "Untitled grounding bundle";

  return (
    <Card className="space-y-4 border-zinc-300/40 bg-zinc-50/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-semibold text-ink">Grounding bundle preview</h2>
          <p className="text-xs font-medium text-ink">{title}</p>
          <p className="text-[11px] text-ink-muted">
            <span className="text-ink-subtle">Type</span> {payload.bundleType}
            <span className="mx-2 text-ink-subtle">·</span>
            <span className="text-ink-subtle">ID</span>{" "}
            <span className="font-mono text-[10px]">{bundleId.slice(0, 8)}…</span>
          </p>
          {sectionType ? (
            <p className="text-[11px] text-ink-subtle">
              Reviewing for section: {sectionType}
            </p>
          ) : null}
        </div>
        <GroundingBundleQualityBadge
          label={quality.label}
          title={quality.reasons.join(" ")}
        />
      </div>

      <GroundingBundleStatsRow stats={stats} variant="grid" />

      {payload.pricing ? (
        <div className="rounded-md border border-violet-200/80 bg-violet-50/40 px-3 py-2 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Structured pricing (bundle)
          </p>
          <p className="mt-1 text-ink-muted">
            Annual ${payload.pricing.model.totals.annual.toLocaleString()} · Contract{" "}
            ${payload.pricing.model.totals.contractTotal.toLocaleString()}
            {pricingHealth?.ready ? (
              <span className="ml-2 text-emerald-900">· Ready</span>
            ) : (
              <span className="ml-2 text-amber-900">· Not ready</span>
            )}
          </p>
          {pricingHealth ? (
            <p className="mt-1 text-[10px] text-ink-subtle">
              Parsed {pricingHealth.parsed ? "✓" : "✗"} · Categorized {pricingHealth.categorized ? "✓" : "✗"} · RFP{" "}
              {pricingHealth.rfpCoverage ? "✓" : "✗"} · Contract {pricingHealth.contractCompliant ? "✓" : "✗"}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border/60 pt-3 text-[10px] text-ink-subtle">
        {assembled ? (
          <span>
            Assembled <span className="text-ink-muted">{assembled}</span>
          </span>
        ) : null}
        {createdAtLabel ? (
          <span>
            Stored <span className="text-ink-muted">{createdAtLabel}</span>
          </span>
        ) : null}
      </div>

      {quality.reasons.length > 0 ? (
        <div className="rounded-md border border-zinc-200/80 bg-white/80 px-3 py-2 text-xs text-ink-muted">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Why this strength label
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5">
            {quality.reasons.map((r) => (
              <li key={r.slice(0, 48)}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {payload.factSelectionSummary ? (
        <div
          className={`rounded-md border px-3 py-2 text-xs ${
            (payload.weakFactIncludedCount ?? 0) > 0 ||
            (payload.factSelectionDetail?.includedUnknownCount ?? 0) > 0
              ? "border-amber-200/80 bg-amber-50/50 text-amber-950"
              : "border-zinc-200/80 bg-white/80 text-ink-muted"
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Vendor fact selection
          </p>
          <p className="mt-1 leading-snug">{payload.factSelectionSummary}</p>
          {payload.factSelectionDetail ? (
            <p className="mt-1.5 text-[10px] leading-snug text-ink-subtle">
              Bundle evidence:{" "}
              <span className="text-ink-muted">
                {payload.factSelectionDetail.bundleQuality}
              </span>
              {payload.factSelectionDetail.includedUnknownCount > 0 ? (
                <>
                  {" "}
                  · includes{" "}
                  {payload.factSelectionDetail.includedUnknownCount} unknown-quality
                  fact(s)
                </>
              ) : null}
              {payload.factSelectionDetail.includedFallbackCount > 0 ? (
                <>
                  {" "}
                  · {payload.factSelectionDetail.includedFallbackCount} fallback-tier
                </>
              ) : null}
              {(payload.factSelectionDetail.droppedUnknownCount ?? 0) > 0 ? (
                <>
                  {" "}
                  · {payload.factSelectionDetail.droppedUnknownCount} unknown-metadata
                  fact(s) withheld
                </>
              ) : null}
            </p>
          ) : null}
          {payload.bundleQualityNote || payload.factSelectionDetail?.bundleQualityNote ? (
            <p className="mt-1 text-[10px] leading-snug text-amber-900/85">
              {payload.bundleQualityNote ?? payload.factSelectionDetail?.bundleQualityNote}
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Requirements in bundle
        </h3>
        {payload.requirements.length === 0 ? (
          <p className="text-xs text-ink-muted">None listed in this bundle.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {payload.requirements.slice(0, PREVIEW_LIMIT).map((r) => (
              <li
                key={r.id}
                className="rounded border border-border/80 bg-white px-2.5 py-2 leading-snug"
              >
                <span className="font-medium text-ink">{r.title}</span>
                {r.riskLevel ? (
                  <span className="ml-2 text-ink-subtle">({r.riskLevel})</span>
                ) : null}
                {r.summary ? (
                  <p className="mt-1 text-ink-muted">{r.summary}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {payload.requirements.length > PREVIEW_LIMIT ? (
          <p className="text-[11px] text-ink-subtle">
            +{payload.requirements.length - PREVIEW_LIMIT} more not shown
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Evidence
        </h3>
        {payload.evidence.length === 0 ? (
          <p className="text-xs text-ink-muted">No evidence rows — proof may be implicit only.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {payload.evidence.slice(0, PREVIEW_LIMIT).map((e) => (
              <li
                key={e.id}
                className="rounded border border-border/80 bg-white px-2.5 py-2 leading-snug"
              >
                <span className="font-medium text-ink">{e.title}</span>
                <span className="ml-2 text-ink-subtle">
                  {e.validationStatus}
                  {e.evidenceType ? ` · ${e.evidenceType}` : ""}
                </span>
                {e.excerpt ? (
                  <p className="mt-1 line-clamp-3 text-ink-muted">{e.excerpt}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {payload.evidence.length > PREVIEW_LIMIT ? (
          <p className="text-[11px] text-ink-subtle">
            +{payload.evidence.length - PREVIEW_LIMIT} more not shown
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Company / vendor facts
        </h3>
        {payload.vendorFacts.length === 0 ? (
          <p className="text-xs text-ink-muted">None in this bundle.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {payload.vendorFacts.slice(0, PREVIEW_LIMIT).map((f, i) => (
              <li
                key={`${f.sourceId ?? i}-${f.factText.slice(0, 24)}`}
                className="rounded border border-border/80 bg-white px-2.5 py-2 leading-snug"
              >
                {f.vendorName ? (
                  <span className="font-medium text-ink">{f.vendorName}</span>
                ) : null}
                <p className="text-ink-muted">{f.factText}</p>
                <p className="mt-1 text-[11px] text-ink-subtle">
                  {f.provenanceKind} · {f.validationStatus}
                  {f.credibility || f.confidence
                    ? ` · ${[f.credibility, f.confidence].filter(Boolean).join(" · ")}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {payload.architectureOptions.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Architecture context
          </h3>
          <ul className="space-y-2 text-xs">
            {payload.architectureOptions.slice(0, PREVIEW_LIMIT).map((a) => (
              <li
                key={a.id}
                className="rounded border border-border/80 bg-white px-2.5 py-2"
              >
                <span className="font-medium text-ink">{a.name}</span>
                {a.summary ? (
                  <p className="mt-1 text-ink-muted">{a.summary}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Gaps and missing support
        </h3>
        {payload.gaps.length === 0 && payload.validationNotes.length === 0 ? (
          <p className="text-xs text-ink-muted">
            No recorded gaps or validation notes on this bundle.
          </p>
        ) : (
          <>
            {payload.gaps.length > 0 ? (
              <ul className="list-inside list-disc space-y-1 text-xs text-ink-muted">
                {payload.gaps.slice(0, GAP_LIMIT).map((g) => (
                  <li key={g.slice(0, 64)}>{g}</li>
                ))}
              </ul>
            ) : null}
            {payload.validationNotes.length > 0 ? (
              <div className="mt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
                  Validation notes
                </p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-ink-muted">
                  {payload.validationNotes.slice(0, GAP_LIMIT).map((n) => (
                    <li key={n.slice(0, 64)}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </section>
    </Card>
  );
}

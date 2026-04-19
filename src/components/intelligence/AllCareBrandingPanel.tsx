import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  deriveAllCareBrandingNextActions,
  type VendorLinkRecommendedAction,
} from "@/lib/allcare-branding-next-actions";
import {
  isFunctionsApiConfigured,
  postGetBrandingProfile,
  postScrapeAllCareSite,
  type AllCareLegacyFactBackfillMode,
  type AllCareScrapeRunApi,
  type BrandingProfileApi,
} from "@/lib/functions-api";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function labelCase(s: string | null | undefined): string {
  if (!s?.trim()) return "—";
  const t = s.trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function labelRecommendedAction(
  a: VendorLinkRecommendedAction | null | undefined,
): string {
  switch (a) {
    case "link_existing_vendor":
      return "Link existing vendor";
    case "create_vendor_record":
      return "Create vendor record";
    case "review_candidates":
      return "Review candidates";
    case "none":
      return "None";
    default:
      return "—";
  }
}

export function AllCareBrandingPanel() {
  const [projectId, setProjectId] = useState(
    () => import.meta.env.VITE_DEFAULT_PROJECT_ID ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [branding, setBranding] = useState<BrandingProfileApi | null>(null);
  const [lastRun, setLastRun] = useState<AllCareScrapeRunApi | null>(null);
  const [forceReparse, setForceReparse] = useState(false);
  const [liveCrawl, setLiveCrawl] = useState(true);
  const [maxPages, setMaxPages] = useState("");
  const [maxDepth, setMaxDepth] = useState("");
  const [runBackfill, setRunBackfill] = useState(false);
  const [backfillMode, setBackfillMode] =
    useState<AllCareLegacyFactBackfillMode>("fill-missing");

  const configured = isFunctionsApiConfigured();

  const withBusy = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setStatus("");
    try {
      await fn();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }, []);

  const loadBranding = useCallback(
    (ensureProfile: boolean) =>
      withBusy(async () => {
        const pid = projectId.trim();
        if (!pid) {
          setStatus("Enter a project ID.");
          return;
        }
        const r = await postGetBrandingProfile({
          projectId: pid,
          ensureProfile,
        });
        setBranding(r.branding);
        setStatus(
          ensureProfile
            ? "Client profile is synced (nothing was overwritten without cause)."
            : "Branding profile loaded.",
        );
      }),
    [projectId, withBusy],
  );

  const parseOptInt = (s: string): number | undefined => {
    const n = Number(s.trim());
    return s.trim() === "" || Number.isNaN(n) || n < 1 ? undefined : n;
  };

  return (
    <Card className="space-y-5 border border-emerald-900/10 bg-gradient-to-b from-emerald-50/90 to-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-emerald-900/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            AllCare company profile
          </h3>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-ink-muted">
            Operational profile for proposal alignment — summary, service lines,
            capabilities, and technology signals from your controlled sources.
            Load the profile first; use advanced sourcing when you need to refresh
            from the public AllCare site.
          </p>
        </div>
      </div>

      {!configured ? (
        <p className="rounded-md border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
          Configure{" "}
          <code className="rounded bg-white/90 px-1">VITE_FUNCTIONS_BASE_URL</code>{" "}
          to enable company profile APIs.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1 max-w-md space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Project ID</span>
          <Input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Project UUID"
            disabled={busy}
            className="font-mono text-xs"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !projectId.trim()}
            onClick={() => loadBranding(false)}
          >
            Load company profile
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !projectId.trim()}
            onClick={() => loadBranding(true)}
          >
            Sync client profile
          </Button>
        </div>
      </div>

      {status ? (
        <p className="rounded-md border border-zinc-200/90 bg-white px-3 py-2 text-xs leading-relaxed text-ink-muted">
          {status}
        </p>
      ) : null}

      {!branding ? (
        <p className="rounded-md border border-zinc-200/70 bg-zinc-50/60 px-3 py-2 text-xs text-ink-muted">
          No company profile loaded yet. Enter the workspace project ID and choose{" "}
          <span className="font-medium text-ink">Load company profile</span>, or open{" "}
          <span className="font-medium text-ink">Advanced sourcing</span> below to
          refresh from the public site.
        </p>
      ) : null}

      {branding ? (
        <div className="space-y-4 border-t border-zinc-200/80 pt-4">
          {(() => {
            const nextActions = deriveAllCareBrandingNextActions({
              robotsReviewRecommended: branding.robotsReviewRecommended ?? false,
              vendorRecommendedAction: branding.vendorRecommendedAction ?? null,
              vendorMatchType: branding.vendorMatchType,
              vendorMatchConfidence: branding.vendorMatchConfidence,
              lastFactAudit: branding.lastFactAudit,
              ingestQualityWarnings: branding.ingestQualityWarnings,
              ingestQualityBand: branding.ingestQualityBand,
            });
            return nextActions.length > 0 ? (
              <div className="rounded-lg border border-emerald-800/15 bg-emerald-50/50 px-3 py-2.5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-950/80">
                  Next actions
                </p>
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[0.7rem] text-ink-muted">
                  {nextActions.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {branding.logoUrl ? (
              <div className="shrink-0 overflow-hidden rounded-lg border border-zinc-200/90 bg-white p-3 shadow-sm">
                <img
                  src={branding.logoUrl}
                  alt={`${branding.displayName} logo`}
                  className="mx-auto max-h-16 max-w-[10rem] object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1 text-xs">
              <p className="text-sm font-semibold text-ink">
                {branding.appDisplayName}
              </p>
              {(branding.ingestQualityScore != null ||
                branding.ingestQualityBand ||
                branding.vendorMatchConfidence ||
                branding.logoConfidence) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {branding.ingestQualityScore != null ? (
                    <span
                      className={`rounded border px-2 py-0.5 text-[0.65rem] font-medium shadow-sm ${
                        branding.ingestQualityBand === "weak"
                          ? "border-amber-200/90 bg-amber-50/90 text-amber-950"
                          : "border-zinc-200/90 bg-white text-ink-muted"
                      }`}
                    >
                      Quality: {branding.ingestQualityScore}
                      {branding.ingestQualityBand
                        ? ` · ${labelCase(branding.ingestQualityBand)}`
                        : ""}
                    </span>
                  ) : null}
                  {branding.ingestQualityConfidence ? (
                    <span
                      className={`rounded border px-2 py-0.5 text-[0.65rem] font-medium shadow-sm ${
                        branding.ingestQualityConfidence === "low"
                          ? "border-amber-200/85 bg-amber-50/80 text-amber-950"
                          : "border-zinc-200/90 bg-white text-ink-muted"
                      }`}
                    >
                      Score confidence: {labelCase(branding.ingestQualityConfidence)}
                    </span>
                  ) : null}
                  {branding.vendorMatchType === "ambiguous" ||
                  branding.vendorMatchConfidence === "none" ? (
                    <span className="rounded border border-amber-200/80 bg-amber-50/80 px-2 py-0.5 text-[0.65rem] font-medium text-amber-950 shadow-sm">
                      Vendor:{" "}
                      {branding.vendorMatchType === "ambiguous"
                        ? "Ambiguous"
                        : "Unresolved"}
                    </span>
                  ) : branding.vendorMatchConfidence ? (
                    <span className="rounded border border-zinc-200/90 bg-white px-2 py-0.5 text-[0.65rem] font-medium text-ink-muted shadow-sm">
                      Vendor match: {labelCase(branding.vendorMatchConfidence)}
                    </span>
                  ) : null}
                  {branding.logoConfidence ? (
                    <span
                      className={`rounded border px-2 py-0.5 text-[0.65rem] font-medium shadow-sm ${
                        branding.logoConfidence.toLowerCase() === "low"
                          ? "border-amber-200/90 bg-amber-50/90 text-amber-950"
                          : "border-zinc-200/90 bg-white text-ink-muted"
                      }`}
                    >
                      Logo: {labelCase(branding.logoConfidence)}
                    </span>
                  ) : null}
                </div>
              )}
              {branding.intelligenceTrustHint ? (
                <p className="mt-2 text-[0.7rem] leading-snug text-ink-subtle">
                  {branding.intelligenceTrustHint}
                </p>
              ) : null}
              {branding.ingestQualityWarnings.length > 0 ? (
                <p className="mt-1 text-[0.65rem] leading-snug text-ink-subtle">
                  {branding.ingestQualityWarnings.slice(0, 2).join(" · ")}
                  {branding.ingestQualityWarnings.length > 2 ? " · …" : ""}
                </p>
              ) : branding.ingestQualityPenalties.length > 0 ? (
                <p className="mt-1 text-[0.65rem] leading-snug text-ink-subtle">
                  {branding.ingestQualityPenalties.slice(0, 2).join(" · ")}
                  {branding.ingestQualityPenalties.length > 2 ? " · …" : ""}
                </p>
              ) : null}
              {branding.vendorResolutionNotes ? (
                <p className="mt-1 text-[0.65rem] text-ink-subtle">
                  Resolution: {branding.vendorResolutionNotes}
                </p>
              ) : null}
              {branding.robotsReviewRecommended ? (
                <p className="mt-2 rounded border border-amber-200/70 bg-amber-50/60 px-2 py-1.5 text-[0.65rem] leading-snug text-amber-950/90">
                  Robots rules were interpreted using practical matching; review
                  recommended
                  {branding.robotsReviewReason
                    ? `: ${branding.robotsReviewReason}`
                    : "."}
                </p>
              ) : null}
              {branding.vendorOperatorGuidance?.trim() ||
              (branding.vendorRecommendedAction &&
                branding.vendorRecommendedAction !== "none") ||
              (branding.vendorRecommendedCandidates?.length ?? 0) > 0 ||
              branding.vendorMatchType === "ambiguous" ||
              branding.vendorMatchType === "none" ? (
                <div className="mt-2 rounded-md border border-zinc-200/90 bg-white/80 px-2.5 py-2 text-[0.65rem] text-ink-muted shadow-sm">
                  <p className="font-semibold text-ink">Vendor resolution</p>
                  <p className="mt-1">
                    Match: {labelCase(branding.vendorMatchType)} · confidence{" "}
                    {labelCase(branding.vendorMatchConfidence)}
                  </p>
                  <p className="mt-0.5">
                    Recommended:{" "}
                    <span className="font-medium text-ink">
                      {labelRecommendedAction(branding.vendorRecommendedAction)}
                    </span>
                  </p>
                  {branding.vendorOperatorGuidance ? (
                    <p className="mt-1 text-ink-subtle">
                      {branding.vendorOperatorGuidance}
                    </p>
                  ) : null}
                  {(branding.vendorRecommendedCandidates?.length ?? 0) > 0 ? (
                    <p className="mt-1 text-ink-subtle">
                      Top candidates:{" "}
                      {branding.vendorRecommendedCandidates
                        .slice(0, 3)
                        .map((c) => c.vendorName)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {branding.lastFactAudit ? (
                <div className="mt-2 rounded-md border border-zinc-200/80 bg-zinc-50/50 px-2.5 py-2 text-[0.65rem] text-ink-muted">
                  <p className="font-semibold text-ink">Legacy fact audit</p>
                  <p className="mt-1">
                    Mode {branding.lastFactAudit.mode} · corrected{" "}
                    {branding.lastFactAudit.correctedValues}
                    {branding.lastFactAudit.skippedAmbiguous
                      ? ` · skipped ambiguous ${branding.lastFactAudit.skippedAmbiguous}`
                      : ""}
                  </p>
                  {(branding.lastFactAudit.skippedAmbiguousExamples?.length ??
                    0) > 0 ? (
                    <p className="mt-1 text-amber-950/85">
                      Ambiguous examples on file — review recommended (see
                      metadata if needed).
                    </p>
                  ) : null}
                </div>
              ) : null}
              <p className="mt-1 leading-relaxed text-ink-muted">
                {branding.subtitle || branding.summary || "—"}
              </p>
              {branding.notes?.trim() ? (
                <p className="mt-2 border-l-2 border-emerald-700/20 pl-2 text-ink-muted">
                  <span className="font-medium text-ink">Notes · </span>
                  {branding.notes}
                </p>
              ) : null}
            </div>
          </div>

          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-ink-muted">Last public refresh</dt>
              <dd className="font-medium text-ink">
                {formatWhen(
                  branding.lastScrapeAt ?? branding.lastWebsiteScrapeAt,
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Pages · facts · tags</dt>
              <dd className="font-medium text-ink">
                {branding.stats.websiteScrapePages} · {branding.stats.factsTotal}{" "}
                · {branding.stats.aiTags}
              </dd>
            </div>
            {branding.stats.claimsPromotedLastRun != null ? (
              <div>
                <dt className="text-ink-muted">Claims promoted (last run)</dt>
                <dd className="font-medium text-ink">
                  {branding.stats.claimsPromotedLastRun}
                  {branding.stats.vendorMappedLastRun
                    ? " · vendor linked"
                    : ""}
                </dd>
              </div>
            ) : null}
            {branding.logoCandidates.length > 0 && !branding.logoUrl ? (
              <div>
                <dt className="text-ink-muted">Logo candidates</dt>
                <dd className="text-ink">{branding.logoCandidates.length}</dd>
              </div>
            ) : null}
          </dl>

          {branding.aiTags.length > 0 ? (
            <div>
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {branding.aiTags.slice(0, 14).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-zinc-200/90 bg-white px-2.5 py-0.5 text-[0.7rem] text-ink shadow-sm"
                  >
                    {t.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {branding.serviceLines.length > 0 ? (
            <div>
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
                Service lines
              </p>
              <div className="flex flex-wrap gap-1.5">
                {branding.serviceLines.slice(0, 8).map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-emerald-800/15 bg-emerald-50/80 px-2.5 py-0.5 text-[0.7rem] text-ink"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {branding.capabilities.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink">
                Capabilities
              </p>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-ink-muted">
                {branding.capabilities.slice(0, 6).map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {branding.technologyReferences.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink">
                Technology
              </p>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-ink-muted">
                {branding.technologyReferences.slice(0, 6).map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {branding.contactBlocks.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink">
                Contacts (from pages)
              </p>
              <ul className="space-y-1.5 text-xs">
                {branding.contactBlocks.slice(0, 3).map((c) => (
                  <li
                    key={`${c.label}-${c.phone}`}
                    className="rounded-md border border-zinc-200/80 bg-white/90 px-3 py-2 text-ink-muted"
                  >
                    <span className="font-medium text-ink">{c.label}</span>
                    {c.address ? ` · ${c.address}` : null}
                    {c.phone ? ` · ${c.phone}` : null}
                    {c.email ? ` · ${c.email}` : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <details className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3">
        <summary className="cursor-pointer select-none text-sm font-medium text-ink">
          Advanced sourcing &amp; maintenance
        </summary>
        <div className="mt-4 space-y-5">
      <div className="grid gap-4 rounded-lg border border-zinc-200/80 bg-white/60 p-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-2 text-xs text-ink">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-zinc-300"
            checked={liveCrawl}
            onChange={(e) => setLiveCrawl(e.target.checked)}
            disabled={busy}
          />
          <span>
            <span className="font-medium text-ink">Live page fetch</span>
            <span className="mt-0.5 block text-ink-muted">
              Uncheck to reuse pages already in the database (faster re-AI only).
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-ink">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-zinc-300"
            checked={forceReparse}
            onChange={(e) => setForceReparse(e.target.checked)}
            disabled={busy}
          />
          <span>
            <span className="font-medium text-ink">Force re-parse (AI)</span>
            <span className="mt-0.5 block text-ink-muted">
              Re-runs extraction on each page and replaces only AllCare-managed
              fact rows for those pages—not your manual notes or other sources.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 text-xs text-ink sm:col-span-2">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-zinc-300"
            checked={runBackfill}
            onChange={(e) => setRunBackfill(e.target.checked)}
            disabled={busy}
          />
          <span>
            <span className="font-medium text-ink">Legacy fact metadata pass</span>
            <span className="mt-0.5 block text-ink-muted">
              Optional. Off by default — turn on to audit or repair credibility
              labels on stored facts (never runs unless you enable it here).
            </span>
          </span>
        </label>
        {runBackfill ? (
          <label className="block space-y-1.5 text-xs sm:col-span-2">
            <span className="font-medium text-ink-muted">Backfill mode</span>
            <select
              className="w-full max-w-md rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-ink"
              value={backfillMode}
              onChange={(e) =>
                setBackfillMode(e.target.value as AllCareLegacyFactBackfillMode)
              }
              disabled={busy}
            >
              <option value="fill-missing">
                Fill missing only (safest — empty fields)
              </option>
              <option value="audit-only">Audit only (no writes)</option>
              <option value="safe-correct">
                Safe correct (fill missing + narrow fixes)
              </option>
              <option value="moderate-correct">
                Moderate correct (opt-in — extra likely fixes; audit first)
              </option>
            </select>
          </label>
        ) : null}
        <label className="block space-y-1.5 text-xs">
          <span className="font-medium text-ink-muted">Max pages (optional)</span>
          <Input
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value)}
            placeholder="Default 20"
            disabled={busy}
            inputMode="numeric"
          />
        </label>
        <label className="block space-y-1.5 text-xs">
          <span className="font-medium text-ink-muted">Max depth (optional)</span>
          <Input
            value={maxDepth}
            onChange={(e) => setMaxDepth(e.target.value)}
            placeholder="Default 2"
            disabled={busy}
            inputMode="numeric"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy || !projectId.trim()}
          onClick={() =>
            withBusy(async () => {
              const r = await postScrapeAllCareSite({
                projectId: projectId.trim(),
                runAiParse: true,
                forceReparse,
                forceRecrawl: liveCrawl,
                maxPages: parseOptInt(maxPages),
                maxDepth: parseOptInt(maxDepth),
                runBackfill,
                backfillMode: runBackfill ? backfillMode : undefined,
              });
              setLastRun(r);
              const warn =
                r.errors.length > 0
                  ? ` · ${r.errors.length} parse warning(s)`
                  : "";
              setStatus(
                `Public refresh finished: ${r.pagesStored} page(s) stored, ${r.factsCreated} facts, ` +
                  `${r.tagsCreated} tags, ${r.claimsPromoted} vendor claim(s) promoted.` +
                  warn,
              );
              const b = await postGetBrandingProfile({
                projectId: projectId.trim(),
                ensureProfile: false,
              }).catch(() => null);
              if (b) setBranding(b.branding);
            })
          }
        >
          Refresh from public site
        </Button>
      </div>

      {lastRun && !lastRun.dryRun ? (
        <div className="rounded-lg border border-zinc-200/90 bg-zinc-50/50 px-4 py-3 text-xs text-ink-muted">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">
            Last run
          </p>
          {lastRun.schemaReady === false ? (
            <p className="mt-2 rounded border border-amber-200/80 bg-amber-50/80 px-2 py-1.5 text-[0.7rem] text-amber-950">
              Schema preflight: issues reported — apply DB migrations before relying
              on this refresh.
            </p>
          ) : null}
          <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <div className="flex justify-between gap-2">
              <dt>Discovered / fetched</dt>
              <dd className="text-ink">
                {lastRun.pagesDiscovered} / {lastRun.pagesFetched}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Skipped (robots / dup)</dt>
              <dd className="text-ink">
                {lastRun.pagesSkippedRobots} / {lastRun.pagesSkippedDuplicate}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Fetch errors</dt>
              <dd className="text-ink">{lastRun.pagesErrored}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>From cache</dt>
              <dd className="text-ink">{lastRun.pagesLoadedFromStore}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Logo discovery</dt>
              <dd className="text-ink">
                {lastRun.logoDiscovered ? "Yes" : "No"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Vendor mapping</dt>
              <dd className="text-ink">
                {lastRun.promotion.vendorMapped ? "Yes" : "No"}
              </dd>
            </div>
            {lastRun.qualityBand ? (
              <div className="flex justify-between gap-2 sm:col-span-2">
                <dt>Quality band</dt>
                <dd className="text-ink">{labelCase(lastRun.qualityBand)}</dd>
              </div>
            ) : null}
            {lastRun.qualityConfidence ? (
              <div className="flex justify-between gap-2 sm:col-span-2">
                <dt>Quality confidence</dt>
                <dd className="text-ink">{labelCase(lastRun.qualityConfidence)}</dd>
              </div>
            ) : null}
            {lastRun.qualityWarnings && lastRun.qualityWarnings.length > 0 ? (
              <div className="sm:col-span-2">
                <dt className="text-ink-muted">Notes</dt>
                <dd className="mt-0.5 text-ink">
                  {lastRun.qualityWarnings.slice(0, 2).join(" · ")}
                  {lastRun.qualityWarnings.length > 2 ? " · …" : ""}
                </dd>
              </div>
            ) : null}
            {lastRun.qualityExplanation ? (
              <div className="sm:col-span-2">
                <dt className="text-ink-muted">Quality summary</dt>
                <dd className="mt-0.5 text-ink">{lastRun.qualityExplanation}</dd>
              </div>
            ) : null}
            {lastRun.robotsOperatorNote ? (
              <div className="sm:col-span-2">
                <dt className="text-ink-muted">Robots</dt>
                <dd className="mt-0.5 text-ink">{lastRun.robotsOperatorNote}</dd>
              </div>
            ) : null}
            {lastRun.robotsReviewRecommended ? (
              <div className="sm:col-span-2">
                <dt className="text-ink-muted">Robots review</dt>
                <dd className="mt-0.5 text-amber-950/90">
                  {lastRun.robotsReviewReason?.trim() ||
                    "Practical robots matching — manual review recommended."}
                </dd>
              </div>
            ) : null}
            {lastRun.legacyFactAudit ? (
              <div className="sm:col-span-2">
                <dt className="text-ink-muted">Legacy fact pass</dt>
                <dd className="mt-0.5 text-ink">
                  {lastRun.legacyFactAudit.mode}: examined{" "}
                  {lastRun.legacyFactAudit.examined}, filled{" "}
                  {lastRun.legacyFactAudit.filledMissing}, corrected{" "}
                  {lastRun.legacyFactAudit.correctedValues}
                  {lastRun.legacyFactAudit.correctedSafeCount != null ||
                  lastRun.legacyFactAudit.correctedModerateCount != null ? (
                    <>
                      {" "}
                      (safe{" "}
                      {lastRun.legacyFactAudit.correctedSafeCount ?? "—"}, mod{" "}
                      {lastRun.legacyFactAudit.correctedModerateCount ?? "—"})
                    </>
                  ) : null}
                  , ambiguous skipped{" "}
                  {lastRun.legacyFactAudit.skippedAmbiguous}
                  {lastRun.legacyFactAudit.wouldFillMissing != null ? (
                    <>
                      {" "}
                      (would fill {lastRun.legacyFactAudit.wouldFillMissing})
                    </>
                  ) : null}
                  {(lastRun.legacyFactAudit.skippedAmbiguousExamples?.length ??
                    0) > 0 ? (
                    <span className="mt-1 block text-[0.65rem] text-amber-950/85">
                      Some ambiguous rows were skipped — review examples in
                      branding when loaded.
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : null}
            {lastRun.legacyFactsBackfilled != null &&
            lastRun.legacyFactsBackfilled > 0 ? (
              <div className="flex justify-between gap-2 sm:col-span-2">
                <dt>Legacy facts backfilled</dt>
                <dd className="text-ink">{lastRun.legacyFactsBackfilled}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}

        </div>
      </details>
    </Card>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { postVendorIntelligence } from "@/lib/functions-api";
import type { Vendor } from "@/types";

type WebsiteStatus = {
  websiteUrl: string;
  vendorDomain: string;
  websiteLastCrawledAt: string | null;
  websiteCrawlStatus: string;
  websiteCrawlError: string;
  pagesStored: number;
  runs: Array<{
    id: string;
    runType: string;
    status: string;
    summary: string;
    stats: Record<string, unknown>;
    createdAt: string;
  }>;
};

export function VendorWebsitePanel(props: {
  projectId: string;
  vendor: Vendor;
  onVendorPatch: (patch: Partial<Vendor>) => void;
}) {
  const [urlDraft, setUrlDraft] = useState(props.vendor.websiteUrl ?? "");
  const [manualUrl, setManualUrl] = useState("");
  const [status, setStatus] = useState<WebsiteStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setUrlDraft(props.vendor.websiteUrl ?? "");
  }, [props.vendor.websiteUrl, props.vendor.updatedAt]);

  const loadStatus = useCallback(async () => {
    setErr(null);
    try {
      const res = (await postVendorIntelligence({
        projectId: props.projectId,
        vendorId: props.vendor.id,
        action: "getVendorWebsiteStatus",
      })) as WebsiteStatus;
      setStatus(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load website status");
    }
  }, [props.projectId, props.vendor.id]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const saveUrl = async () => {
    setBusy("save");
    setMsg(null);
    setErr(null);
    try {
      const res = (await postVendorIntelligence({
        projectId: props.projectId,
        vendorId: props.vendor.id,
        action: "updateVendorWebsite",
        websiteUrl: urlDraft.trim(),
      })) as { vendor: Vendor };
      props.onVendorPatch({
        websiteUrl: res.vendor.websiteUrl,
        vendorDomain: res.vendor.vendorDomain,
        websiteLastCrawledAt: res.vendor.websiteLastCrawledAt,
        websiteCrawlStatus: res.vendor.websiteCrawlStatus,
        websiteCrawlError: res.vendor.websiteCrawlError,
      });
      setMsg("Website URL saved.");
      await loadStatus();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  const runSiteResearch = async () => {
    setBusy("crawl");
    setMsg(null);
    setErr(null);
    try {
      const res = (await postVendorIntelligence({
        projectId: props.projectId,
        vendorId: props.vendor.id,
        action: "runVendorWebsiteResearch",
        maxPages: 18,
        maxDepth: 2,
        forceRecrawl: true,
      })) as {
        pagesStored: number;
        claimsCreated: number;
        factsCreated: number;
        warnings: string[];
        vendor: Vendor;
      };
      props.onVendorPatch({
        websiteUrl: res.vendor.websiteUrl,
        vendorDomain: res.vendor.vendorDomain,
        websiteLastCrawledAt: res.vendor.websiteLastCrawledAt,
        websiteCrawlStatus: res.vendor.websiteCrawlStatus,
        websiteCrawlError: res.vendor.websiteCrawlError,
      });
      setMsg(
        `Crawl complete — ${res.pagesStored} page(s) stored, ${res.claimsCreated} claim(s), ${res.factsCreated} fact row(s).`,
      );
      if (res.warnings?.length) {
        setMsg((m) => `${m} Warnings: ${res.warnings.slice(0, 3).join("; ")}`);
      }
      await loadStatus();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Crawl failed");
      await loadStatus();
    } finally {
      setBusy(null);
    }
  };

  const runManualIngest = async () => {
    const u = manualUrl.trim();
    if (!u) {
      setErr("Enter a URL to ingest.");
      return;
    }
    setBusy("manual");
    setErr(null);
    try {
      const res = (await postVendorIntelligence({
        projectId: props.projectId,
        vendorId: props.vendor.id,
        action: "ingestVendorManualUrl",
        manualUrl: u,
      })) as { claimsCreated: number; factsCreated: number; vendor: Vendor };
      props.onVendorPatch({
        websiteUrl: res.vendor.websiteUrl,
        vendorDomain: res.vendor.vendorDomain,
        websiteLastCrawledAt: res.vendor.websiteLastCrawledAt,
        websiteCrawlStatus: res.vendor.websiteCrawlStatus,
        websiteCrawlError: res.vendor.websiteCrawlError,
      });
      setMsg(
        `Ingested URL — ${res.claimsCreated} claim(s), ${res.factsCreated} fact(s). Fit/score refreshed.`,
      );
      setManualUrl("");
      await loadStatus();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ingest failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-muted">
        Crawls stay on the vendor&apos;s public domain, respect robots.txt, and rate-limit
        requests. Claims and facts are vendor-sourced — treat confidence conservatively.
      </p>

      {err ? <p className="text-sm text-amber-800">{err}</p> : null}
      {msg ? <p className="text-sm text-ink">{msg}</p> : null}

      <div className="rounded-lg border border-border bg-surface-raised p-3 space-y-3">
        <h3 className="text-sm font-semibold text-ink">Primary website</h3>
        <label className="block space-y-1">
          <span className="text-xs text-ink-muted">URL (https recommended)</span>
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://vendor.example.com"
            className="font-mono text-sm"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy !== null}
            onClick={() => void saveUrl()}
          >
            {busy === "save" ? "Saving…" : "Save URL"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null || !urlDraft.trim()}
            onClick={() => void runSiteResearch()}
          >
            {busy === "crawl" ? "Running…" : "Run website research (crawl + AI)"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-3 space-y-2">
        <h3 className="text-sm font-semibold text-ink">Manual URL ingest</h3>
        <p className="text-xs text-ink-muted">
          For a single docs page, PDF landing page, or off-domain case study — same extraction
          pipeline as search ingest.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://…"
            className="min-w-[200px] flex-1 font-mono text-sm"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null}
            onClick={() => void runManualIngest()}
          >
            {busy === "manual" ? "Ingesting…" : "Ingest URL"}
          </Button>
        </div>
      </div>

      {status ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs space-y-2">
          <h3 className="text-sm font-semibold text-ink">Status</h3>
          <dl className="grid gap-1 sm:grid-cols-2">
            <div>
              <dt className="text-ink-subtle">Domain</dt>
              <dd className="text-ink">{status.vendorDomain || "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Vendor site pages stored</dt>
              <dd className="text-ink">{status.pagesStored}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Last crawl</dt>
              <dd className="text-ink">
                {status.websiteLastCrawledAt
                  ? new Date(status.websiteLastCrawledAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Crawl status</dt>
              <dd className="text-ink">{status.websiteCrawlStatus || "—"}</dd>
            </div>
          </dl>
          {status.websiteCrawlError ? (
            <p className="text-amber-900">
              <span className="font-medium">Last error:</span> {status.websiteCrawlError}
            </p>
          ) : null}

          <div className="pt-2 border-t border-border">
            <p className="font-medium text-ink mb-1">Recent research runs</p>
            {status.runs.length === 0 ? (
              <p className="text-ink-muted">No runs yet.</p>
            ) : (
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {status.runs.map((r) => (
                  <li key={r.id} className="text-ink-muted">
                    <span className="text-ink">{r.runType}</span> · {r.status} —{" "}
                    {r.summary.slice(0, 120)}
                    <span className="text-ink-subtle">
                      {" "}
                      ({new Date(r.createdAt).toLocaleString()})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      <Button type="button" variant="secondary" onClick={() => void loadStatus()}>
        Refresh status
      </Button>
    </div>
  );
}

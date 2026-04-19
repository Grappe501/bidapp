import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { VendorCapabilityList } from "@/components/vendors/VendorCapabilityList";
import { VendorMetadataCard } from "@/components/vendors/VendorMetadataCard";
import { VendorRiskList } from "@/components/vendors/VendorRiskList";
import { useArchitecture } from "@/context/useArchitecture";
import { useProjectWorkspace } from "@/context/project-workspace-context";
import { useVendors } from "@/context/useVendors";
import { useWorkspace } from "@/context/useWorkspace";
import { postVendorIntelligence } from "@/lib/functions-api";
import { architectureOptionsUsingVendor } from "@/lib/architecture-utils";
import {
  VENDOR_FIT_SCORES,
  VENDOR_STATUSES,
  type GroundingBundleVendorIntelligence,
  type VendorFitScore,
  type VendorStatus,
} from "@/types";

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

type TabId =
  | "overview"
  | "evidence"
  | "fit"
  | "integration"
  | "risk"
  | "interview"
  | "compare";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "evidence", label: "Evidence" },
  { id: "fit", label: "Fit" },
  { id: "integration", label: "Integration" },
  { id: "risk", label: "Risk" },
  { id: "interview", label: "Interview prep" },
  { id: "compare", label: "Compare" },
];

export function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { vendors, updateVendor } = useVendors();
  const { files } = useWorkspace();
  const { options } = useArchitecture();
  const { projectId, loading: wsLoading, error: wsError } = useProjectWorkspace();
  const vendor = vendors.find((v) => v.id === vendorId);

  const [tab, setTab] = useState<TabId>("overview");
  const [snapshot, setSnapshot] = useState<GroundingBundleVendorIntelligence | null>(
    null,
  );
  const [intelError, setIntelError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    if (!projectId || !vendorId) return;
    setIntelError(null);
    try {
      const res = (await postVendorIntelligence({
        projectId,
        vendorId,
        action: "getSnapshot",
      })) as { snapshot: GroundingBundleVendorIntelligence | null };
      setSnapshot(res.snapshot);
    } catch (e) {
      setIntelError(e instanceof Error ? e.message : "Failed to load intelligence");
      setSnapshot(null);
    }
  }, [projectId, vendorId]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const archUsing = useMemo(
    () => (vendor ? architectureOptionsUsingVendor(options, vendor.id) : []),
    [options, vendor],
  );

  const sourceFiles = useMemo(() => {
    if (!vendor) return [];
    return vendor.sourceFileIds
      .map((id) => files.find((f) => f.id === id))
      .filter(Boolean) as typeof files;
  }, [vendor, files]);

  const runAction = async (
    label: string,
    action: Parameters<typeof postVendorIntelligence>[0]["action"],
  ) => {
    if (!projectId || !vendorId) return;
    setBusy(label);
    setActionMsg(null);
    try {
      const res = await postVendorIntelligence({ projectId, vendorId, action });
      setActionMsg(JSON.stringify(res, null, 0).slice(0, 1200));
      await loadSnapshot();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  if (!vendorId || !vendor) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-xl font-semibold text-ink">Vendor not found</h1>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/vendors")}
          >
            Back to directory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/vendors")}
          >
            ← Directory
          </Button>
          <Link to="/vendors/compare">
            <Button type="button" variant="secondary">
              Comparison workspace
            </Button>
          </Link>
        </div>

        <VendorMetadataCard vendor={vendor} />

        {wsError ? (
          <p className="text-sm text-amber-800">{wsError}</p>
        ) : null}
        {wsLoading ? (
          <p className="text-xs text-ink-muted">Loading workspace…</p>
        ) : null}
        {intelError ? (
          <p className="text-sm text-amber-800">{intelError}</p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                tab === t.id
                  ? "bg-ink text-white"
                  : "bg-slate-100 text-ink-muted hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            <Card className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">Automated pipeline</h2>
              <p className="text-xs text-ink-muted">
                Uses stored sources and claims — configure SERPER_API_KEY for live search
                on research runs.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!projectId || busy !== null}
                  onClick={() => void runAction("research", "runResearch")}
                >
                  {busy === "research" ? "Running…" : "Run research job"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!projectId || busy !== null}
                  onClick={() => void runAction("fit", "computeFit")}
                >
                  {busy === "fit" ? "Computing…" : "Compute fit"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!projectId || busy !== null}
                  onClick={() => void runAction("score", "computeScore")}
                >
                  {busy === "score" ? "Scoring…" : "Compute score"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!projectId || busy !== null}
                  onClick={() =>
                    void runAction("interview", "generateInterview")
                  }
                >
                  {busy === "interview" ? "Generating…" : "Generate interview Qs"}
                </Button>
              </div>
              {actionMsg ? (
                <pre className="max-h-40 overflow-auto rounded bg-slate-50 p-2 text-[10px] text-ink-muted">
                  {actionMsg}
                </pre>
              ) : null}
            </Card>

            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-ink">Strengths & gaps</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
                    Strengths
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-muted">
                    {vendor.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
                    Weaknesses
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-muted">
                    {vendor.weaknesses.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <VendorRiskList risks={vendor.risks} />
            </Card>

            <Card className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">Capability statements</h2>
              <VendorCapabilityList capabilities={vendor.capabilities} />
            </Card>

            <Card className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">Source materials</h2>
              <p className="text-sm text-ink-muted">
                Linked file records in the workspace.
              </p>
              {sourceFiles.length === 0 ? (
                <p className="text-sm text-ink-muted">No files linked.</p>
              ) : (
                <ul className="space-y-2">
                  {sourceFiles.map((f) => (
                    <li key={f.id}>
                      <Link
                        to={`/files/${f.id}`}
                        className="text-sm font-medium text-ink underline-offset-4 hover:underline"
                      >
                        {f.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="space-y-3">
              <h2 className="text-sm font-semibold text-ink">Architecture usage</h2>
              <p className="text-sm text-ink-muted">
                Stack options that reference this vendor.
              </p>
              {archUsing.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  Not assigned in any architecture option yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {archUsing.map((o) => (
                    <li key={o.id}>
                      <Link
                        to="/architecture"
                        className="text-sm font-medium text-ink underline-offset-4 hover:underline"
                      >
                        {o.name}
                      </Link>
                      {o.recommended ? (
                        <span className="ml-2 text-xs text-ink-subtle">
                          (recommended)
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="space-y-4">
              <h2 className="text-sm font-semibold text-ink">Edit strategic record</h2>
              <form
                key={vendor.updatedAt}
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  updateVendor(vendor.id, {
                    status: String(fd.get("status")) as VendorStatus,
                    fitScore: Number(fd.get("fitScore")) as VendorFitScore,
                    summary: String(fd.get("summary") ?? ""),
                    pricingNotes: String(fd.get("pricingNotes") ?? ""),
                    notes: String(fd.get("notes") ?? ""),
                    likelyStackRole: String(fd.get("likelyStackRole") ?? ""),
                    strengths: linesToArray(String(fd.get("strengths") ?? "")),
                    weaknesses: linesToArray(String(fd.get("weaknesses") ?? "")),
                    risks: linesToArray(String(fd.get("risks") ?? "")),
                  });
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-ink-muted">Status</span>
                    <Select name="status" defaultValue={vendor.status}>
                      {VENDOR_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-ink-muted">
                      Fit score (1–5)
                    </span>
                    <Select
                      name="fitScore"
                      defaultValue={String(vendor.fitScore)}
                    >
                      {VENDOR_FIT_SCORES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">Summary</span>
                  <Textarea name="summary" rows={4} defaultValue={vendor.summary} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">
                    Pricing notes
                  </span>
                  <Textarea
                    name="pricingNotes"
                    rows={3}
                    defaultValue={vendor.pricingNotes}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">Notes</span>
                  <Textarea name="notes" rows={3} defaultValue={vendor.notes} />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">
                    Strengths (one per line)
                  </span>
                  <Textarea
                    name="strengths"
                    rows={4}
                    defaultValue={vendor.strengths.join("\n")}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">
                    Weaknesses (one per line)
                  </span>
                  <Textarea
                    name="weaknesses"
                    rows={4}
                    defaultValue={vendor.weaknesses.join("\n")}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">
                    Risks (one per line)
                  </span>
                  <Textarea
                    name="risks"
                    rows={3}
                    defaultValue={vendor.risks.join("\n")}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-ink-muted">
                    Likely stack role
                  </span>
                  <Input
                    name="likelyStackRole"
                    defaultValue={vendor.likelyStackRole}
                  />
                </label>
                <div className="flex justify-end">
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            </Card>
          </>
        )}

        {tab === "evidence" && (
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">Claims & sourced facts</h2>
            {!snapshot ? (
              <p className="text-sm text-ink-muted">No snapshot loaded.</p>
            ) : (
              <>
                <div>
                  <h3 className="text-xs font-medium text-ink-subtle">Vendor claims</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-muted">
                    {snapshot.vendorClaims.slice(0, 24).map((c) => (
                      <li key={c.id}>
                        {c.claimText}{" "}
                        <span className="text-ink-subtle">
                          ({c.confidence || "—"} / {c.credibility || "—"})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-ink-subtle">
                    Intelligence facts (vendor-tagged sources)
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-muted">
                    {snapshot.intelligenceFacts.slice(0, 24).map((f) => (
                      <li key={f.id}>
                        <span className="font-medium text-ink">{f.factType}:</span>{" "}
                        {f.factText.slice(0, 280)}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </Card>
        )}

        {tab === "fit" && (
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">Fit matrix</h2>
            {!snapshot || snapshot.fitDimensions.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Run compute fit after research to populate dimensions.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {snapshot.fitDimensions.map((d) => (
                  <li
                    key={d.dimensionKey}
                    className="rounded border border-border p-2"
                  >
                    <span className="font-medium text-ink">{d.dimensionKey}</span> —{" "}
                    score {d.score}{" "}
                    <span className="text-ink-subtle">({d.confidence})</span>
                    <p className="mt-1 text-xs text-ink-muted">{d.rationale}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === "integration" && (
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">Integration requirements</h2>
            {!snapshot || snapshot.integrationRequirements.length === 0 ? (
              <p className="text-sm text-ink-muted">No integration rows yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {snapshot.integrationRequirements.map((r) => (
                  <li key={r.requirementKey} className="rounded border border-border p-2">
                    <span className="font-medium text-ink">{r.requirementKey}</span> —{" "}
                    {r.status}
                    <p className="mt-1 text-xs text-ink-muted">{r.evidence}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === "risk" && (
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">Risk signals</h2>
            <VendorRiskList risks={vendor.risks} />
            {snapshot ? (
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-muted">
                {snapshot.intelligenceFacts
                  .filter((f) => f.factType.includes("risk"))
                  .slice(0, 12)
                  .map((f) => (
                    <li key={f.id}>{f.factText.slice(0, 240)}</li>
                  ))}
              </ul>
            ) : null}
          </Card>
        )}

        {tab === "interview" && (
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">Interview prep</h2>
            {!snapshot || snapshot.interviewQuestions.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Generate interview questions after fit/scoring to target gaps.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {snapshot.interviewQuestions.map((q, i) => (
                  <li key={i} className="rounded border border-border p-2">
                    <span className="text-xs font-medium text-ink-subtle">
                      {q.category} · {q.priority}
                    </span>
                    <p className="mt-1 text-ink">{q.question}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === "compare" && (
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-ink">Compare vendors</h2>
            <p className="text-sm text-ink-muted">
              Open the comparison workspace to score vendors side-by-side. Intelligence
              rows above are per-vendor; export from Output center includes comparison
              notes when multiple vendors have data.
            </p>
            <Link to="/vendors/compare">
              <Button type="button">Open comparison workspace</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}

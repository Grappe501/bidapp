import { useMemo } from "react";
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
import { useVendors } from "@/context/useVendors";
import { useWorkspace } from "@/context/useWorkspace";
import { architectureOptionsUsingVendor } from "@/lib/architecture-utils";
import {
  VENDOR_FIT_SCORES,
  VENDOR_STATUSES,
  type VendorFitScore,
  type VendorStatus,
} from "@/types";

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { vendors, updateVendor } = useVendors();
  const { files } = useWorkspace();
  const { options } = useArchitecture();
  const vendor = vendors.find((v) => v.id === vendorId);

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
            Linked file records in the workspace (ingest automation in a later
            phase).
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
      </div>
    </div>
  );
}

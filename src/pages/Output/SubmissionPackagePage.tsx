import { ExportActionBar } from "@/components/output/ExportActionBar";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { PackageArtifactCard } from "@/components/output/PackageArtifactCard";
import { PackageChecklist } from "@/components/output/PackageChecklist";
import { Card } from "@/components/ui/Card";
import { useOutput } from "@/context/useOutput";
import { bundleArtifactIds } from "@/lib/output-utils";

export function SubmissionPackagePage() {
  const {
    artifacts,
    copyChecklistSummary,
    copyReadinessSummary,
    copySectionPlainText,
    bundles,
    copyBundleJson,
  } = useOutput();

  const subBundle = bundles.find((b) => b.bundleType === "Submission Package");
  const subIds = new Set(bundleArtifactIds("Submission Package", artifacts));
  const packageArtifacts = artifacts.filter((a) => subIds.has(a.id));

  const missingRequired = packageArtifacts.filter(
    (a) => a.requiredForSubmission && a.status === "Draft",
  );
  const notValidated = packageArtifacts.filter(
    (a) => a.requiredForSubmission && !a.isValidated,
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <OutputSubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Submission package assembly
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Checklist mirrors solicitation expectations. Status flows from bid control
            and drafting — copy clean text for manual ARBuy upload.
          </p>
        </div>

        <ExportActionBar
          actions={[
            { label: "Copy checklist (markdown)", onClick: copyChecklistSummary },
            { label: "Copy readiness summary", onClick: copyReadinessSummary },
            ...(subBundle
              ? [
                  {
                    label: "Copy submission bundle (JSON)",
                    onClick: () => copyBundleJson(subBundle.id),
                  },
                ]
              : []),
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-ink">Packaging state</h2>
            <ul className="mt-3 space-y-2 text-xs text-ink-muted">
              <li>
                <span className="font-medium text-ink">Missing required: </span>
                {missingRequired.length
                  ? missingRequired.map((m) => m.title).join(", ")
                  : "None flagged at Draft status."}
              </li>
              <li>
                <span className="font-medium text-ink">Not validated: </span>
                {notValidated.length
                  ? notValidated.map((m) => m.title).join(", ")
                  : "All required items validated or on track."}
              </li>
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-ink">Narrative quick copy</h2>
            <p className="mt-2 text-xs text-ink-muted">
              Copies active draft body only (no metadata wrapper).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Experience", "Solution", "Risk"].map((label) => {
                const art = packageArtifacts.find(
                  (a) => a.artifactType === "Draft Section" && a.notes === label,
                );
                if (!art) return null;
                return (
                  <button
                    key={label}
                    type="button"
                    className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs font-medium text-ink hover:bg-zinc-50"
                    onClick={() => copySectionPlainText(art.sourceEntityId)}
                  >
                    Copy {label}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Solicitation checklist</h2>
          <div className="mt-3">
            <PackageChecklist artifacts={artifacts} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ink">Artifacts in this package</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {packageArtifacts.map((a) => (
              <PackageArtifactCard key={a.id} artifact={a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

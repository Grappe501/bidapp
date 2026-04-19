import { BidControlNav } from "@/components/control/BidControlNav";
import { AllCareBrandingDemoPanel } from "@/components/intelligence/AllCareBrandingDemoPanel";
import { AllCareBrandingPanel } from "@/components/intelligence/AllCareBrandingPanel";
import { DbUrlIngestPanel } from "@/components/intelligence/DbUrlIngestPanel";
import { IntelligenceBackendTools } from "@/components/intelligence/IntelligenceBackendTools";
import { CompanyProfileCard } from "@/components/intelligence/CompanyProfileCard";
import {
  IntelligenceIngestHistory,
  IntelligenceIngestPanel,
} from "@/components/intelligence/IntelligenceIngestPanel";
import { Card } from "@/components/ui/Card";
import { useDemoMode } from "@/context/demo-mode-context";
import { useIntelligence } from "@/context/useIntelligence";

export function IntelligencePage() {
  const { profiles, ingestEntries, addIngestEntry, updateProfileSummary } =
    useIntelligence();
  const { isDemoMode } = useDemoMode();

  if (isDemoMode) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <BidControlNav variant="intelligence-only" />

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              AllCare operational profile
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
              A structured view of how this workspace understands{" "}
              <span className="font-medium text-ink">AllCare Pharmacy</span> for the
              DHS HDCs solicitation — capabilities, services, and technology signals
              that inform proposal strategy and review.
            </p>
          </div>

          <Card className="border-slate-200/90 bg-slate-50/60 px-4 py-3 text-sm text-slate-700">
            Arkansas DHS is the evaluation authority. Buyer context comes from your
            solicitation library and requirements — vendor rows are for partner
            positioning, not agency profiling.
          </Card>

          <AllCareBrandingDemoPanel />

          <div className="space-y-6">
            {profiles.map((p) => (
              <CompanyProfileCard
                key={p.id}
                profile={p}
                onSaveSummary={(summary) => updateProfileSummary(p.id, summary)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <BidControlNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Company intelligence layer
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Structured knowledge for Malone and named vendors—optimized for future
            automated ingestion. Today: manual paste, URL capture, and
            classification into capabilities, risks, claims, and integration
            notes.
          </p>
        </div>

        <Card className="border-zinc-800/10 bg-zinc-50/80 px-4 py-3 text-sm text-ink-muted">
          Arkansas DHS remains the evaluation authority—profile the buyer through
          solicitation artifacts and amendment history in Files / Requirements,
          not as a vendor row.
        </Card>

        <IntelligenceIngestPanel profiles={profiles} onIngest={addIngestEntry} />

        <AllCareBrandingPanel />

        <DbUrlIngestPanel />

        <IntelligenceBackendTools />

        <IntelligenceIngestHistory entries={ingestEntries} />

        <div className="space-y-6">
          {profiles.map((p) => (
            <CompanyProfileCard
              key={p.id}
              profile={p}
              onSaveSummary={(summary) => updateProfileSummary(p.id, summary)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

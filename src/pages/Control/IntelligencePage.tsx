import { BidControlNav } from "@/components/control/BidControlNav";
import { RfpExpectationsPanel } from "@/components/rfp/RfpExpectationsPanel";
import { AllCareBrandingPanel } from "@/components/intelligence/AllCareBrandingPanel";
import { DbUrlIngestPanel } from "@/components/intelligence/DbUrlIngestPanel";
import { IntelligenceBackendTools } from "@/components/intelligence/IntelligenceBackendTools";
import { CompanyProfileCard } from "@/components/intelligence/CompanyProfileCard";
import {
  IntelligenceIngestHistory,
  IntelligenceIngestPanel,
} from "@/components/intelligence/IntelligenceIngestPanel";
import { Card } from "@/components/ui/Card";
import { useIntelligence } from "@/context/useIntelligence";
import { useWorkspace } from "@/context/useWorkspace";

export function IntelligencePage() {
  const { project } = useWorkspace();
  const { profiles, ingestEntries, addIngestEntry, updateProfileSummary } =
    useIntelligence();

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <BidControlNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            AllCare company intelligence
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            Company profile, operational capabilities, and supporting signals for
            this solicitation — grounded in your controlled sources and the live
            AllCare profile below.
          </p>
        </div>

        <Card className="border-slate-200/90 bg-slate-50/60 px-4 py-3 text-sm text-slate-700">
          Arkansas DHS is the evaluation authority. Buyer context comes from your
          solicitation library and requirements — vendor rows are for partner
          positioning, not agency profiling.
        </Card>

        <RfpExpectationsPanel project={project} />

        <AllCareBrandingPanel />

        <div className="space-y-6">
          {profiles.map((p) => (
            <CompanyProfileCard
              key={p.id}
              profile={p}
              onSaveSummary={(summary) => updateProfileSummary(p.id, summary)}
            />
          ))}
        </div>

        <details className="rounded-lg border border-zinc-200/80 bg-zinc-50/40 p-1">
          <summary className="cursor-pointer select-none rounded-md px-3 py-2 text-sm font-medium text-ink">
            Supporting intelligence &amp; ingestion tools
          </summary>
          <div className="space-y-6 px-2 pb-4 pt-2">
            <IntelligenceIngestPanel profiles={profiles} onIngest={addIngestEntry} />
            <DbUrlIngestPanel />
            <IntelligenceBackendTools />
            <IntelligenceIngestHistory entries={ingestEntries} />
          </div>
        </details>
      </div>
    </div>
  );
}

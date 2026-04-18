import { BidControlNav } from "@/components/control/BidControlNav";
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

export function IntelligencePage() {
  const { profiles, ingestEntries, addIngestEntry, updateProfileSummary } =
    useIntelligence();

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

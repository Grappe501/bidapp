import { BidControlNav } from "@/components/control/BidControlNav";
import { ContractClauseCard } from "@/components/control/ContractClauseCard";
import { ContractRiskCard } from "@/components/control/ContractRiskCard";
import { RedactionPanel } from "@/components/control/RedactionPanel";
import { Card } from "@/components/ui/Card";
import { useControl } from "@/context/useControl";
import { CANONICAL_SRV1_CONTRACT } from "@/data/canonical-srv1-contract";
import type { ContractClause, ContractRisk } from "@/types";

export function ContractPage() {
  const { redactionFlags, updateRedactionFlag, addRedactionFlag } = useControl();
  const contractRisks: ContractRisk[] = [];
  const contractClauses: ContractClause[] = [];

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-10">
        <BidControlNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Contract awareness & FOIA posture
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
            What you propose becomes enforceable. Map SRV-1-style service
            expectations and flow-down risk before narrative hardens. Track
            redaction and public-disclosure exposure alongside substantive
            contract risk.
          </p>
        </div>

        <Card className="space-y-3 border border-emerald-900/10 bg-emerald-50/30 p-5">
          <h2 className="text-sm font-semibold text-ink">SRV-1 structured model (system)</h2>
          <p className="text-xs text-ink-muted">
            Canonical term: <span className="font-medium text-ink">{CANONICAL_SRV1_CONTRACT.term.baseYears}y</span> base /{" "}
            <span className="font-medium text-ink">{CANONICAL_SRV1_CONTRACT.term.maxYears}y</span> max · Scope &amp; performance
            statements required · Payment requires defined rates + calculations.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 text-xs text-ink-muted">
            <div>
              <p className="font-medium text-ink">Termination</p>
              <ul className="mt-1 list-inside list-disc">
                {CANONICAL_SRV1_CONTRACT.terminationClauses.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-ink">SRV-1 compliance</p>
              <ul className="mt-1 list-inside list-disc">
                {CANONICAL_SRV1_CONTRACT.complianceRequirements.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">Binding risk register</h2>
          {contractRisks.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-zinc-50/60 px-4 py-6 text-sm text-ink-muted">
              No contract risks are loaded for this project yet. Add them from your
              source documents or intelligence pipeline when available.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {contractRisks.map((r) => (
                <ContractRiskCard
                  key={r.id}
                  category={r.category}
                  description={r.description}
                  severity={r.severity}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">
            Clause lens — proposal exposure
          </h2>
          <p className="text-xs text-ink-muted">
            Live article citations from the awarded draft should appear here when
            ingested. Use this to force alignment between volumes and future SRV-1
            obligations.
          </p>
          {contractClauses.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-zinc-50/60 px-4 py-6 text-sm text-ink-muted">
              No clause lens rows loaded for this project.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {contractClauses.map((c) => (
                <ContractClauseCard
                  key={c.id}
                  reference={c.reference}
                  title={c.title}
                  obligationSummary={c.obligationSummary}
                  proposalExposure={c.proposalExposure}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">
            Redaction & FOIA tracking
          </h2>
          <RedactionPanel
            flags={redactionFlags}
            onUpdate={updateRedactionFlag}
            onAdd={addRedactionFlag}
          />
        </section>
      </div>
    </div>
  );
}

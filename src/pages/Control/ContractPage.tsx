import { BidControlNav } from "@/components/control/BidControlNav";
import { ContractClauseCard } from "@/components/control/ContractClauseCard";
import { ContractRiskCard } from "@/components/control/ContractRiskCard";
import { RedactionPanel } from "@/components/control/RedactionPanel";
import { useControl } from "@/context/useControl";
import {
  MOCK_CONTRACT_CLAUSES,
  MOCK_CONTRACT_RISKS,
} from "@/data/mockContractRisks";

export function ContractPage() {
  const { redactionFlags, updateRedactionFlag, addRedactionFlag } = useControl();

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

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">Binding risk register</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {MOCK_CONTRACT_RISKS.map((r) => (
              <ContractRiskCard
                key={r.id}
                category={r.category}
                description={r.description}
                severity={r.severity}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">
            Clause lens — proposal exposure
          </h2>
          <p className="text-xs text-ink-muted">
            Illustrative references; replace with live article citations from the
            awarded draft. Use this to force alignment between volumes and future
            SRV-1 obligations.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {MOCK_CONTRACT_CLAUSES.map((c) => (
              <ContractClauseCard
                key={c.id}
                reference={c.reference}
                title={c.title}
                obligationSummary={c.obligationSummary}
                proposalExposure={c.proposalExposure}
              />
            ))}
          </div>
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

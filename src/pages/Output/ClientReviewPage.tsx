import { ClientReviewSection } from "@/components/output/ClientReviewSection";
import { ClientReviewSummaryCard } from "@/components/output/ClientReviewSummaryCard";
import { OutputSubNav } from "@/components/output/OutputSubNav";
import { useArchitecture } from "@/context/useArchitecture";
import { useDrafting } from "@/context/useDrafting";
import { useOutput } from "@/context/useOutput";
import { useControl } from "@/context/useControl";
import { useVendors } from "@/context/useVendors";
import { activeIssues } from "@/lib/review-utils";

export function ClientReviewPage() {
  const { project, readiness, reviewIssues, reviewSnapshot } = useOutput();
  const { options } = useArchitecture();
  const { vendors } = useVendors();
  const { getActiveVersion } = useDrafting();
  const { submissionItems } = useControl();

  const recommended = options.find((o) => o.recommended);
  const primaryVendors = vendors.filter(
    (v) => v.category === "Primary Platform" || v.fitScore >= 4,
  );

  const req = submissionItems.filter((s) => s.required && s.phase === "Proposal");
  const ok = req.filter((s) => s.status === "Ready" || s.status === "Validated").length;
  const submissionProgressLabel = `${ok} of ${req.length} required proposal items ready or validated`;

  const act = activeIssues(reviewIssues);
  const majorRiskTeaser =
    act.find((i) => i.severity === "Critical")?.title ??
    "No critical review flags — still validate contract exposure and integration claims before client readout.";

  const sectionBody = (sectionType: string) => {
    const sec = reviewSnapshot.draftSections.find((s) => s.sectionType === sectionType);
    if (!sec) return "—";
    const v = getActiveVersion(sec.id);
    const t = v?.content?.trim();
    return t && t.length > 0 ? t : "Section not drafted yet.";
  };

  const unresolvedTop = act
    .filter((i) => i.severity === "High" || i.severity === "Critical")
    .slice(0, 6);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <OutputSubNav />

        <ClientReviewSummaryCard
          bidNumber={project.bidNumber}
          projectTitle={project.title}
          readiness={readiness}
          recommendedOption={recommended}
          primaryVendors={primaryVendors}
          submissionProgressLabel={submissionProgressLabel}
          majorRiskTeaser={majorRiskTeaser}
        />

        <ClientReviewSection title="Executive positioning" kicker="Narrative">
          <p className="whitespace-pre-wrap text-ink-muted">
            {sectionBody("Executive Summary")}
          </p>
        </ClientReviewSection>

        <ClientReviewSection title="Experience" kicker="Scored volume">
          <p className="whitespace-pre-wrap text-ink-muted">
            {sectionBody("Experience")}
          </p>
        </ClientReviewSection>

        <ClientReviewSection title="Solution" kicker="Scored volume">
          <p className="whitespace-pre-wrap text-ink-muted">
            {sectionBody("Solution")}
          </p>
        </ClientReviewSection>

        <ClientReviewSection title="Risk" kicker="Scored volume">
          <p className="whitespace-pre-wrap text-ink-muted">
            {sectionBody("Risk")}
          </p>
        </ClientReviewSection>

        <ClientReviewSection title="Architecture recommendation" kicker="Strategy">
          <p className="whitespace-pre-wrap text-ink-muted">
            {recommended
              ? `${recommended.name}\n\n${recommended.summary}`
              : "Select a recommended option in the architecture workspace."}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-ink-muted">
            {sectionBody("Architecture Narrative")}
          </p>
        </ClientReviewSection>

        <ClientReviewSection title="Key unresolved items" kicker="Review">
          {unresolvedTop.length ? (
            <ul className="list-inside list-disc space-y-1 text-ink-muted">
              {unresolvedTop.map((i) => (
                <li key={i.id} className="text-sm">
                  {i.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">
              No high-severity open items. Confirm submission checklist and redaction
              posture before external sharing.
            </p>
          )}
        </ClientReviewSection>

        <ClientReviewSection title="Readiness snapshot" kicker="Metrics">
          <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
            {(
              [
                ["Overall", readiness.overall],
                ["Submission", readiness.submission],
                ["Coverage", readiness.coverage],
                ["Grounding", readiness.grounding],
                ["Scoring fit", readiness.scoring_alignment],
                ["Contract", readiness.contract_readiness],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-ink-subtle">{k}</dt>
                <dd className="font-semibold tabular-nums text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </ClientReviewSection>
      </div>
    </div>
  );
}

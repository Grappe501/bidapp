import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { BidControlNav } from "@/components/control/BidControlNav";
import { ConstraintWarning } from "@/components/drafting/ConstraintWarning";
import { CoveragePanel } from "@/components/drafting/CoveragePanel";
import { DraftEditor } from "@/components/drafting/DraftEditor";
import { DraftGeneratorPanel } from "@/components/drafting/DraftGeneratorPanel";
import { DraftMetadataCard } from "@/components/drafting/DraftMetadataCard";
import { DraftVersionList } from "@/components/drafting/DraftVersionList";
import { GroundingBundleSelector } from "@/components/drafting/GroundingBundleSelector";
import { ScoringFeedbackCard } from "@/components/drafting/ScoringFeedbackCard";
import { SectionStrategyPanel } from "@/components/drafting/SectionStrategyPanel";
import { Card } from "@/components/ui/Card";
import { useDrafting } from "@/context/useDrafting";
import { SECTION_FOCUS } from "@/lib/drafting-utils";

export function DraftSectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const {
    getSection,
    getVersionsForSection,
    getActiveVersion,
    getSelectedBundle,
    setSelectedBundle,
    saveNewVersion,
    setActiveVersion,
    updateActiveContent,
    updateSectionStatus,
  } = useDrafting();

  const apiProjectId =
    (import.meta.env.VITE_DEFAULT_PROJECT_ID as string | undefined) ?? "";

  const section = sectionId ? getSection(sectionId) : undefined;
  const versions = sectionId ? getVersionsForSection(sectionId) : [];
  const active = sectionId ? getActiveVersion(sectionId) : undefined;
  const bundle = sectionId ? getSelectedBundle(sectionId) : null;

  const content = active?.content ?? "";
  const metadata = active?.metadata ?? null;

  const layout = useMemo(
    () => ({
      max: section ? SECTION_FOCUS[section.sectionType].maxPages : 2,
    }),
    [section],
  );

  if (!sectionId || !section) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-lg space-y-4">
          <h1 className="text-xl font-semibold text-ink">Section not found</h1>
          <Link
            to="/drafts"
            className="inline-flex rounded-md border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-ink shadow-sm hover:bg-zinc-50"
          >
            Back to drafts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <BidControlNav />

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/drafts"
            className="text-sm text-ink-muted hover:text-ink"
          >
            ← All sections
          </Link>
          <span className="text-sm font-medium text-ink">{section.title}</span>
        </div>

        {!apiProjectId ? (
          <Card className="border-amber-200/80 bg-amber-50/50 p-3 text-xs text-amber-950">
            Set <code className="rounded bg-white px-1">VITE_DEFAULT_PROJECT_ID</code>{" "}
            to your Postgres project UUID so grounding bundles can load from the
            API.
          </Card>
        ) : null}

        <SectionStrategyPanel sectionType={section.sectionType} />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <GroundingBundleSelector
              projectId={apiProjectId}
              sectionType={section.sectionType}
              selected={bundle}
              onSelect={(b) => setSelectedBundle(section.id, b)}
            />
            <DraftGeneratorPanel
              sectionType={section.sectionType}
              selectedBundle={bundle}
              activeContent={content}
              onGenerated={(c, m) => {
                saveNewVersion({
                  sectionId: section.id,
                  content: c,
                  metadata: m,
                  groundingBundleId: bundle?.id ?? null,
                });
              }}
            />
            <DraftVersionList
              versions={versions}
              activeVersionId={section.activeVersionId}
              onSelect={(vid) => setActiveVersion(section.id, vid)}
            />
            <DraftMetadataCard
              sectionType={section.sectionType}
              metadata={metadata}
            />
          </div>

          <div className="space-y-6">
            <DraftEditor
              sectionId={section.id}
              content={content}
              metadata={metadata}
              status={section.status}
              onSaveNewVersion={(c, m) =>
                saveNewVersion({
                  sectionId: section.id,
                  content: c,
                  metadata: m,
                  groundingBundleId: bundle?.id ?? active?.groundingBundleId ?? null,
                })
              }
              onOverwrite={(c) => updateActiveContent(section.id, c)}
              onStatusChange={(st) => updateSectionStatus(section.id, st)}
            />
            <CoveragePanel bundle={bundle?.payload ?? null} metadata={metadata} />
            <ScoringFeedbackCard
              sectionType={section.sectionType}
              metadata={metadata}
            />
            <ConstraintWarning
              sectionType={section.sectionType}
              metadata={metadata}
            />
          </div>
        </div>

        <p className="text-xs text-ink-subtle">
          Page budget reference: max {layout.max} pages for this section type.
        </p>
      </div>
    </div>
  );
}

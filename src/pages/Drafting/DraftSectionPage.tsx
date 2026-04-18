import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BidControlNav } from "@/components/control/BidControlNav";
import { ConstraintWarning } from "@/components/drafting/ConstraintWarning";
import { ContradictionAlert } from "@/components/drafting/ContradictionAlert";
import { CoveragePanel } from "@/components/drafting/CoveragePanel";
import { DraftEditor } from "@/components/drafting/DraftEditor";
import { DraftGeneratorPanel } from "@/components/drafting/DraftGeneratorPanel";
import { DraftMetadataCard } from "@/components/drafting/DraftMetadataCard";
import { DraftVersionList } from "@/components/drafting/DraftVersionList";
import { GroundingBundlePreview } from "@/components/drafting/GroundingBundlePreview";
import { GroundingBundleSelector } from "@/components/drafting/GroundingBundleSelector";
import { FeedbackRecommendationList } from "@/components/drafting/FeedbackRecommendationList";
import { ProseReviewPanel } from "@/components/drafting/ProseReviewPanel";
import { RequirementProofTable } from "@/components/drafting/RequirementProofTable";
import { ScoringFeedbackCard } from "@/components/drafting/ScoringFeedbackCard";
import { SectionHealthIndicator } from "@/components/drafting/SectionHealthIndicator";
import { SectionStrategyPanel } from "@/components/drafting/SectionStrategyPanel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useDrafting } from "@/context/useDrafting";
import { MOCK_PROJECT } from "@/data/mockProject";
import { DRAFTING_COPY } from "@/lib/drafting-copy";
import {
  isFunctionsApiConfigured,
  postBuildProofGraph,
  postReviewDraftProse,
} from "@/lib/functions-api";
import type { GroundedProseReviewResult } from "@/types";
import {
  countWords,
  draftFeedbackNextSteps,
  draftSectionHealthSnapshot,
  pageOverflowRisk,
  SECTION_FOCUS,
  versionOrdinal,
} from "@/lib/drafting-utils";

const PANEL_GAP = "space-y-6";

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
    duplicateVersion,
    updateVersionNote,
    setVersionLocked,
    autoGroundedReviewAfterGenerate,
    setAutoGroundedReviewAfterGenerate,
  } = useDrafting();

  const envProjectId = (
    import.meta.env.VITE_DEFAULT_PROJECT_ID as string | undefined
  )?.trim();
  const apiProjectId = envProjectId || MOCK_PROJECT.id;
  const showWorkspaceProjectHint =
    isFunctionsApiConfigured() && !envProjectId;

  const section = sectionId ? getSection(sectionId) : undefined;
  const versions = sectionId ? getVersionsForSection(sectionId) : [];
  const active = sectionId ? getActiveVersion(sectionId) : undefined;
  const bundle = sectionId ? getSelectedBundle(sectionId) : null;

  const content = active?.content ?? "";
  const metadata = active?.metadata ?? null;

  const [editorDirty, setEditorDirty] = useState(false);
  const onEditorDirty = useCallback((dirty: boolean) => {
    setEditorDirty(dirty);
  }, []);

  useEffect(() => {
    setEditorDirty(false);
  }, [sectionId]);

  const [proofBusy, setProofBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [proofNotice, setProofNotice] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [localGroundedReview, setLocalGroundedReview] =
    useState<GroundedProseReviewResult | null>(null);

  useEffect(() => {
    setLocalGroundedReview(null);
    setProofNotice("");
    setReviewError(null);
  }, [sectionId]);

  const groundedReview =
    metadata?.groundedProseReview ?? localGroundedReview;

  const liveWords = countWords(content);
  const metricsMayBeStale = Boolean(
    metadata && (editorDirty || liveWords !== metadata.wordCount),
  );

  const bundlePayload = bundle?.payload ?? null;

  const feedbackHealth = useMemo(
    () =>
      section
        ? draftSectionHealthSnapshot({
            sectionType: section.sectionType,
            metadata,
            bundle: bundlePayload,
            metricsMayBeStale,
          })
        : null,
    [section, metadata, bundlePayload, metricsMayBeStale],
  );

  const feedbackActions = useMemo(
    () =>
      section
        ? draftFeedbackNextSteps({
            sectionType: section.sectionType,
            metadata,
            bundle: bundlePayload,
            metricsMayBeStale,
          })
        : [],
    [section, metadata, bundlePayload, metricsMayBeStale],
  );

  const layout = useMemo(
    () => ({
      max: section ? SECTION_FOCUS[section.sectionType].maxPages : 2,
    }),
    [section],
  );

  const overflow =
    metadata && section
      ? pageOverflowRisk(metadata.estimatedPages, layout.max)
      : "ok";

  const syncProofGraph = useCallback(async () => {
    if (!isFunctionsApiConfigured()) {
      setProofNotice("Configure VITE_FUNCTIONS_BASE_URL to sync the proof graph.");
      return;
    }
    setProofBusy(true);
    setProofNotice("");
    try {
      const r = await postBuildProofGraph({ projectId: apiProjectId });
      setProofNotice(
        `Synced ${r.rowsSynced} proof row(s). Rebuild or re-select this grounding bundle to refresh requirement support in the payload.`,
      );
    } catch (e) {
      setProofNotice(
        e instanceof Error ? e.message : "Proof graph sync failed.",
      );
    } finally {
      setProofBusy(false);
    }
  }, [apiProjectId]);

  const runGroundedReview = useCallback(async () => {
    if (!section || !bundlePayload) {
      setReviewError("Attach a grounding bundle first.");
      return;
    }
    if (!content.trim()) {
      setReviewError("Add draft text in the editor before running review.");
      return;
    }
    if (!isFunctionsApiConfigured()) {
      setReviewError("Configure VITE_FUNCTIONS_BASE_URL to run grounded review.");
      return;
    }
    setReviewBusy(true);
    setReviewError(null);
    try {
      const { review } = await postReviewDraftProse({
        sectionType: section.sectionType,
        draftText: content,
        grounding: bundlePayload,
      });
      if (metadata && active) {
        await Promise.resolve(
          saveNewVersion({
            sectionId: section.id,
            content,
            metadata: { ...metadata, groundedProseReview: review },
            groundingBundleId: bundle?.id ?? active.groundingBundleId ?? null,
          }),
        );
      } else {
        setLocalGroundedReview(review);
      }
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Grounded review failed.");
    } finally {
      setReviewBusy(false);
    }
  }, [
    section,
    bundlePayload,
    content,
    metadata,
    active,
    bundle?.id,
    saveNewVersion,
  ]);

  if (!sectionId || !section) {
    return (
      <div className="px-4 py-6 sm:p-8">
        <div className="mx-auto w-full max-w-lg space-y-4">
          <h1 className="text-xl font-semibold text-ink">Section not found</h1>
          <p className="text-sm text-ink-muted">{DRAFTING_COPY.sectionNotFound}</p>
          <Link
            to="/drafts"
            className="inline-flex rounded-md border border-border bg-surface-raised px-3 py-2 text-sm font-medium text-ink shadow-sm hover:bg-zinc-50"
          >
            Back to drafting studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:p-8">
      <div className={`mx-auto w-full max-w-4xl ${PANEL_GAP}`}>
        <BidControlNav />

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/drafts"
              className="text-sm text-ink-muted hover:text-ink"
            >
              ← All sections
            </Link>
            <span className="text-sm font-semibold text-ink">{section.title}</span>
            <span
              className="rounded-md border border-zinc-200 bg-zinc-50/90 px-2 py-0.5 text-xs font-medium text-ink"
              title="Draft status for this section"
            >
              {section.status}
            </span>
          </div>
          <p className="text-xs text-ink-subtle">
            Page constraint: max {layout.max} pages
          </p>
        </div>

        {showWorkspaceProjectHint ? (
          <Card className="border-sky-200/70 bg-sky-50/40 p-4 text-xs text-ink-muted">
            <p className="font-medium text-ink">Workspace project ID</p>
            <p className="mt-1 leading-relaxed">{DRAFTING_COPY.projectIdHint}</p>
          </Card>
        ) : null}

        {!bundle ? (
          <Card className="border-zinc-200 bg-zinc-50/50 p-3 text-xs text-ink-muted">
            <span className="font-medium text-ink">Grounding bundle required</span>
            {" — "}
            select or build one below before generating. Generation stays disabled until
            a grounding bundle is attached.
          </Card>
        ) : null}

        {metadata && overflow !== "ok" ? (
          <Card
            className={
              overflow === "over"
                ? "border-amber-200/90 bg-amber-50/40 p-3 text-xs text-amber-950/90"
                : "border-zinc-200 bg-zinc-50/60 p-3 text-xs text-ink-muted"
            }
          >
            <span className="font-medium text-ink">Page constraint risk.</span>{" "}
            {overflow === "over"
              ? `Estimated length exceeds the ${layout.max}-page cap. Trim or regenerate with tighter scope.`
              : `Estimated length is close to the ${layout.max}-page cap. Watch requirement coverage and redundancy.`}
          </Card>
        ) : null}

        <SectionStrategyPanel sectionType={section.sectionType} />

        <GroundingBundleSelector
          projectId={apiProjectId}
          sectionType={section.sectionType}
          selected={bundle}
          onSelect={(b) => setSelectedBundle(section.id, b)}
        />

        {bundle ? (
          <GroundingBundlePreview
            bundleId={bundle.id}
            payload={bundle.payload}
            sectionType={section.sectionType}
            createdAtLabel={
              bundle.listCreatedAt
                ? new Date(bundle.listCreatedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : undefined
            }
          />
        ) : null}

        <DraftGeneratorPanel
          sectionId={section.id}
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

        <div className={`${PANEL_GAP}`}>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              Grounded review
            </p>
            <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
              Proof graph support levels feed the grounding bundle. Sync proof rows after
              you link requirements to evidence, rebuild the bundle if needed, then run a
              prose review against the draft in the editor.
            </p>
          </div>

          <Card className="space-y-3 border border-zinc-200/90 bg-zinc-50/40 p-4">
            <label className="flex cursor-pointer items-start gap-2 text-xs text-ink-muted">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-zinc-300"
                checked={autoGroundedReviewAfterGenerate}
                onChange={(e) =>
                  setAutoGroundedReviewAfterGenerate(e.target.checked)
                }
              />
              <span>
                <span className="font-medium text-ink">After generate</span>, run
                grounded prose review automatically (uses OpenAI; may add a few seconds).
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={proofBusy || !isFunctionsApiConfigured()}
                onClick={() => void syncProofGraph()}
              >
                {proofBusy ? "Syncing proof graph…" : "Sync proof graph"}
              </Button>
              <Button
                type="button"
                disabled={
                  reviewBusy ||
                  !bundle ||
                  !content.trim() ||
                  !isFunctionsApiConfigured()
                }
                onClick={() => void runGroundedReview()}
              >
                {reviewBusy ? "Running review…" : "Run grounded review"}
              </Button>
            </div>
            {proofNotice ? (
              <p className="text-[11px] leading-relaxed text-ink-muted">
                {proofNotice}
              </p>
            ) : null}
            {reviewError ? (
              <p className="text-[11px] text-amber-900/90">{reviewError}</p>
            ) : null}
          </Card>

          <RequirementProofTable bundle={bundlePayload} />
          <ContradictionAlert contradictions={groundedReview?.contradictions ?? []} />
          <ProseReviewPanel review={groundedReview} />
        </div>

        <DraftEditor
          sectionId={section.id}
          content={content}
          metadata={metadata}
          status={section.status}
          hasActiveVersion={Boolean(active)}
          activeVersionOrdinal={
            active ? versionOrdinal(versions, active.id) : null
          }
          activeVersionProtected={Boolean(active?.locked)}
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
          onDirtyChange={onEditorDirty}
        />

        <div className={`border-t border-border pt-6 ${PANEL_GAP}`}>
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
              {DRAFTING_COPY.feedbackSectionTitle}
            </p>
            <p className="max-w-3xl text-xs leading-relaxed text-ink-muted">
              {DRAFTING_COPY.feedbackSectionBody}
            </p>
          </div>
          {feedbackHealth ? (
            <SectionHealthIndicator snapshot={feedbackHealth} />
          ) : null}
          <FeedbackRecommendationList actions={feedbackActions} />
          <CoveragePanel bundle={bundlePayload} metadata={metadata} />
          <ScoringFeedbackCard
            sectionType={section.sectionType}
            metadata={metadata}
            bundle={bundlePayload}
          />
          <ConstraintWarning
            sectionType={section.sectionType}
            metadata={metadata}
            bundle={bundlePayload}
          />
        </div>

        <div className={`border-t border-border pt-6 ${PANEL_GAP}`}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Version history & structured metadata
          </p>
          <DraftVersionList
            versions={versions}
            activeVersionId={section.activeVersionId}
            sectionLocked={section.status === "Locked"}
            onSetActive={(vid) => setActiveVersion(section.id, vid)}
            onDuplicate={(vid) => duplicateVersion(section.id, vid)}
            onNoteCommit={(vid, note) =>
              updateVersionNote(section.id, vid, note)
            }
            onToggleVersionLock={(vid, locked) =>
              setVersionLocked(section.id, vid, locked)
            }
          />
          <DraftMetadataCard
            sectionType={section.sectionType}
            metadata={metadata}
            metricsMayBeStale={metricsMayBeStale}
          />
        </div>
      </div>
    </div>
  );
}

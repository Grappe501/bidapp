import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { postGenerateDraft, postReviewDraftProse } from "@/lib/functions-api";
import { getNetlifyFunctionsBaseUrl } from "@/lib/netlify-functions-base-url";
import { useDrafting } from "@/context/useDrafting";
import {
  assessGroundingBundleQuality,
  getBundleGenerationReadiness,
  pointsLabel,
  scoringCategoriesForSection,
  SECTION_FOCUS,
  sectionGenerationModes,
  sectionSupportExpectation,
  type SectionGenerationMode,
} from "@/lib/drafting-utils";
import type { DraftMetadata, DraftSectionType } from "@/types";
import type { SelectedBundle } from "@/context/drafting-context";
import { GenerationErrorNotice } from "./GenerationErrorNotice";
import { GenerationSummaryCard } from "./GenerationSummaryCard";
import { GroundingBundleQualityBadge } from "./GroundingBundleQualityBadge";

type DraftGeneratorPanelProps = {
  sectionId: string;
  sectionType: DraftSectionType;
  selectedBundle: SelectedBundle | null;
  activeContent: string;
  onGenerated: (
    content: string,
    metadata: DraftMetadata,
  ) => void | Promise<void>;
};

const TONES = ["Evaluator-neutral", "Confident", "Conservative"] as const;

type Transient = "running" | "success" | "failed" | null;

type VisualState =
  | "idle"
  | "blocked_no_bundle"
  | "blocked_no_api"
  | "blocked_invalid_bundle"
  | "running"
  | "success"
  | "failed";

const MODE_STORAGE_PREFIX = "bidapp-draft-gen-mode-";

function readStoredModeId(
  sectionId: string,
  modes: SectionGenerationMode[],
): string {
  try {
    const v = sessionStorage.getItem(`${MODE_STORAGE_PREFIX}${sectionId}`);
    if (v && modes.some((m) => m.id === v)) return v;
  } catch {
    /* private mode */
  }
  return modes[0]?.id ?? "full_section";
}

export function DraftGeneratorPanel({
  sectionId,
  sectionType,
  selectedBundle,
  activeContent,
  onGenerated,
}: DraftGeneratorPanelProps) {
  const { autoGroundedReviewAfterGenerate } = useDrafting();
  const [tone, setTone] = useState<string>(TONES[0]);
  const [transient, setTransient] = useState<Transient>(null);
  const [statusDetail, setStatusDetail] = useState("");
  const [lastSuccessMeta, setLastSuccessMeta] = useState<DraftMetadata | null>(
    null,
  );
  const [failureMessage, setFailureMessage] = useState<string | null>(null);

  const modes = useMemo(
    () => sectionGenerationModes(sectionType),
    [sectionType],
  );
  const [modeId, setModeId] = useState<string>(() =>
    readStoredModeId(sectionId, modes),
  );

  useEffect(() => {
    setModeId(readStoredModeId(sectionId, modes));
  }, [sectionId, modes]);

  const mode = useMemo(
    () => modes.find((m) => m.id === modeId) ?? modes[0],
    [modes, modeId],
  );

  const persistMode = useCallback(
    (id: string) => {
      try {
        sessionStorage.setItem(`${MODE_STORAGE_PREFIX}${sectionId}`, id);
      } catch {
        /* ignore */
      }
    },
    [sectionId],
  );

  const apiConfigured = Boolean(getNetlifyFunctionsBaseUrl());

  const readiness = useMemo(
    () =>
      selectedBundle
        ? getBundleGenerationReadiness(selectedBundle.payload)
        : null,
    [selectedBundle],
  );

  const bundleQuality = useMemo(
    () =>
      selectedBundle
        ? assessGroundingBundleQuality(selectedBundle.payload)
        : null,
    [selectedBundle],
  );

  const blocked = !selectedBundle
    ? "no_bundle"
    : !apiConfigured
      ? "no_api"
      : readiness && !readiness.canGenerate
        ? "invalid_bundle"
        : null;

  useEffect(() => {
    if (blocked && transient !== "running") {
      setTransient(null);
      setStatusDetail("");
    }
  }, [blocked, transient]);

  const visual: VisualState =
    transient === "running"
      ? "running"
      : transient === "success"
        ? "success"
        : transient === "failed"
          ? "failed"
          : blocked === "no_bundle"
            ? "blocked_no_bundle"
            : blocked === "no_api"
              ? "blocked_no_api"
              : blocked === "invalid_bundle"
                ? "blocked_invalid_bundle"
                : "idle";

  const strat = SECTION_FOCUS[sectionType];
  const scoringCats = useMemo(
    () => scoringCategoriesForSection(sectionType),
    [sectionType],
  );
  const supportLine = sectionSupportExpectation(sectionType);

  const modeBlockedByContent =
    mode.requiresEditorContent && !activeContent.trim();

  const runAllowed = blocked === null && !modeBlockedByContent;
  const isRunning = transient === "running";

  const retryRef = useRef<() => void>(() => {});

  const executeGeneration = useCallback(async () => {
    if (!selectedBundle) {
      setTransient(null);
      setStatusDetail("Attach a grounding bundle first.");
      return;
    }
    if (!apiConfigured) {
      setTransient(null);
      setStatusDetail("Configure VITE_FUNCTIONS_BASE_URL to call the generator.");
      return;
    }
    const gate = getBundleGenerationReadiness(selectedBundle.payload);
    if (!gate.canGenerate) {
      setTransient(null);
      setStatusDetail(
        gate.blockReason ?? "Grounding bundle is not ready to generate from.",
      );
      return;
    }

    const currentMode =
      modes.find((m) => m.id === modeId) ?? modes[0];
    if (currentMode.requiresEditorContent && !activeContent.trim()) {
      setFailureMessage(null);
      setTransient(null);
      setStatusDetail("This strategy needs text in the draft editor first.");
      return;
    }

    setFailureMessage(null);
    setTransient("running");
    setStatusDetail("Running structured generation with section-specific strategy…");

    const regInstruction =
      currentMode.regenInstruction ?? currentMode.strategicDirective;

    let regeneration:
      | {
          scope: "full" | "paragraph";
          instruction?: string;
          existingContent?: string;
          paragraphIndex?: number;
        }
      | undefined;

    if (currentMode.runKind === "regenerate_full") {
      regeneration = {
        scope: "full",
        instruction: regInstruction,
        existingContent: activeContent,
      };
    } else if (currentMode.runKind === "regenerate_paragraph") {
      regeneration = {
        scope: "paragraph",
        instruction: regInstruction,
        existingContent: activeContent,
        paragraphIndex: 0,
      };
    }

    try {
      const r = await postGenerateDraft({
        mode: "structured",
        input: {
          sectionType,
          pageLimit: strat.maxPages,
          constraintRules: strat.focus,
          grounding: selectedBundle.payload,
          tone,
          strategicDirective: currentMode.strategicDirective,
          generationModeLabel: currentMode.label,
          regeneration,
        },
      });
      let meta: DraftMetadata = {
        ...r.metadata,
        generationMode: currentMode.label,
      };
      if (autoGroundedReviewAfterGenerate) {
        try {
          const { review } = await postReviewDraftProse({
            sectionType,
            draftText: r.content,
            grounding: selectedBundle.payload,
          });
          meta = { ...meta, groundedProseReview: review };
        } catch {
          /* optional pass — generation still succeeds */
        }
      }
      await Promise.resolve(onGenerated(r.content, meta));
      setLastSuccessMeta(meta);
      setTransient("success");
      setStatusDetail(
        `Complete — about ${meta.estimatedPages} pages (${meta.wordCount} words).`,
      );
      persistMode(currentMode.id);
    } catch (e) {
      setTransient("failed");
      const msg =
        e instanceof Error ? e.message : "Generation failed.";
      setFailureMessage(msg);
      setStatusDetail(msg);
    }
  }, [
    selectedBundle,
    apiConfigured,
    modes,
    modeId,
    activeContent,
    sectionType,
    strat.maxPages,
    strat.focus,
    tone,
    onGenerated,
    persistMode,
    autoGroundedReviewAfterGenerate,
  ]);

  retryRef.current = () => {
    void executeGeneration();
  };

  const statusSurface = {
    idle: "border-border bg-surface-raised",
    blocked_no_bundle: "border-zinc-200 bg-zinc-50/60",
    blocked_no_api: "border-zinc-200 bg-zinc-50/60",
    blocked_invalid_bundle: "border-zinc-300 bg-zinc-100/50",
    running: "border-sky-200/80 bg-sky-50/40",
    success: "border-emerald-200/80 bg-emerald-50/35",
    failed: "border-amber-200/90 bg-amber-50/45",
  }[visual];

  const showReadinessWarnings =
    readiness?.canGenerate &&
    readiness.warnings.length > 0 &&
    visual !== "running" &&
    visual !== "success" &&
    visual !== "failed";

  return (
    <Card className={cn("space-y-4 border p-4", statusSurface)}>
      <div>
        <h2 className="text-sm font-semibold text-ink">Draft generation</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Controlled strategies — each run shapes the model request with this
          section&apos;s scoring slice, page cap, and grounding gaps.
        </p>
      </div>

      <div className="rounded-md border border-zinc-200/80 bg-zinc-50/50 p-3 text-xs text-ink-muted">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
          Enforced before generate
        </p>
        <ul className="mt-2 space-y-1.5">
          <li>
            <span className="font-medium text-ink">Page limit:</span>{" "}
            {strat.maxPages} pages (~450 words/page target)
          </li>
          <li>
            <span className="font-medium text-ink">Section focus:</span>{" "}
            {strat.focus}
          </li>
          <li>
            <span className="font-medium text-ink">Support expectations:</span>{" "}
            {supportLine}
          </li>
          <li>
            <span className="font-medium text-ink">Scoring emphasis:</span>{" "}
            {scoringCats.map((c) => `${c.name} (${pointsLabel(c.weight)})`).join(" · ")}
          </li>
          {bundleQuality ? (
            <li className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink">Grounding bundle strength:</span>
              <GroundingBundleQualityBadge
                label={bundleQuality.label}
                title={bundleQuality.reasons.join(" ")}
              />
            </li>
          ) : null}
        </ul>
      </div>

      <div
        className="rounded-md px-3 py-2 text-xs text-ink-muted"
        role="status"
        aria-live="polite"
      >
        {visual === "blocked_no_bundle" ? (
          <p>
            <span className="font-medium text-ink">Waiting for grounding bundle.</span>{" "}
            Select or build a bundle above, then generate.
          </p>
        ) : visual === "blocked_no_api" ? (
          <p>
            <span className="font-medium text-ink">API not configured.</span>{" "}
            Set <code className="rounded bg-white/80 px-1">VITE_FUNCTIONS_BASE_URL</code>{" "}
            to run generation.
          </p>
        ) : visual === "blocked_invalid_bundle" ? (
          <p className="text-ink">
            <span className="font-medium">Cannot generate yet.</span>{" "}
            {readiness?.blockReason ??
              "This grounding bundle does not have enough substantive content."}
          </p>
        ) : visual === "running" ? (
          <p className="text-ink">{statusDetail}</p>
        ) : visual === "success" ? (
          <p className="text-emerald-900">{statusDetail}</p>
        ) : visual === "failed" ? (
          <p className="text-amber-950">
            <span className="font-medium">Generation failed.</span> {statusDetail}
          </p>
        ) : modeBlockedByContent ? (
          <p>
            <span className="font-medium text-ink">Editor text required.</span>{" "}
            {mode.label} needs existing draft content in the editor, or choose
            &quot;Generate full section&quot;.
          </p>
        ) : (
          <p>
            Choose a strategy, then run. The model receives your scoring slice,
            support rules, gaps, and weak-evidence hints — not a generic prompt.
          </p>
        )}
      </div>

      {failureMessage && visual === "failed" ? (
        <GenerationErrorNotice
          message={failureMessage}
          onRetry={() => retryRef.current()}
          disabled={!runAllowed || isRunning}
        />
      ) : null}

      {showReadinessWarnings ? (
        <div className="rounded-md border border-zinc-200/90 bg-white/90 px-3 py-2 text-xs text-ink-muted">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">
            Before you generate
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5">
            {readiness.warnings.map((w) => (
              <li key={w.slice(0, 80)}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {lastSuccessMeta ? (
        <GenerationSummaryCard metadata={lastSuccessMeta} />
      ) : null}

      <div className="space-y-2 border-t border-border/70 pt-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-ink">Generation strategy</span>
          <Select
            value={modeId}
            onChange={(e) => {
              const id = e.target.value;
              setModeId(id);
              persistMode(id);
            }}
            aria-label="Generation strategy"
          >
            {modes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </label>
        {mode ? (
          <p className="text-[11px] leading-relaxed text-ink-subtle">{mode.hint}</p>
        ) : null}
      </div>

      <label className="block space-y-1">
        <span className="text-xs text-ink-muted">Tone (optional)</span>
        <Select value={tone} onChange={(e) => setTone(e.target.value)}>
          {TONES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!runAllowed || isRunning}
          onClick={() => void executeGeneration()}
        >
          {isRunning ? "Generating…" : "Run generation"}
        </Button>
      </div>
    </Card>
  );
}

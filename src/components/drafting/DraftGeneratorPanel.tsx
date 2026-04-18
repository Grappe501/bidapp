import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { postGenerateDraft } from "@/lib/functions-api";
import { SECTION_FOCUS } from "@/lib/drafting-utils";
import type { DraftMetadata, DraftSectionType } from "@/types";
import type { SelectedBundle } from "@/context/drafting-context";

type DraftGeneratorPanelProps = {
  sectionType: DraftSectionType;
  selectedBundle: SelectedBundle | null;
  activeContent: string;
  onGenerated: (content: string, metadata: DraftMetadata) => void;
};

const TONES = ["Evaluator-neutral", "Confident", "Conservative"] as const;

export function DraftGeneratorPanel({
  sectionType,
  selectedBundle,
  activeContent,
  onGenerated,
}: DraftGeneratorPanelProps) {
  const [tone, setTone] = useState<string>(TONES[0]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const canRun =
    Boolean(selectedBundle) &&
    Boolean((import.meta.env.VITE_FUNCTIONS_BASE_URL ?? "").trim());

  const run = async (regen?: {
    scope: "full" | "paragraph";
    instruction?: string;
  }) => {
    if (!selectedBundle) {
      setMsg("Select a grounding bundle first.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const strat = SECTION_FOCUS[sectionType];
      const r = await postGenerateDraft({
        mode: "structured",
        input: {
          sectionType,
          pageLimit: strat.maxPages,
          constraintRules: strat.focus,
          grounding: selectedBundle.payload,
          tone,
          regeneration: regen
            ? {
                scope: regen.scope,
                instruction: regen.instruction,
                existingContent: activeContent || undefined,
              }
            : undefined,
        },
      });
      onGenerated(r.content, r.metadata);
      setMsg(
        `Generated ~${r.metadata.estimatedPages} pages · ${r.metadata.wordCount} words.`,
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Draft generator</h2>
        <p className="text-xs text-ink-muted">
          Constraint-aware generation uses only the attached bundle. No bundle →
          no draft.
        </p>
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
          disabled={!canRun || busy}
          onClick={() => void run()}
        >
          Generate draft
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canRun || busy || !activeContent.trim()}
          onClick={() =>
            void run({
              scope: "full",
              instruction:
                "Tighten alignment to scoring criteria; remove redundancy.",
            })
          }
        >
          Regenerate section
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!canRun || busy || !activeContent.trim()}
          onClick={() =>
            void run({
              scope: "paragraph",
              instruction:
                "Rewrite opening paragraph for non-technical clarity and grounding.",
            })
          }
        >
          Regenerate paragraph
        </Button>
      </div>

      {msg ? <p className="text-xs text-ink-muted">{msg}</p> : null}
    </Card>
  );
}

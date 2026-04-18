import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { EvidenceMetadataCard } from "@/components/evidence/EvidenceMetadataCard";
import { EvidenceSourceCard } from "@/components/evidence/EvidenceSourceCard";
import { EvidenceUsageCard } from "@/components/evidence/EvidenceUsageCard";
import { useEvidence } from "@/context/useEvidence";
import { useRequirements } from "@/context/useRequirements";
import { linksForEvidence } from "@/lib/evidence-utils";
import {
  EVIDENCE_TYPES,
  EVIDENCE_VALIDATION_STATUSES,
  type EvidenceType,
  type EvidenceValidationStatus,
} from "@/types";
import { postParseDocumentAi } from "@/lib/functions-api";

export function EvidenceDetailPage() {
  const { evidenceId } = useParams<{ evidenceId: string }>();
  const navigate = useNavigate();
  const { requirements } = useRequirements();
  const { evidenceItems, links, updateEvidence } = useEvidence();
  const item = evidenceItems.find((e) => e.id === evidenceId);
  const [dbProjectId, setDbProjectId] = useState(
    () => import.meta.env.VITE_DEFAULT_PROJECT_ID ?? "",
  );
  const [dbFileId, setDbFileId] = useState(() => item?.sourceFileId ?? "");
  const [parseMode, setParseMode] = useState<
    "extract_requirements" | "extract_evidence" | "extract_submission_items"
  >("extract_evidence");
  const [parseMsg, setParseMsg] = useState("");
  const [parseBusy, setParseBusy] = useState(false);

  useEffect(() => {
    setDbFileId(item?.sourceFileId ?? "");
  }, [item?.sourceFileId]);

  const usageRows = useMemo(() => {
    if (!evidenceId) return [];
    return linksForEvidence(links, evidenceId).map((link) => ({
      link,
      requirementTitle:
        requirements.find((r) => r.id === link.requirementId)?.title ??
        link.requirementId,
    }));
  }, [evidenceId, links, requirements]);

  if (!evidenceId || !item) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-xl font-semibold text-ink">Evidence not found</h1>
          <p className="text-sm text-ink-muted">
            This record is not in the current vault.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/evidence")}
          >
            Back to explorer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/evidence")}
          >
            ← Evidence vault
          </Button>
        </div>

        <EvidenceMetadataCard item={item} />

        <EvidenceSourceCard
          sourceFileId={item.sourceFileId}
          sourceFileName={item.sourceFileName}
          sourceSection={item.sourceSection}
        />

        <Card className="space-y-3 border-zinc-400/30 bg-zinc-50/40">
          <h2 className="text-sm font-semibold text-ink">Source file — AI parse</h2>
          <p className="text-xs text-ink-muted">
            Runs structured extraction on the linked library file when that file
            exists in Postgres. Manual trigger; outputs go to{" "}
            <code className="rounded bg-zinc-100 px-1">parsed_entities</code>.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ink-muted">
                Project ID
              </span>
              <Input
                value={dbProjectId}
                onChange={(e) => setDbProjectId(e.target.value)}
                placeholder="UUID"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ink-muted">
                File ID
              </span>
              <Input
                value={dbFileId}
                onChange={(e) => setDbFileId(e.target.value)}
                placeholder={item.sourceFileId ?? "Paste DB file UUID"}
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Mode</span>
            <Select
              value={parseMode}
              onChange={(e) =>
                setParseMode(e.target.value as typeof parseMode)
              }
              aria-label="Parse mode"
            >
              <option value="extract_requirements">Requirements</option>
              <option value="extract_evidence">Evidence</option>
              <option value="extract_submission_items">Submission items</option>
            </Select>
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={
              parseBusy ||
              !(import.meta.env.VITE_FUNCTIONS_BASE_URL ?? "").trim() ||
              !dbProjectId.trim() ||
              !dbFileId.trim()
            }
            onClick={() => {
              void (async () => {
                setParseBusy(true);
                setParseMsg("");
                try {
                  const r = await postParseDocumentAi({
                    projectId: dbProjectId.trim(),
                    fileId: dbFileId.trim(),
                    mode: parseMode,
                  });
                  setParseMsg(
                    `${r.parsedEntityIds.length} parsed_entities from file_document ${r.fileDocumentId}.`,
                  );
                } catch (e) {
                  setParseMsg(e instanceof Error ? e.message : "Failed");
                } finally {
                  setParseBusy(false);
                }
              })();
            }}
          >
            Run AI parse
          </Button>
          {parseMsg ? (
            <p className="text-xs text-ink-muted">{parseMsg}</p>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Excerpt</h2>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-zinc-50/80 p-4 text-sm leading-relaxed text-ink">
            {item.excerpt}
          </pre>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">Edit record</h2>
          <p className="text-sm text-ink-muted">
            Adjust classification and analyst notes. Source file binding is
            fixed in this packet; full re-ingest comes with backend storage.
          </p>
          <form
            className="space-y-4"
            key={item.updatedAt}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateEvidence(item.id, {
                title: String(fd.get("title") ?? ""),
                evidenceType: String(fd.get("evidenceType")) as EvidenceType,
                validationStatus: String(
                  fd.get("validationStatus"),
                ) as EvidenceValidationStatus,
                notes: String(fd.get("notes") ?? ""),
              });
            }}
          >
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ink-muted">Title</span>
              <Input name="title" required defaultValue={item.title} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">Type</span>
                <Select
                  name="evidenceType"
                  defaultValue={item.evidenceType}
                >
                  {EVIDENCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink-muted">
                  Validation
                </span>
                <Select
                  name="validationStatus"
                  defaultValue={item.validationStatus}
                >
                  {EVIDENCE_VALIDATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ink-muted">Notes</span>
              <Textarea name="notes" rows={4} defaultValue={item.notes} />
            </label>
            <div className="flex justify-end">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Card>

        <EvidenceUsageCard rows={usageRows} />
      </div>
    </div>
  );
}

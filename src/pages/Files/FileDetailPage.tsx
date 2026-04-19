import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspace } from "@/context/useWorkspace";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FileMetadataCard } from "@/components/files/FileMetadataCard";
import {
  FILE_CATEGORIES,
  FILE_SOURCE_TYPES,
  type FileCategory,
  type FileSourceType,
} from "@/types";
import { postEmbedFile, postParseDocumentAi } from "@/lib/functions-api";
import { getNetlifyFunctionsBaseUrl } from "@/lib/netlify-functions-base-url";

export function FileDetailPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { files, updateFile, project } = useWorkspace();
  const file = files.find((f) => f.id === fileId);
  const [tagInput, setTagInput] = useState("");
  const [dbProjectId, setDbProjectId] = useState(
    () =>
      project.id ||
      (import.meta.env.VITE_DEFAULT_PROJECT_ID as string | undefined) ||
      "",
  );
  const [dbFileId, setDbFileId] = useState(() => fileId ?? "");
  const [parseMode, setParseMode] = useState<
    "extract_requirements" | "extract_evidence" | "extract_submission_items"
  >("extract_requirements");
  const [backendMsg, setBackendMsg] = useState("");
  const [backendBusy, setBackendBusy] = useState(false);

  useEffect(() => {
    if (file?.id) setDbFileId(file.id);
  }, [file?.id]);

  useEffect(() => {
    if (project.id) setDbProjectId(project.id);
  }, [project.id]);

  if (!fileId || !file) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-xl font-semibold text-ink">File not found</h1>
          <p className="text-sm text-ink-muted">
            This record is not in the current workspace library.
          </p>
          <Button type="button" variant="secondary" onClick={() => navigate("/files")}>
            Back to library
          </Button>
        </div>
      </div>
    );
  }

  const addTag = () => {
    const next = tagInput.trim();
    if (!next || file.tags.includes(next)) return;
    updateFile(file.id, { tags: [...file.tags, next] });
    setTagInput("");
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/files")}
          >
            ← Back to library
          </Button>
        </div>

        <FileMetadataCard
          file={file}
          onRemoveTag={(tag) =>
            updateFile(file.id, { tags: file.tags.filter((t) => t !== tag) })
          }
        />

        <Card className="space-y-4 border-zinc-400/30 bg-zinc-50/40">
          <h2 className="text-sm font-semibold text-ink">
            Stored file — embeddings &amp; structured parse
          </h2>
          <p className="text-xs text-ink-muted">
            Targets the persistence layer (BP-005.6+). Run{" "}
            <span className="font-medium">parse-file</span> first so{" "}
            <code className="rounded bg-zinc-100 px-1">file_documents</code> has
            text. Uses OpenAI only through Netlify functions; results land in{" "}
            <code className="rounded bg-zinc-100 px-1">parsed_entities</code>{" "}
            and{" "}
            <code className="rounded bg-zinc-100 px-1">document_embeddings</code>
            .
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ink-muted">
                Project ID (UUID)
              </span>
              <Input
                value={dbProjectId}
                onChange={(e) => setDbProjectId(e.target.value)}
                placeholder="From DB / VITE_DEFAULT_PROJECT_ID"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ink-muted">
                File ID (UUID)
              </span>
              <Input
                value={dbFileId}
                onChange={(e) => setDbFileId(e.target.value)}
                aria-label="Database file id"
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-ink-muted">Parse mode</span>
            <Select
              value={parseMode}
              onChange={(e) =>
                setParseMode(
                  e.target.value as typeof parseMode,
                )
              }
              aria-label="AI parse mode"
            >
              <option value="extract_requirements">Extract requirements</option>
              <option value="extract_evidence">Extract evidence</option>
              <option value="extract_submission_items">
                Extract submission items
              </option>
            </Select>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={
                backendBusy ||
                !getNetlifyFunctionsBaseUrl() ||
                !dbProjectId.trim() ||
                !dbFileId.trim()
              }
              onClick={() => {
                void (async () => {
                  setBackendBusy(true);
                  setBackendMsg("");
                  try {
                    const r = await postEmbedFile(
                      dbFileId.trim(),
                      dbProjectId.trim(),
                    );
                    setBackendMsg(`Embedded ${r.embedded} new chunk(s).`);
                  } catch (e) {
                    setBackendMsg(
                      e instanceof Error ? e.message : "Embed failed",
                    );
                  } finally {
                    setBackendBusy(false);
                  }
                })();
              }}
            >
              Embed chunks
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={
                backendBusy ||
                !getNetlifyFunctionsBaseUrl() ||
                !dbProjectId.trim() ||
                !dbFileId.trim()
              }
              onClick={() => {
                void (async () => {
                  setBackendBusy(true);
                  setBackendMsg("");
                  try {
                    const r = await postParseDocumentAi({
                      projectId: dbProjectId.trim(),
                      fileId: dbFileId.trim(),
                      mode: parseMode,
                    });
                    setBackendMsg(
                      `Parsed to ${r.parsedEntityIds.length} entity row(s); file_document ${r.fileDocumentId}.`,
                    );
                  } catch (e) {
                    setBackendMsg(
                      e instanceof Error ? e.message : "Parse failed",
                    );
                  } finally {
                    setBackendBusy(false);
                  }
                })();
              }}
            >
              Run AI parse
            </Button>
          </div>
          {backendMsg ? (
            <p className="rounded-md border border-border bg-white px-3 py-2 text-xs text-ink-muted">
              {backendMsg}
            </p>
          ) : null}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">Classification</h2>
          <p className="text-sm text-ink-muted">
            Adjust how this record is organized in the library. Processing
            status reflects workflow state only (no parsing yet).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ink-muted">
                Category
              </span>
              <Select
                value={file.category}
                onChange={(e) =>
                  updateFile(file.id, {
                    category: e.target.value as FileCategory,
                  })
                }
                aria-label="File category"
              >
                {FILE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ink-muted">
                Source type
              </span>
              <Select
                value={file.sourceType}
                onChange={(e) =>
                  updateFile(file.id, {
                    sourceType: e.target.value as FileSourceType,
                  })
                }
                aria-label="Source type"
              >
                {FILE_SOURCE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Add tag</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="e.g. amendment"
              aria-label="New tag"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" className="shrink-0" onClick={addTag}>
              Add tag
            </Button>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Summary</h2>
          <p className="text-sm text-ink-muted">
            Placeholder for AI-assisted or manual summaries once document
            parsing is available.
          </p>
          <Textarea
            readOnly
            value={
              file.description ??
              "No summary yet. This field will link to extracted text and analyst notes."
            }
            aria-label="File summary placeholder"
          />
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Notes</h2>
          <p className="text-sm text-ink-muted">
            Team annotations will live here. Note count on the record:{" "}
            <span className="font-medium text-ink">{file.noteCount}</span>.
          </p>
          <div className="rounded-md border border-border bg-zinc-50/40 px-3 py-3 text-sm text-ink-muted">
            Notes workflow arrives in a later packet.
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">
            Linked requirements
          </h2>
          <p className="text-sm text-ink-muted">
            Compliance matrix links will appear here after requirement
            extraction. Linked item count:{" "}
            <span className="font-medium text-ink">{file.linkedItemCount}</span>.
          </p>
          <div className="rounded-md border border-dashed border-border bg-zinc-50/50 px-4 py-6 text-center text-sm text-ink-muted">
            No linked requirements yet.
          </div>
        </Card>
      </div>
    </div>
  );
}

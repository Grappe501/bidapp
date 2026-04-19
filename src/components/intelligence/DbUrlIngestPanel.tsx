import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { postIngestUrl } from "@/lib/functions-api";
import { getNetlifyFunctionsBaseUrl } from "@/lib/netlify-functions-base-url";
import { INTELLIGENCE_CLASSIFICATIONS } from "@/types";

export function DbUrlIngestPanel() {
  const [url, setUrl] = useState("");
  const [projectId, setProjectId] = useState(
    () => import.meta.env.VITE_DEFAULT_PROJECT_ID ?? "",
  );
  const [companyProfileId, setCompanyProfileId] = useState("");
  const [classification, setClassification] = useState<string>("capability");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  const configured = Boolean(getNetlifyFunctionsBaseUrl());

  return (
    <Card className="space-y-4 border-zinc-300">
      <div>
        <h3 className="text-sm font-semibold text-ink">Persisted URL ingest</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Manual trigger only: fetches HTML, strips tags, stores{" "}
          <code className="rounded bg-zinc-100 px-1">intelligence_sources</code>{" "}
          + placeholder{" "}
          <code className="rounded bg-zinc-100 px-1">intelligence_facts</code> in
          Postgres. Requires{" "}
          <code className="rounded bg-zinc-100 px-1">netlify dev</code> or
          deployed functions and{" "}
          <code className="rounded bg-zinc-100 px-1">VITE_FUNCTIONS_BASE_URL</code>
          .
        </p>
      </div>

      {!configured ? (
        <p className="text-sm text-amber-900/90">
          Functions base URL not set — session ingest above still works. Add{" "}
          <code className="rounded bg-zinc-100 px-1">VITE_FUNCTIONS_BASE_URL</code>{" "}
          to enable persistence.
        </p>
      ) : null}

      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setStatus("idle");
          setMessage("");
          if (!url.trim() || !projectId.trim()) {
            setStatus("err");
            setMessage("URL and project ID are required.");
            return;
          }
          const result = await postIngestUrl({
            url: url.trim(),
            projectId: projectId.trim(),
            companyProfileId: companyProfileId.trim() || null,
            classification,
            title: title.trim() || null,
          });
          if (!result) {
            setStatus("err");
            setMessage("Request failed (network or functions unavailable).");
            return;
          }
          setStatus("ok");
          setMessage(
            `Stored source ${result.sourceId} (${result.textLength} chars)${result.factId ? `; fact ${result.factId}` : ""}.`,
          );
        }}
      >
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink-muted">URL</span>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Project ID (UUID)</span>
          <Input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="From DB / npm run db:seed"
            required
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">
            Company profile ID (optional)
          </span>
          <Input
            value={companyProfileId}
            onChange={(e) => setCompanyProfileId(e.target.value)}
            placeholder="UUID"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Classification</span>
          <Select
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
          >
            {INTELLIGENCE_CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-muted">Title (optional)</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" variant="secondary" disabled={!configured}>
            Ingest to database
          </Button>
        </div>
      </form>
      {status !== "idle" ? (
        <Textarea
          readOnly
          rows={2}
          className={
            status === "ok"
              ? "border-emerald-200 bg-emerald-50/50 text-sm"
              : "border-red-200 bg-red-50/50 text-sm"
          }
          value={message}
        />
      ) : null}
    </Card>
  );
}

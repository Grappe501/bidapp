import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { postVendorIntelligence } from "@/lib/functions-api";
import type { VendorInterviewWorkspacePayload } from "@/types";
import { VendorInterviewEvaluationCard } from "./VendorInterviewEvaluationCard";
import { VendorInterviewSummaryCard } from "./VendorInterviewSummaryCard";

const PRI_ORDER: Record<string, number> = { P1: 0, P2: 1, P3: 2 };

export function VendorInterviewWorkspace(props: {
  projectId: string;
  vendorId: string;
}) {
  const [workspace, setWorkspace] = useState<VendorInterviewWorkspacePayload | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = (await postVendorIntelligence({
        projectId: props.projectId,
        vendorId: props.vendorId,
        action: "getInterviewWorkspace",
      })) as VendorInterviewWorkspacePayload;
      setWorkspace(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load interview workspace");
      setWorkspace(null);
    }
  }, [props.projectId, props.vendorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    if (!workspace) return [];
    const rows = [...workspace.rows].sort((a, b) => {
      const pa = PRI_ORDER[a.question.priority] ?? 9;
      const pb = PRI_ORDER[b.question.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return a.question.sortOrder - b.question.sortOrder;
    });
    const byPri = new Map<string, typeof rows>();
    for (const r of rows) {
      const p = r.question.priority || "P3";
      const list = byPri.get(p) ?? [];
      list.push(r);
      byPri.set(p, list);
    }
    return ["P1", "P2", "P3"].map((p) => ({
      priority: p,
      rows: byPri.get(p) ?? [],
    }));
  }, [workspace]);

  const copyAll = async () => {
    if (!workspace) return;
    const text = workspace.rows
      .map(
        (r) =>
          `[${r.question.priority} · ${r.question.category}]\n${r.question.question}\n`,
      )
      .join("\n");
    await navigator.clipboard.writeText(text);
  };

  const saveAnswer = async (questionId: string, opts: { skipAi?: boolean } = {}) => {
    const el = document.querySelector<HTMLTextAreaElement>(`#viq-t-${questionId}`);
    const statusEl = document.querySelector<HTMLSelectElement>(`#viq-s-${questionId}`);
    const srcEl = document.querySelector<HTMLSelectElement>(`#viq-src-${questionId}`);
    const ivEl = document.querySelector<HTMLInputElement>(`#viq-i-${questionId}`);
    const text = el?.value?.trim() ?? "";
    if (!text) {
      setError("Answer text is empty.");
      return;
    }
    setBusy(questionId);
    setError(null);
    try {
      await postVendorIntelligence({
        projectId: props.projectId,
        vendorId: props.vendorId,
        action: "saveInterviewAnswer",
        answer: {
          questionId,
          answerText: text,
          answerStatus: statusEl?.value ?? "answered",
          answerSource: srcEl?.value ?? "live_interview",
          interviewer: ivEl?.value ?? "",
          skipAi: opts.skipAi === true,
        },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  if (!workspace && !error) {
    return <p className="text-xs text-ink-muted">Loading interview workspace…</p>;
  }

  if (error && !workspace) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-amber-800">{error}</p>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!workspace) return null;

  if (workspace.rows.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No interview questions yet. Run &quot;Generate interview&quot; from Overview.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-amber-800">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => void copyAll()}>
          Copy question list
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => void load()}
        >
          Refresh
        </Button>
      </div>
      <VendorInterviewSummaryCard summary={workspace.summary} />
      <VendorInterviewEvaluationCard rows={workspace.rows} />

      {grouped.map(
        (g) =>
          g.rows.length > 0 && (
            <div key={g.priority} className="space-y-3">
              <h3
                className={`text-sm font-semibold ${
                  g.priority === "P1" ? "text-amber-900" : "text-ink"
                }`}
              >
                {g.priority} questions ({g.rows.length})
              </h3>
              {g.rows.map(({ question, answer, assessment }) => (
                <div
                  key={`${question.id}-${answer?.updatedAt ?? "na"}`}
                  className="rounded-lg border border-border bg-white p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-ink-subtle">
                        {question.category} · {question.priority}
                      </p>
                      <p className="mt-1 text-sm text-ink">{question.question}</p>
                      {question.whyItMatters ? (
                        <p className="mt-1 text-xs text-ink-muted">
                          <span className="font-medium text-ink-subtle">Why it matters:</span>{" "}
                          {question.whyItMatters}
                        </p>
                      ) : null}
                      {question.riskIfUnanswered ? (
                        <p className="mt-1 text-xs text-amber-900/90">
                          <span className="font-medium">Risk if unanswered:</span>{" "}
                          {question.riskIfUnanswered}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-ink-muted">
                      {question.answerStatus}
                    </span>
                  </div>

                  <label className="mt-3 block space-y-1">
                    <span className="text-xs font-medium text-ink-muted">Answer</span>
                    <Textarea
                      id={`viq-t-${question.id}`}
                      rows={4}
                      defaultValue={answer?.answerText ?? ""}
                      className="font-mono text-xs"
                    />
                  </label>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-xs text-ink-muted">Status</span>
                      <Select
                        id={`viq-s-${question.id}`}
                        name={`st-${question.id}`}
                        defaultValue={question.answerStatus || "unanswered"}
                      >
                        <option value="unanswered">unanswered</option>
                        <option value="answered">answered</option>
                        <option value="needs_follow_up">needs_follow_up</option>
                        <option value="resolved">resolved</option>
                      </Select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs text-ink-muted">Source</span>
                      <Select
                        id={`viq-src-${question.id}`}
                        name={`src-${question.id}`}
                        defaultValue={answer?.answerSource ?? "live_interview"}
                      >
                        <option value="live_interview">live_interview</option>
                        <option value="follow_up_email">follow_up_email</option>
                        <option value="uploaded_note">uploaded_note</option>
                        <option value="other">other</option>
                      </Select>
                    </label>
                  </div>
                  <label className="mt-2 block space-y-1">
                    <span className="text-xs text-ink-muted">Interviewer / room notes</span>
                    <input
                      id={`viq-i-${question.id}`}
                      type="text"
                      defaultValue={answer?.interviewer ?? ""}
                      className="w-full rounded border border-border px-2 py-1.5 text-xs"
                    />
                  </label>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="px-2 py-1.5 text-xs"
                      disabled={busy !== null}
                      onClick={() => void saveAnswer(question.id)}
                    >
                      {busy === question.id ? "Saving…" : "Save + AI normalize & evaluate"}
                    </Button>
                    <Button
                      type="button"
                      className="px-2 py-1.5 text-xs"
                      variant="secondary"
                      disabled={busy !== null}
                      onClick={() => void saveAnswer(question.id, { skipAi: true })}
                    >
                      Save (no AI)
                    </Button>
                  </div>

                  {answer?.normalizedSummary ? (
                    <div className="mt-3 rounded border border-slate-200 bg-slate-50/80 p-2 text-xs">
                      <p className="font-medium text-ink-subtle">Normalized summary</p>
                      <p className="mt-1 text-ink-muted">{answer.normalizedSummary}</p>
                      <p className="mt-1 text-ink-subtle">
                        Confidence: {answer.confidence} · Validation:{" "}
                        {answer.validationStatus}
                      </p>
                    </div>
                  ) : null}

                  {assessment ? (
                    <div className="mt-2 rounded border border-border p-2 text-xs">
                      <p className="font-medium text-ink">
                        Quality {assessment.score0To5}/5
                        {assessment.followUpRequired ? " · follow-up suggested" : ""}
                      </p>
                      <p className="mt-1 text-ink-muted">{assessment.rationale}</p>
                      <p className="mt-1 text-ink-subtle">
                        Flags: risk {assessment.riskFlag ? "yes" : "no"} · pricing{" "}
                        {assessment.pricingFlag ? "yes" : "no"} · integration{" "}
                        {assessment.integrationFlag ? "yes" : "no"} · execution{" "}
                        {assessment.executionFlag ? "yes" : "no"}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ),
      )}
    </div>
  );
}

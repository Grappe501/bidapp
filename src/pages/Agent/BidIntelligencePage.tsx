import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AgentAnswerCard } from "@/components/agent/AgentAnswerCard";
import { AgentMaloneQuickActions } from "@/components/agent/AgentMaloneQuickActions";
import { AgentQuickPrompts } from "@/components/agent/AgentQuickPrompts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { useWorkspace } from "@/context/useWorkspace";
import { postAskBidAgent } from "@/lib/functions-api";
import type { AgentMaloneActionRequest, AgentMaloneAnswer } from "@/types";

type ThreadMsg =
  | { role: "user"; text: string }
  | { role: "assistant"; answer: AgentMaloneAnswer }
  | { role: "error"; message: string };

function threadKey(projectId: string) {
  return `agent-malone-thread-${projectId}`;
}

function loadThread(projectId: string): ThreadMsg[] {
  try {
    const raw = sessionStorage.getItem(threadKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m) => {
      if (!m || typeof m !== "object") return false;
      const o = m as Record<string, unknown>;
      if (o.role === "user" && typeof o.text === "string") return true;
      if (o.role === "error" && typeof o.message === "string") return true;
      if (o.role === "assistant" && o.answer && typeof o.answer === "object")
        return true;
      return false;
    }) as ThreadMsg[];
  } catch {
    return [];
  }
}

function saveThread(projectId: string, thread: ThreadMsg[]) {
  try {
    sessionStorage.setItem(threadKey(projectId), JSON.stringify(thread));
  } catch {
    /* ignore quota */
  }
}

export function BidIntelligencePage() {
  const { project } = useWorkspace();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const formId = useId();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thread, setThread] = useState<ThreadMsg[]>(() =>
    loadThread(project.id),
  );

  useEffect(() => {
    setThread(loadThread(project.id));
  }, [project.id]);

  const selectedVendorId = searchParams.get("vendorId")?.trim() || undefined;
  const architectureOptionId =
    searchParams.get("architectureOptionId")?.trim() || undefined;

  const send = useCallback(
    async (question: string, actionRequest?: AgentMaloneActionRequest) => {
      const q = question.trim();
      if ((!q && !actionRequest) || loading) return;
      setLoading(true);
      const userLine = actionRequest
        ? `[Action] ${actionRequest.actionType.replace(/_/g, " ")}`
        : q;
      setThread((t) => [...t, { role: "user", text: userLine }]);
      try {
        const answer = await postAskBidAgent({
          projectId: project.id,
          question: q || undefined,
          actionRequest,
          currentPage: location.pathname,
          selectedVendorId: selectedVendorId ?? null,
          architectureOptionId: architectureOptionId ?? null,
        });
        setThread((t) => [...t, { role: "assistant", answer }]);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Request failed. Try again.";
        setThread((t) => [...t, { role: "error", message }]);
      } finally {
        setLoading(false);
        setInput("");
      }
    },
    [
      loading,
      project.id,
      location.pathname,
      selectedVendorId,
      architectureOptionId,
    ],
  );

  useEffect(() => {
    saveThread(project.id, thread);
  }, [project.id, thread]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Agent Malone</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-muted">
            Ask Agent Malone anything about the bid, vendors, pricing, readiness, and
            strategy — or run bounded workflows. Answers are grounded in system
            retrieval and labeled with confidence and evidence. Actions are explicit,
            auditable, and never destructive.
          </p>
          {(selectedVendorId || architectureOptionId) && (
            <p className="mt-2 text-xs text-ink-muted">
              Context:{" "}
              {selectedVendorId ? `vendor ${selectedVendorId}` : null}
              {selectedVendorId && architectureOptionId ? " · " : null}
              {architectureOptionId
                ? `architecture ${architectureOptionId}`
                : null}
            </p>
          )}
        </div>

        <Card className="space-y-4">
          <AgentMaloneQuickActions
            projectId={project.id}
            selectedVendorId={selectedVendorId ?? null}
            architectureOptionId={architectureOptionId ?? null}
            disabled={loading}
            onRun={(req) => void send("", { ...req, projectId: project.id })}
          />
          <AgentQuickPrompts
            disabled={loading}
            onPick={(text) => {
              setInput(text);
              void send(text);
            }}
          />
          <form id={formId} onSubmit={onSubmit} className="space-y-3">
            <label
              htmlFor={`${formId}-q`}
              className="text-xs font-medium uppercase tracking-wide text-ink-muted"
            >
              Your question
            </label>
            <Textarea
              id={`${formId}-q`}
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. What are the biggest weaknesses in our current bid?"
              disabled={loading}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => {
                  setThread([]);
                  try {
                    sessionStorage.removeItem(threadKey(project.id));
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Clear thread
              </Button>
              <Button type="submit" disabled={loading || !input.trim()}>
                {loading ? "Analyzing…" : "Ask"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          {thread.map((m, i) => {
            if (m.role === "user") {
              return (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-zinc-50/80 px-4 py-3 text-sm text-ink"
                >
                  <span className="text-xs font-medium text-ink-muted">You · </span>
                  {m.text}
                </div>
              );
            }
            if (m.role === "error") {
              return (
                <div
                  key={i}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
                >
                  {m.message}
                </div>
              );
            }
            return <AgentAnswerCard key={i} answer={m.answer} />;
          })}
        </div>
      </div>
    </div>
  );
}

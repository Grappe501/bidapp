import {
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { AgentBriefingSection } from "@/components/agent/AgentBriefingSection";
import { AgentAnswerCard } from "@/components/agent/AgentAnswerCard";
import { AgentContextChips } from "@/components/agent/AgentContextChips";
import { AgentMemoryPanel } from "@/components/agent/AgentMemoryPanel";
import { AgentMaloneQuickActions } from "@/components/agent/AgentMaloneQuickActions";
import { AgentQuickPrompts } from "@/components/agent/AgentQuickPrompts";
import { AgentThreadSidebar } from "@/components/agent/AgentThreadSidebar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { useWorkspace } from "@/context/useWorkspace";
import {
  postAgentMaloneBriefing,
  postAgentMaloneThreads,
  postAskBidAgent,
} from "@/lib/functions-api";
import type {
  AgentMaloneActionRequest,
  AgentMaloneAnswer,
  AgentMaloneBriefing,
  AgentMaloneBriefingMode,
  AgentMaloneThread,
  AgentMaloneThreadSummary,
  AgentMaloneTurnResponse,
  AgentMaloneWorkingMemory,
} from "@/types";

function threadRowToSummary(t: AgentMaloneThread): AgentMaloneThreadSummary {
  return {
    threadId: t.id,
    projectId: t.projectId,
    title: t.title,
    currentFocus: t.currentFocus,
    currentVendorId: t.currentVendorId,
    currentArchitectureOptionId: t.currentArchitectureOptionId,
    updatedAt: t.updatedAt,
    summaryLine: t.summaryLine,
  };
}

type ThreadMsg =
  | { role: "user"; text: string }
  | { role: "assistant"; answer: AgentMaloneAnswer }
  | { role: "error"; message: string };

function sessionChatKey(projectId: string, threadId: string) {
  return `agent-malone-chat-${projectId}-${threadId}`;
}

function loadSessionChat(projectId: string, threadId: string): ThreadMsg[] {
  try {
    const raw = sessionStorage.getItem(sessionChatKey(projectId, threadId));
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

function saveSessionChat(projectId: string, threadId: string, msgs: ThreadMsg[]) {
  try {
    sessionStorage.setItem(
      sessionChatKey(projectId, threadId),
      JSON.stringify(msgs),
    );
  } catch {
    /* ignore */
  }
}

function parseBriefingMode(raw: string | null): AgentMaloneBriefingMode {
  const allowed: AgentMaloneBriefingMode[] = [
    "default",
    "executive",
    "strategy",
    "vendor",
    "readiness",
    "drafting",
    "pricing",
    "comparison",
  ];
  if (raw && allowed.includes(raw as AgentMaloneBriefingMode)) {
    return raw as AgentMaloneBriefingMode;
  }
  return "default";
}

function turnToAnswer(t: AgentMaloneTurnResponse): AgentMaloneAnswer {
  const { threadId, threadSummary, workingMemorySnapshot, briefing, ...rest } =
    t;
  void threadId;
  void threadSummary;
  void workingMemorySnapshot;
  void briefing;
  return rest;
}

function activeThreadStorageKey(projectId: string) {
  return `agent-malone-active-thread-id-${projectId}`;
}

export function BidIntelligencePage() {
  const { project } = useWorkspace();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const formId = useId();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threads, setThreads] = useState<AgentMaloneThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [chat, setChat] = useState<ThreadMsg[]>([]);
  const [threadSummary, setThreadSummary] =
    useState<AgentMaloneThreadSummary | null>(null);
  const [workingMemory, setWorkingMemory] = useState<AgentMaloneWorkingMemory[]>(
    [],
  );
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [briefingMode, setBriefingMode] = useState<AgentMaloneBriefingMode>(() =>
    parseBriefingMode(searchParams.get("briefingMode")),
  );
  const [briefing, setBriefing] = useState<AgentMaloneBriefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  const selectedVendorId = searchParams.get("vendorId")?.trim() || undefined;
  const architectureOptionId =
    searchParams.get("architectureOptionId")?.trim() || undefined;
  const sectionId = searchParams.get("sectionId")?.trim() || undefined;
  const briefingModeParam = searchParams.get("briefingMode");

  useEffect(() => {
    setBriefingMode(parseBriefingMode(briefingModeParam));
  }, [briefingModeParam]);

  useEffect(() => {
    let cancelled = false;
    setThreadsError(null);
    (async () => {
      try {
        const r = await postAgentMaloneThreads({
          projectId: project.id,
          action: "list",
        });
        if (cancelled) return;
        let list = r.threads ?? [];
        if (list.length === 0) {
          const c = await postAgentMaloneThreads({
            projectId: project.id,
            action: "create",
            title: "General",
          });
          if (c.thread) list = [c.thread];
        }
        setThreads(list);
        const saved =
          typeof localStorage !== "undefined"
            ? localStorage.getItem(activeThreadStorageKey(project.id))
            : null;
        const pick =
          saved && list.some((t) => t.id === saved) ? saved : list[0]?.id;
        if (pick) setActiveThreadId(pick);
      } catch (e) {
        if (!cancelled) {
          setThreadsError(
            e instanceof Error
              ? e.message
              : "Could not load threads (database may be unavailable).",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  useEffect(() => {
    if (!activeThreadId) return;
    setChat(loadSessionChat(project.id, activeThreadId));
    try {
      localStorage.setItem(activeThreadStorageKey(project.id), activeThreadId);
    } catch {
      /* ignore */
    }
  }, [project.id, activeThreadId]);

  useEffect(() => {
    if (!activeThreadId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await postAgentMaloneThreads({
          projectId: project.id,
          action: "get",
          threadId: activeThreadId,
        });
        if (cancelled) return;
        if (r.thread) setThreadSummary(threadRowToSummary(r.thread));
        setWorkingMemory(r.workingMemory ?? []);
      } catch {
        if (!cancelled) setWorkingMemory([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id, activeThreadId]);

  useEffect(() => {
    if (!activeThreadId) return;
    saveSessionChat(project.id, activeThreadId, chat);
  }, [project.id, activeThreadId, chat]);

  const loadBriefing = useCallback(async () => {
    if (!activeThreadId) return;
    setBriefingLoading(true);
    setBriefingError(null);
    try {
      const r = await postAgentMaloneBriefing({
        projectId: project.id,
        threadId: activeThreadId,
        mode: briefingMode,
        currentPage: location.pathname,
        selectedVendorId: selectedVendorId ?? null,
        architectureOptionId: architectureOptionId ?? null,
        sectionId: sectionId ?? null,
        updateThreadSummary: true,
      });
      setBriefing(r.briefing);
      const ref = await postAgentMaloneThreads({
        projectId: project.id,
        action: "list",
      });
      if (ref.threads) setThreads(ref.threads);
    } catch (e) {
      setBriefingError(
        e instanceof Error
          ? e.message
          : "Briefing unavailable (check database and functions).",
      );
      setBriefing(null);
    } finally {
      setBriefingLoading(false);
    }
  }, [
    activeThreadId,
    project.id,
    briefingMode,
    location.pathname,
    selectedVendorId,
    architectureOptionId,
    sectionId,
  ]);

  useEffect(() => {
    void loadBriefing();
  }, [loadBriefing]);

  const send = useCallback(
    async (question: string, actionRequest?: AgentMaloneActionRequest) => {
      const q = question.trim();
      if ((!q && !actionRequest) || loading || !activeThreadId) return;
      setLoading(true);
      const userLine = actionRequest
        ? `[Action] ${actionRequest.actionType.replace(/_/g, " ")}`
        : q;
      setChat((t) => [...t, { role: "user", text: userLine }]);
      try {
        const data = await postAskBidAgent({
          projectId: project.id,
          threadId: activeThreadId,
          question: q || undefined,
          actionRequest,
          currentPage: location.pathname,
          selectedVendorId: selectedVendorId ?? null,
          architectureOptionId: architectureOptionId ?? null,
          sectionId: sectionId ?? null,
        });
        if (data.threadSummary) setThreadSummary(data.threadSummary);
        if (data.workingMemorySnapshot)
          setWorkingMemory(data.workingMemorySnapshot);
        if (data.briefing) setBriefing(data.briefing);
        setChat((t) => [...t, { role: "assistant", answer: turnToAnswer(data) }]);
        const ref = await postAgentMaloneThreads({
          projectId: project.id,
          action: "list",
        });
        if (ref.threads) setThreads(ref.threads);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Request failed. Try again.";
        setChat((t) => [...t, { role: "error", message }]);
      } finally {
        setLoading(false);
        setInput("");
      }
    },
    [
      loading,
      project.id,
      activeThreadId,
      location.pathname,
      selectedVendorId,
      architectureOptionId,
      sectionId,
    ],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const newThread = async () => {
    try {
      const r = await postAgentMaloneThreads({
        projectId: project.id,
        action: "create",
        title: `Thread ${threads.length + 1}`,
      });
      if (r.thread) {
        setThreads((t) => [r.thread!, ...t]);
        setActiveThreadId(r.thread.id);
        setChat([]);
        setThreadSummary(null);
        setWorkingMemory([]);
        setBriefing(null);
      }
    } catch {
      /* ignore */
    }
  };

  const archiveThread = async (id: string) => {
    try {
      await postAgentMaloneThreads({
        projectId: project.id,
        action: "archive",
        threadId: id,
      });
      const r = await postAgentMaloneThreads({
        projectId: project.id,
        action: "list",
      });
      const list = r.threads ?? [];
      setThreads(list);
      if (activeThreadId === id) {
        setActiveThreadId(list[0]?.id ?? null);
      }
    } catch {
      /* ignore */
    }
  };

  const clearMemory = async () => {
    if (!activeThreadId) return;
    try {
      await postAgentMaloneThreads({
        projectId: project.id,
        action: "clear_memory",
        threadId: activeThreadId,
      });
      setWorkingMemory([]);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4 lg:flex-row lg:p-6">
      <div className="flex h-[min(720px,calc(100vh-8rem))] min-h-0 w-full flex-col border border-border lg:w-52 lg:shrink-0">
        <AgentThreadSidebar
          threads={threads}
          activeId={activeThreadId}
          onSelect={setActiveThreadId}
          onNew={() => void newThread()}
          onArchive={(id) => void archiveThread(id)}
          disabled={loading}
        />
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto p-4 lg:flex lg:flex-row lg:gap-6 lg:p-6">
        <div className="mx-auto flex max-w-3xl flex-1 flex-col gap-6">
          {activeThreadId ? (
            <AgentBriefingSection
              briefing={briefing}
              loading={briefingLoading}
              error={briefingError}
              mode={briefingMode}
              onModeChange={setBriefingMode}
              onRefresh={() => void loadBriefing()}
              disabled={loading}
              onCopyPrompt={() => {
                if (!briefing) return;
                const text = [
                  briefing.headline,
                  "",
                  briefing.summary,
                  "",
                  "Open follow-ups:",
                  ...briefing.openFollowUps.map((x) => `• ${x}`),
                ].join("\n");
                void navigator.clipboard.writeText(text);
              }}
            />
          ) : null}

          <div>
            <h1 className="text-2xl font-semibold text-ink">Agent Malone</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Project-scoped intelligence workspace: threads, working memory, and
              bounded workflows. Nothing leaves this bid unless you export it
              elsewhere.
            </p>
            {threadsError ? (
              <p className="mt-2 text-xs text-amber-800">{threadsError}</p>
            ) : null}
            {(selectedVendorId || architectureOptionId || sectionId) && (
              <p className="mt-2 text-xs text-ink-muted">
                Page context:{" "}
                {[selectedVendorId && `vendor`, architectureOptionId && `architecture`, sectionId && `section`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <div className="mt-3">
              <AgentContextChips summary={threadSummary} />
            </div>
          </div>

          <Card className="space-y-4">
            <AgentMaloneQuickActions
              projectId={project.id}
              selectedVendorId={selectedVendorId ?? null}
              architectureOptionId={architectureOptionId ?? null}
              disabled={loading || !activeThreadId}
              onRun={(req) =>
                void send("", { ...req, projectId: project.id })
              }
            />
            <AgentQuickPrompts
              disabled={loading || !activeThreadId}
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
                placeholder='e.g. "What are the biggest weaknesses?" or "clear memory"'
                disabled={loading || !activeThreadId}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => {
                    setChat([]);
                    if (activeThreadId) {
                      try {
                        sessionStorage.removeItem(
                          sessionChatKey(project.id, activeThreadId),
                        );
                      } catch {
                        /* ignore */
                      }
                    }
                  }}
                >
                  Clear chat view
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !input.trim() || !activeThreadId}
                >
                  {loading ? "Analyzing…" : "Ask"}
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            {chat.map((m, i) => {
              if (m.role === "user") {
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-zinc-50/80 px-4 py-3 text-sm text-ink"
                  >
                    <span className="text-xs font-medium text-ink-muted">
                      You ·{" "}
                    </span>
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

        <aside className="mt-8 w-full shrink-0 space-y-3 lg:mt-0 lg:w-72">
          <AgentMemoryPanel
            items={workingMemory}
            disabled={loading || !activeThreadId}
            onClearAll={() => void clearMemory()}
          />
        </aside>
      </div>
    </div>
  );
}

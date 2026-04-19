type Props = {
  onPick: (text: string) => void;
  disabled?: boolean;
};

const PROMPTS = [
  "Are we ready to submit?",
  "What are the biggest risks in the current bid?",
  "Which vendor is currently preferred and why?",
  "What is still weakly supported?",
  "What should we ask the vendor next?",
  "What does the RFP say about MatrixCare integration?",
  "What sections are out of alignment?",
];

export function AgentQuickPrompts({ onPick, disabled }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        Quick prompts
      </p>
      <div className="flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onPick(p)}
            className="rounded-md border border-border bg-surface-raised px-2.5 py-1 text-left text-xs text-ink transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

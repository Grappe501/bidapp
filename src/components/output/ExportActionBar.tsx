import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ExportActionBar({
  actions,
}: {
  actions: { label: string; onClick: () => Promise<boolean> }[];
}) {
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.label}
            type="button"
            variant="secondary"
            className="text-xs"
            onClick={async () => {
              const ok = await a.onClick();
              setMsg(ok ? `Copied: ${a.label}` : `Could not copy (${a.label})`);
              setTimeout(() => setMsg(null), 3200);
            }}
          >
            {a.label}
          </Button>
        ))}
      </div>
      {msg ? (
        <p className="text-xs text-ink-muted" role="status">
          {msg}
        </p>
      ) : (
        <p className="text-xs text-ink-subtle">
          Exports are clipboard-first for manual assembly — no ARBuy upload.
        </p>
      )}
    </div>
  );
}

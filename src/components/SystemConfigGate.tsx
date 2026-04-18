import type { ReactNode } from "react";
import { getMissingClientEnvVars } from "@/lib/strict-client-env";

export function SystemConfigGate({ children }: { children: ReactNode }) {
  const missing = getMissingClientEnvVars();
  if (missing.length === 0) return children;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-lg rounded-lg border border-amber-200 bg-amber-50/90 px-6 py-5 text-sm text-amber-950 shadow-sm">
        <h1 className="text-base font-semibold text-ink">
          System not configured — missing environment variables
        </h1>
        <p className="mt-2 text-ink-muted">
          Set the following in your Vite / Netlify build environment, then rebuild:
        </p>
        <ul className="mt-3 list-inside list-disc font-mono text-xs text-ink">
          {missing.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-subtle">
          See <span className="font-mono">.env.example</span> for the full list (including{" "}
          <span className="font-mono">ALLOWED_ORIGIN</span>,{" "}
          <span className="font-mono">INTERNAL_API_KEY</span> on functions).
        </p>
      </div>
    </div>
  );
}

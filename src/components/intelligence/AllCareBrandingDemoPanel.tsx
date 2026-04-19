import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  isFunctionsApiConfigured,
  postGetBrandingProfile,
  type BrandingProfileApi,
} from "@/lib/functions-api";

/**
 * Stakeholder-facing view of AllCare understanding — no operator ingest controls.
 */
export function AllCareBrandingDemoPanel() {
  const projectId = (import.meta.env.VITE_DEFAULT_PROJECT_ID ?? "").trim();
  const [branding, setBranding] = useState<BrandingProfileApi | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId || !isFunctionsApiConfigured()) {
      setStatus("Configure the workspace project and functions URL to load the company profile.");
      return;
    }
    setStatus("Loading…");
    try {
      const r = await postGetBrandingProfile({ projectId, ensureProfile: false });
      setBranding(r.branding);
      setStatus(null);
    } catch (e) {
      setBranding(null);
      setStatus(e instanceof Error ? e.message : "Could not load company profile.");
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isFunctionsApiConfigured()) {
    return (
      <Card className="border border-slate-200/90 bg-white px-5 py-4 text-sm text-slate-600">
        Connect the application to your deployment to show the live AllCare operational profile.
      </Card>
    );
  }

  return (
    <Card className="space-y-6 border border-emerald-900/12 bg-gradient-to-b from-white to-emerald-50/30 p-6 shadow-sm">
      <header className="space-y-2 border-b border-emerald-900/10 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-900/70">
          Company understanding
        </p>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          How this workspace represents AllCare
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
          Operational profile derived from your controlled sources — structured for
          proposal alignment, not open-web research. Capabilities and service lines
          inform drafting, review, and client readouts.
        </p>
      </header>

      {status ? (
        <p className="text-sm text-slate-600">{status}</p>
      ) : null}

      {branding ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Summary
            </h3>
            <p className="text-sm leading-relaxed text-slate-800">
              {branding.summary?.trim() || branding.displayName || "—"}
            </p>
            {branding.appDisplayName ? (
              <p className="text-xs text-slate-500">
                Public-facing name:{" "}
                <span className="font-medium text-slate-700">{branding.appDisplayName}</span>
              </p>
            ) : null}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Service lines
            </h3>
            {branding.serviceLines?.length ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                {branding.serviceLines.slice(0, 8).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No service lines listed yet.</p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Capabilities
            </h3>
            {branding.capabilities?.length ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                {branding.capabilities.slice(0, 8).map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No capabilities listed yet.</p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Technology &amp; operations
            </h3>
            {branding.technologyReferences?.length ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                {branding.technologyReferences.slice(0, 8).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No technology references listed yet.</p>
            )}
            {branding.brandingTags?.length ? (
              <p className="pt-2 text-xs text-slate-500">
                Tags: {branding.brandingTags.slice(0, 6).join(" · ")}
              </p>
            ) : null}
          </section>
        </div>
      ) : !status ? (
        <p className="text-sm text-slate-500">No profile data loaded.</p>
      ) : null}
    </Card>
  );
}

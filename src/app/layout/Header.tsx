import { useState } from "react";
import { useAppBranding } from "@/context/app-branding-context";
import {
  LIVE_PRODUCT_NAME,
  liveClientDisplayName,
} from "@/lib/branding-utils";
import { useWorkspace } from "@/context/useWorkspace";

export function Header() {
  const { project } = useWorkspace();
  const { branding, loading } = useAppBranding();
  const [logoFailed, setLogoFailed] = useState(false);

  const clientLabel = liveClientDisplayName(branding);
  const subtitle = `${project.bidNumber || "S000000479"} · Pharmacy Services for DHS HDCs`;

  const logoUrl = branding?.logoUrl?.trim() || branding?.brandImageUrl?.trim();

  return (
    <header className="flex min-h-14 shrink-0 items-center border-b border-border bg-surface-raised px-6 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {logoUrl && !logoFailed ? (
          <img
            src={logoUrl}
            alt=""
            className="h-9 w-auto max-w-[140px] object-contain object-left"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <div className="flex h-9 min-w-[2.5rem] items-center rounded border border-slate-200/90 bg-slate-50 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            AC
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-ink-subtle">
            {LIVE_PRODUCT_NAME}
            {loading ? " · Loading profile…" : ""}
          </p>
          <p className="truncate text-sm font-semibold text-ink">{clientLabel}</p>
          <p className="truncate text-[11px] text-ink-muted">{subtitle}</p>
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-ink-subtle">
          Private workspace
        </p>
        <p className="truncate text-xs text-ink-muted">{project.bidNumber}</p>
      </div>
    </header>
  );
}

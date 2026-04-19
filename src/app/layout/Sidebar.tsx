import { NavLink, useLocation } from "react-router-dom";
import { useAppBranding } from "@/context/app-branding-context";
import { useWorkspace } from "@/context/useWorkspace";
import { LIVE_PRODUCT_NAME, liveClientDisplayName } from "@/lib/branding-utils";
import { cn } from "@/lib/utils";

type NavItem =
  | { to: string; label: string; end?: boolean; title?: string }
  | { to: string; label: string; prefix: string; title?: string };

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/files", label: "Files" },
  { to: "/requirements", label: "Requirements" },
  { to: "/evidence", label: "Evidence" },
  { to: "/vendors", label: "Vendors" },
  { to: "/architecture", label: "Architecture" },
  { to: "/control/submission", label: "Bid control", prefix: "/control" },
  { to: "/drafts", label: "Drafts", prefix: "/drafts" },
  { to: "/review", label: "Review", prefix: "/review" },
  {
    to: "/output",
    label: "Output",
    prefix: "/output",
    title: "Submission package & readiness",
  },
  { to: "/submission", label: "Submission", prefix: "/submission" },
  { to: "/strategy", label: "Strategy", prefix: "/strategy" },
];

const linkClass = (active: boolean) =>
  cn(
    "block rounded-md px-3 py-2 text-sm transition-colors",
    active
      ? "bg-zinc-100 font-medium text-ink"
      : "text-ink-muted hover:bg-zinc-50 hover:text-ink",
  );

export function Sidebar() {
  const location = useLocation();
  const { project } = useWorkspace();
  const { branding } = useAppBranding();
  const clientLabel = liveClientDisplayName(branding);
  const sub = `${project.bidNumber} · Pharmacy Services for DHS HDCs`;

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col border-r border-border bg-surface-raised">
      <div className="flex min-h-14 flex-col justify-center border-b border-border px-5 py-3">
        <span className="text-sm font-semibold tracking-tight text-ink">
          {LIVE_PRODUCT_NAME}
        </span>
        <span className="mt-0.5 truncate text-[11px] font-medium text-ink-muted">
          {clientLabel}
        </span>
        <span className="mt-0.5 text-[10px] leading-snug text-ink-muted">{sub}</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Primary">
        {navItems.map((item) => {
          if ("prefix" in item) {
            const active = location.pathname.startsWith(item.prefix);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={"title" in item ? item.title : undefined}
                className={linkClass(active)}
              >
                {item.label}
              </NavLink>
            );
          }
          const { to, label, end: endMatch, title: linkTitle } = item;
          return (
            <NavLink
              key={to}
              to={to}
              end={endMatch}
              title={linkTitle}
              className={({ isActive }) => linkClass(isActive)}
            >
              {label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

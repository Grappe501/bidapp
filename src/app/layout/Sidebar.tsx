import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

type NavItem =
  | { to: string; label: string; end?: boolean }
  | { to: string; label: string; prefix: string };

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
  { to: "/output", label: "Output", prefix: "/output" },
  { to: "/submission", label: "Submission", prefix: "/submission" },
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

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col border-r border-border bg-surface-raised">
      <div className="flex h-14 items-center border-b border-border px-5">
        <span className="text-sm font-semibold tracking-tight text-ink">
          Bid Assembly
        </span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Primary">
        {navItems.map((item) => {
          if ("prefix" in item) {
            const active = location.pathname.startsWith(item.prefix);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass(active)}
              >
                {item.label}
              </NavLink>
            );
          }
          const { to, label, end: endMatch } = item;
          return (
            <NavLink
              key={to}
              to={to}
              end={endMatch}
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

import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links: { to: string; label: string; end?: boolean }[] = [
  { to: "/submission", label: "Workflow", end: true },
  { to: "/submission/runbook", label: "Runbook" },
  { to: "/submission/audit", label: "Audit" },
];

export function SubmissionSubNav() {
  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-border pb-3"
      aria-label="Submission execution"
    >
      {links.map(({ to, label, end: endMatch }) => (
        <NavLink
          key={to}
          to={to}
          end={endMatch}
          className={({ isActive }) =>
            cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-zinc-100 text-ink"
                : "text-ink-muted hover:bg-zinc-50 hover:text-ink",
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

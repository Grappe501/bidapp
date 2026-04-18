import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links: { to: string; label: string; end?: boolean }[] = [
  { to: "/output", label: "Center", end: true },
  { to: "/output/submission", label: "Submission" },
  { to: "/output/client-review", label: "Client review" },
  { to: "/output/redaction", label: "Redaction" },
  { to: "/output/final-bundle", label: "Final bundle" },
];

export function OutputSubNav() {
  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-border pb-3"
      aria-label="Output workspaces"
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

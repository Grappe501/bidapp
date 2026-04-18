import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links: { to: string; label: string; end?: boolean; title?: string }[] = [
  { to: "/output", label: "Output center", end: true, title: "Output center" },
  {
    to: "/output/submission",
    label: "Submission package",
    title: "Submission package",
  },
  {
    to: "/output/client-review",
    label: "Client review packet",
    title: "Client review packet",
  },
  {
    to: "/output/redaction",
    label: "Redacted packet",
    title: "Redacted packet — redaction support",
  },
  {
    to: "/output/final-bundle",
    label: "Final readiness bundle",
    title: "Final readiness bundle",
  },
];

export function OutputSubNav() {
  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-border pb-3"
      aria-label="Output module"
    >
      {links.map(({ to, label, end: endMatch, title }) => (
        <NavLink
          key={to}
          to={to}
          end={endMatch}
          title={title}
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

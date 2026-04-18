import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const links: { to: string; label: string }[] = [
  { to: "/control/submission", label: "Submission" },
  { to: "/control/scoring", label: "Scoring" },
  { to: "/control/discussion", label: "Discussion" },
  { to: "/control/contract", label: "Contract" },
  { to: "/control/intelligence", label: "Intelligence" },
];

export function BidControlNav() {
  return (
    <nav
      className="flex flex-wrap gap-1 rounded-lg border border-border bg-zinc-50/80 p-1"
      aria-label="Bid control sections"
    >
      {links.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "rounded-md px-3 py-2 text-xs font-medium transition-colors",
              isActive
                ? "bg-zinc-900 text-white"
                : "text-ink-muted hover:bg-white hover:text-ink",
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

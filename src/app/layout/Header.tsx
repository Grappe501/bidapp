import { useWorkspace } from "@/context/useWorkspace";

export function Header() {
  const { project } = useWorkspace();

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-border bg-surface-raised px-6">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Active workspace
          </p>
          <p className="truncate text-sm font-semibold text-ink">
            {project.title}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex" aria-hidden />
      </div>
    </header>
  );
}

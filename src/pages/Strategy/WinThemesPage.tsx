import { useState } from "react";
import { StrategySubNav } from "@/components/strategy/StrategySubNav";
import { WinThemeCard } from "@/components/strategy/WinThemeCard";
import { WinThemeEditor } from "@/components/strategy/WinThemeEditor";
import { useStrategy } from "@/context/useStrategy";

export function WinThemesPage() {
  const { winThemes, updateWinTheme } = useStrategy();
  const sorted = [...winThemes].sort((a, b) => a.priority - b.priority);
  const [selectedId, setSelectedId] = useState(sorted[0]?.id ?? "");
  const selected = winThemes.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <StrategySubNav />

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Win themes
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-ink-muted">
            Repeatable persuasive lines across volumes, interview, and discussion —
            keep claims aligned to evidence character in drafting.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-ink">Library</h2>
            <div className="mt-3 space-y-2">
              {sorted.map((t) => (
                <WinThemeCard
                  key={t.id}
                  theme={t}
                  selected={t.id === selectedId}
                  onSelect={() => setSelectedId(t.id)}
                />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink">Editor</h2>
            <div className="mt-3">
              <WinThemeEditor
                theme={selected}
                onSave={(patch) => selected && updateWinTheme(selected.id, patch)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

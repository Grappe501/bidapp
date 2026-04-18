import { evidenceCharacterLabel } from "@/lib/strategy-utils";
import type { Differentiator } from "@/types";

export function DifferentiationMatrix({ rows }: { rows: Differentiator[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-zinc-50/80">
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Differentiator
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Category
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Our position
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Likely competitor gap
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Proof basis
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Strength
            </th>
            <th className="px-3 py-2.5 text-xs font-medium text-ink-subtle">
              Basis type
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} className="border-b border-border last:border-0 align-top">
              <td className="px-3 py-2.5 font-medium text-ink">{d.title}</td>
              <td className="px-3 py-2.5 text-xs text-ink-muted">{d.category}</td>
              <td className="max-w-[220px] px-3 py-2.5 text-xs text-ink-muted">
                {d.ourPosition}
              </td>
              <td className="max-w-[220px] px-3 py-2.5 text-xs text-ink-muted">
                {d.competitorGap}
              </td>
              <td className="max-w-[200px] px-3 py-2.5 text-xs text-ink-muted">
                {d.proofBasis}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-xs font-medium text-ink">
                {d.strength}
              </td>
              <td className="px-3 py-2.5 text-xs text-ink-muted">
                {evidenceCharacterLabel(d.evidenceCharacter)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

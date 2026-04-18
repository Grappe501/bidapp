import { Fragment, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { RequirementCandidate, RequirementResponseCategory, RequirementType } from "@/types";
import {
  REQUIREMENT_RESPONSE_CATEGORIES,
  REQUIREMENT_TYPES,
} from "@/types";

type RequirementCandidateTableProps = {
  candidates: RequirementCandidate[];
  selectedIds: Set<string>;
  onToggleSelect: (candidateId: string, selected: boolean) => void;
  onSelectAll: (select: boolean) => void;
  expandedId: string | null;
  onToggleExpand: (candidateId: string) => void;
  drafts: Record<string, Partial<RequirementCandidate>>;
  onDraftChange: (
    candidateId: string,
    patch: Partial<RequirementCandidate>,
  ) => void;
  onApprove: (candidateId: string) => void;
  onReject: (candidateId: string) => void;
};

function effectiveCandidate(
  c: RequirementCandidate,
  drafts: Record<string, Partial<RequirementCandidate>>,
): RequirementCandidate {
  return { ...c, ...(drafts[c.id] ?? {}) };
}

export function RequirementCandidateTable({
  candidates,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  expandedId,
  onToggleExpand,
  drafts,
  onDraftChange,
  onApprove,
  onReject,
}: RequirementCandidateTableProps) {
  const allSelected = useMemo(
    () =>
      candidates.length > 0 &&
      candidates.every((c) => selectedIds.has(c.id)),
    [candidates, selectedIds],
  );

  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-zinc-50/50 px-6 py-10 text-center text-sm text-ink-muted">
        No candidates in queue for this file. Run extraction on a document that
        has seeded mock output, or choose another source.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-raised shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-zinc-50/80">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  aria-label="Select all candidates"
                />
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Title / summary
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Type
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Mandatory
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Response
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Section
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => {
              const e = effectiveCandidate(c, drafts);
              const open = expandedId === c.id;
              return (
                <Fragment key={c.id}>
                  <tr className="border-b border-border bg-surface-raised">
                    <td className="px-3 py-3 align-top">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={selectedIds.has(c.id)}
                        onChange={(ev) =>
                          onToggleSelect(c.id, ev.target.checked)
                        }
                        aria-label={`Select ${e.proposedTitle}`}
                      />
                    </td>
                    <td className="max-w-[280px] px-3 py-3 align-top">
                      <div className="font-medium text-ink">
                        {e.proposedTitle}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-ink-muted">
                        {e.proposedSummary}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">
                      <Badge variant="neutral">{e.proposedRequirementType}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">
                      <Badge
                        variant={e.proposedMandatory ? "emphasis" : "muted"}
                      >
                        {e.proposedMandatory ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="max-w-[120px] px-3 py-3 align-top text-xs text-ink-muted">
                      {e.proposedResponseCategory}
                    </td>
                    <td className="max-w-[160px] px-3 py-3 align-top text-xs text-ink-muted">
                      {e.proposedSourceSection}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                          onClick={() => onToggleExpand(c.id)}
                        >
                          {open ? "Hide" : "View"}
                        </Button>
                        <Button
                          type="button"
                          className="px-2 py-1 text-xs"
                          onClick={() => onApprove(c.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                          onClick={() => onReject(c.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {open ? (
                    <tr className="border-b border-border bg-zinc-50/50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid gap-4 lg:grid-cols-2">
                          <label className="block space-y-1.5">
                            <span className="text-xs font-medium text-ink-muted">
                              Title
                            </span>
                            <Input
                              value={e.proposedTitle}
                              onChange={(ev) =>
                                onDraftChange(c.id, {
                                  proposedTitle: ev.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="block space-y-1.5">
                            <span className="text-xs font-medium text-ink-muted">
                              Type
                            </span>
                            <Select
                              value={e.proposedRequirementType}
                              onChange={(ev) =>
                                onDraftChange(c.id, {
                                  proposedRequirementType: ev.target
                                    .value as RequirementType,
                                })
                              }
                            >
                              {REQUIREMENT_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </Select>
                          </label>
                          <label className="block space-y-1.5 lg:col-span-2">
                            <span className="text-xs font-medium text-ink-muted">
                              Summary
                            </span>
                            <Textarea
                              rows={3}
                              value={e.proposedSummary}
                              onChange={(ev) =>
                                onDraftChange(c.id, {
                                  proposedSummary: ev.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="block space-y-1.5 lg:col-span-2">
                            <span className="text-xs font-medium text-ink-muted">
                              Verbatim
                            </span>
                            <Textarea
                              rows={4}
                              value={e.proposedVerbatimText}
                              onChange={(ev) =>
                                onDraftChange(c.id, {
                                  proposedVerbatimText: ev.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="block space-y-1.5">
                            <span className="text-xs font-medium text-ink-muted">
                              Section reference
                            </span>
                            <Input
                              value={e.proposedSourceSection}
                              onChange={(ev) =>
                                onDraftChange(c.id, {
                                  proposedSourceSection: ev.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="block space-y-1.5">
                            <span className="text-xs font-medium text-ink-muted">
                              Response category
                            </span>
                            <Select
                              value={e.proposedResponseCategory}
                              onChange={(ev) =>
                                onDraftChange(c.id, {
                                  proposedResponseCategory: ev.target
                                    .value as RequirementResponseCategory,
                                })
                              }
                            >
                              {REQUIREMENT_RESPONSE_CATEGORIES.map((x) => (
                                <option key={x} value={x}>
                                  {x}
                                </option>
                              ))}
                            </Select>
                          </label>
                          <label className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border"
                              checked={e.proposedMandatory}
                              onChange={(ev) =>
                                onDraftChange(c.id, {
                                  proposedMandatory: ev.target.checked,
                                })
                              }
                            />
                            <span className="text-sm text-ink">Mandatory</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

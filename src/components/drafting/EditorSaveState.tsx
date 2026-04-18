type EditorSaveStateProps = {
  hasActiveVersion: boolean;
  isDirty: boolean;
  activeOrdinal: number | null;
  sectionLocked: boolean;
  versionProtected: boolean;
};

export function EditorSaveState({
  hasActiveVersion,
  isDirty,
  activeOrdinal,
  sectionLocked,
  versionProtected,
}: EditorSaveStateProps) {
  if (!hasActiveVersion) {
    return (
      <p className="text-[11px] leading-relaxed text-ink-subtle">
        No active version — generate a draft or save to start version history.
      </p>
    );
  }

  if (sectionLocked) {
    return (
      <p className="text-[11px] leading-relaxed text-ink-muted">
        <span className="font-medium text-ink">Section locked.</span> Text is read-only.
        {activeOrdinal !== null ? ` Viewing version ${activeOrdinal}.` : null}
      </p>
    );
  }

  if (versionProtected) {
    return (
      <p className="text-[11px] leading-relaxed text-ink-muted">
        <span className="font-medium text-ink">Protected version</span>
        {activeOrdinal !== null ? ` (${activeOrdinal})` : ""}. Overwrite active is
        disabled — use <span className="font-medium text-ink">Save new version</span>{" "}
        to branch, or duplicate from the list below.
        {isDirty ? " Unsaved edits are only in the editor until you save." : ""}
      </p>
    );
  }

  if (isDirty) {
    return (
      <p className="text-[11px] leading-relaxed text-amber-950/85">
        <span className="font-medium">Unsaved edits</span>
        {activeOrdinal !== null ? ` on active version ${activeOrdinal}` : ""}.
        Overwrite active updates that version in place; use{" "}
        <span className="font-medium">Save new version</span> to add history.
      </p>
    );
  }

  return (
    <p className="text-[11px] leading-relaxed text-ink-subtle">
      In sync with active version
      {activeOrdinal !== null ? ` (${activeOrdinal})` : ""}. No pending edits.
    </p>
  );
}

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProjectWorkspace } from "@/context/project-workspace-context";
import type { EvidenceItem, RequirementEvidenceLink } from "@/types";
import {
  EvidenceContext,
  type LinkEvidenceInput,
} from "./evidence-context";

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const { workspace } = useProjectWorkspace();
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [links, setLinks] = useState<RequirementEvidenceLink[]>([]);

  useEffect(() => {
    if (!workspace) return;
    setEvidenceItems(workspace.evidence);
    setLinks(workspace.requirementEvidenceLinks);
  }, [workspace]);

  const linkEvidence = useCallback((input: LinkEvidenceInput) => {
    const now = new Date().toISOString();
    setLinks((prev) => {
      const dup = prev.some(
        (l) =>
          l.requirementId === input.requirementId &&
          l.evidenceId === input.evidenceId,
      );
      if (dup) return prev;
      const link: RequirementEvidenceLink = {
        id: crypto.randomUUID(),
        requirementId: input.requirementId,
        evidenceId: input.evidenceId,
        supportStrength: input.supportStrength,
        linkNote: input.linkNote ?? "",
        createdAt: now,
        updatedAt: now,
      };
      return [...prev, link];
    });
  }, []);

  const unlink = useCallback((linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  }, []);

  const updateLink = useCallback(
    (
      linkId: string,
      patch: Partial<
        Pick<RequirementEvidenceLink, "supportStrength" | "linkNote">
      >,
    ) => {
      const touched = new Date().toISOString();
      setLinks((prev) =>
        prev.map((l) =>
          l.id === linkId ? { ...l, ...patch, updatedAt: touched } : l,
        ),
      );
    },
    [],
  );

  const updateEvidence = useCallback((id: string, patch: Partial<EvidenceItem>) => {
    const touched = new Date().toISOString();
    setEvidenceItems((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: touched } : e,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      evidenceItems,
      links,
      linkEvidence,
      unlink,
      updateLink,
      updateEvidence,
    }),
    [evidenceItems, links, linkEvidence, unlink, updateLink, updateEvidence],
  );

  return (
    <EvidenceContext.Provider value={value}>
      {children}
    </EvidenceContext.Provider>
  );
}

import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_ARCHITECTURE_OPTIONS } from "@/data/mockArchitectureOptions";
import type {
  ArchitectureComponent,
  ArchitectureOption,
  ArchitectureOptionStatus,
} from "@/types";
import { ArchitectureContext } from "./architecture-context";

export function ArchitectureProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ArchitectureOption[]>(() => [
    ...MOCK_ARCHITECTURE_OPTIONS,
  ]);

  const updateOption = useCallback((id: string, patch: Partial<ArchitectureOption>) => {
    const touched = new Date().toISOString();
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch, updatedAt: touched } : o)),
    );
  }, []);

  const setRecommendedOption = useCallback((id: string) => {
    const touched = new Date().toISOString();
    setOptions((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              recommended: true,
              status: "Recommended" as ArchitectureOptionStatus,
              updatedAt: touched,
            }
          : { ...o, recommended: false, updatedAt: touched },
      ),
    );
  }, []);

  const setOptionStatus = useCallback(
    (id: string, status: ArchitectureOptionStatus) => {
      updateOption(id, { status });
    },
    [updateOption],
  );

  const replaceComponents = useCallback(
    (optionId: string, components: ArchitectureComponent[]) => {
      updateOption(optionId, { components });
    },
    [updateOption],
  );

  const updateComponent = useCallback(
    (optionId: string, componentId: string, patch: Partial<ArchitectureComponent>) => {
      const touched = new Date().toISOString();
      setOptions((prev) =>
        prev.map((o) => {
          if (o.id !== optionId) return o;
          return {
            ...o,
            components: o.components.map((c) =>
              c.id === componentId ? { ...c, ...patch } : c,
            ),
            updatedAt: touched,
          };
        }),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      options,
      updateOption,
      setRecommendedOption,
      setOptionStatus,
      replaceComponents,
      updateComponent,
    }),
    [
      options,
      updateOption,
      setRecommendedOption,
      setOptionStatus,
      replaceComponents,
      updateComponent,
    ],
  );

  return (
    <ArchitectureContext.Provider value={value}>
      {children}
    </ArchitectureContext.Provider>
  );
}

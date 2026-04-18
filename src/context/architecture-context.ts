import { createContext } from "react";
import type {
  ArchitectureComponent,
  ArchitectureOption,
  ArchitectureOptionStatus,
} from "@/types";

export type ArchitectureContextValue = {
  options: ArchitectureOption[];
  updateOption: (id: string, patch: Partial<ArchitectureOption>) => void;
  setRecommendedOption: (id: string) => void;
  setOptionStatus: (id: string, status: ArchitectureOptionStatus) => void;
  replaceComponents: (optionId: string, components: ArchitectureComponent[]) => void;
  updateComponent: (
    optionId: string,
    componentId: string,
    patch: Partial<ArchitectureComponent>,
  ) => void;
};

export const ArchitectureContext = createContext<ArchitectureContextValue | null>(
  null,
);

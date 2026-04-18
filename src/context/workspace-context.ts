import { createContext } from "react";
import type {
  FileCategory,
  FileRecord,
  FileSourceType,
  Project,
} from "@/types";

export type UploadFileInput = {
  file: globalThis.File;
  category: FileCategory;
  sourceType: FileSourceType;
  tags: string[];
};

export type WorkspaceContextValue = {
  project: Project;
  files: FileRecord[];
  addUploadedFile: (input: UploadFileInput) => void;
  addUploadedFiles: (inputs: UploadFileInput[]) => void;
  updateFile: (id: string, patch: Partial<FileRecord>) => void;
};

export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null,
);

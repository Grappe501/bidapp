import { getLatestFileDocumentByFileId } from "../repositories/document.repo";
import {
  parseDocumentWithAi,
  type AiParseMode,
} from "../services/ai-parsing.service";

export async function runParseDocumentWithAiJob(input: {
  projectId: string;
  fileId: string;
  mode: AiParseMode;
}): Promise<{ fileDocumentId: string; parsedEntityIds: string[] }> {
  const doc = await getLatestFileDocumentByFileId(input.fileId);
  if (!doc) {
    throw new Error(`No file_document for file ${input.fileId}`);
  }
  if (!doc.rawText.trim()) {
    throw new Error("file_document.raw_text is empty — run parse-file first");
  }

  const parsedEntityIds = await parseDocumentWithAi({
    projectId: input.projectId,
    sourceType: "file_document",
    sourceId: doc.id,
    text: doc.rawText,
    mode: input.mode,
  });

  return { fileDocumentId: doc.id, parsedEntityIds };
}

import { getFile } from "../repositories/file.repo";
import { parseAndStoreFileText } from "../services/parsing.service";

export async function runParseFileJob(input: {
  fileId: string;
  text?: string;
  chunkSize?: number;
}): Promise<{ documentId: string; chunkCount: number }> {
  const file = await getFile(input.fileId);
  if (!file) {
    throw new Error(`File not found: ${input.fileId}`);
  }
  const text =
    input.text ??
    `(placeholder) No binary storage yet — pass "text" in request body for file ${file.name}`;
  return parseAndStoreFileText({
    fileId: input.fileId,
    text,
    mimeType: file.fileType ? `application/${file.fileType}` : null,
    chunkSize: input.chunkSize,
  });
}

import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key.trim() === "") {
      throw new Error("OPENAI_API_KEY is not set");
    }
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

export function defaultEmbeddingModel(): string {
  return process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
}

export function defaultParseModel(): string {
  return process.env.OPENAI_PARSE_MODEL ?? "gpt-4o-mini";
}

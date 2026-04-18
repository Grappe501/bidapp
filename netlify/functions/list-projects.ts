import type { Handler } from "@netlify/functions";
import { listProjects } from "../../src/server/repositories/project.repo";
import {
  jsonResponse,
  optionsResponse,
} from "../../src/server/netlify/http";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  try {
    const projects = await listProjects();
    return jsonResponse(200, { projects });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};

import type { Handler } from "@netlify/functions";
import { createProject } from "../../src/server/repositories/project.repo";
import {
  jsonResponse,
  optionsResponse,
  readJson,
} from "../../src/server/netlify/http";

type Body = {
  title: string;
  bidNumber: string;
  issuingOrganization: string;
  dueDate: string;
  status: string;
  shortDescription?: string;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return optionsResponse();
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }
  const body = readJson<Body>(event.body);
  if (
    !body?.title ||
    !body.bidNumber ||
    !body.issuingOrganization ||
    !body.dueDate ||
    !body.status
  ) {
    return jsonResponse(400, { error: "Missing required fields" });
  }
  try {
    const project = await createProject({
      title: body.title,
      bidNumber: body.bidNumber,
      issuingOrganization: body.issuingOrganization,
      dueDate: body.dueDate,
      status: body.status,
      shortDescription: body.shortDescription ?? "",
    });
    return jsonResponse(201, { project });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
};

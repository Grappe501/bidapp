import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import { createProject } from "../../src/server/repositories/project.repo";
import {
  jsonResponse,
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
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body);
  if (
    !body?.title ||
    !body.bidNumber ||
    !body.issuingOrganization ||
    !body.dueDate ||
    !body.status
  ) {
    return jsonResponse(400, { error: "Missing required fields" }, event);
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
    return jsonResponse(201, { project }, event);
  } catch (e) {
    logServerError("create-project", e);
    return internalErrorResponse(event);
  }
};

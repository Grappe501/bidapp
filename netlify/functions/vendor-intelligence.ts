import type { Handler } from "@netlify/functions";
import {
  assertInternalApiKey,
  internalErrorResponse,
  logServerError,
  netlifyRequestPreamble,
} from "../../src/server/netlify/guards";
import {
  jsonResponse,
  readJson,
} from "../../src/server/netlify/http";
import { requireProjectId } from "../../src/server/netlify/require-project-id";
import {
  buildVendorIntelligenceProjectExport,
  loadVendorIntelligenceForBundle,
} from "../../src/server/services/vendor-grounding.service";
import { computeVendorFit } from "../../src/server/services/vendor-fit.service";
import { generateVendorInterviewQuestions } from "../../src/server/services/vendor-interview.service";
import { runVendorResearchJob } from "../../src/server/services/vendor-research.service";
import { computeVendorScore } from "../../src/server/services/vendor-scoring.service";
import {
  evaluateVendorInterviewAnswer,
  normalizeVendorInterviewAnswer,
  saveVendorInterviewAnswer,
} from "../../src/server/services/vendor-interview-answer.service";
import {
  getProjectInterviewReadinessSummary,
  updateVendorInterviewQuestion,
} from "../../src/server/repositories/vendor-interview.repo";
import { loadVendorInterviewWorkspace } from "../../src/server/services/vendor-interview-workspace.service";
import {
  getVendorById,
  updateVendorWebsiteFields,
} from "../../src/server/repositories/vendor.repo";
import {
  runVendorAutoResearchFromWebsite,
  ingestVendorManualUrl,
} from "../../src/server/services/vendor-auto-research.service";
import { listVendorResearchRunsForVendor } from "../../src/server/repositories/vendor-intelligence.repo";
import { countVendorSiteSourcesForVendor } from "../../src/server/repositories/intelligence.repo";
import {
  extractDomainFromUrl,
  normalizeVendorWebsiteUrl,
} from "../../src/server/lib/vendor-site-url";

type Body = {
  action?:
    | "runResearch"
    | "computeFit"
    | "computeScore"
    | "generateInterview"
    | "getSnapshot"
    | "exportProject"
    | "getInterviewWorkspace"
    | "getProjectInterviewReadiness"
    | "saveInterviewAnswer"
    | "normalizeInterviewAnswer"
    | "evaluateInterviewAnswer"
    | "updateInterviewQuestion"
    | "updateVendorWebsite"
    | "runVendorWebsiteResearch"
    | "ingestVendorManualUrl"
    | "getVendorWebsiteStatus";
  projectId?: string;
  vendorId?: string;
  questionId?: string;
  patch?: Record<string, unknown>;
  answer?: Record<string, unknown>;
  websiteUrl?: string;
  manualUrl?: string;
  maxPages?: number;
  maxDepth?: number;
  forceRecrawl?: boolean;
};

export const handler: Handler = async (event) => {
  const block = netlifyRequestPreamble(event);
  if (block) return block;
  const denied = assertInternalApiKey(event);
  if (denied) return denied;
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, event);
  }
  const body = readJson<Body>(event.body) ?? {};
  const projectId = requireProjectId(body, event);
  if (typeof projectId !== "string") return projectId;
  const action = body.action ?? "getSnapshot";
  const vendorId = body.vendorId?.trim() ?? "";

  try {
    if (action === "exportProject") {
      const data = await buildVendorIntelligenceProjectExport(projectId);
      return jsonResponse(200, data, event);
    }

    if (action === "getProjectInterviewReadiness") {
      const data = await getProjectInterviewReadinessSummary(projectId);
      return jsonResponse(200, data, event);
    }

    if (!vendorId) {
      return jsonResponse(400, { error: "vendorId required" }, event);
    }

    if (action === "runResearch") {
      const result = await runVendorResearchJob({ projectId, vendorId });
      return jsonResponse(200, result, event);
    }
    if (action === "computeFit") {
      const result = await computeVendorFit({ projectId, vendorId });
      return jsonResponse(200, result, event);
    }
    if (action === "computeScore") {
      const result = await computeVendorScore(vendorId);
      return jsonResponse(200, result, event);
    }
    if (action === "generateInterview") {
      const result = await generateVendorInterviewQuestions(vendorId, projectId);
      return jsonResponse(200, result, event);
    }

    if (action === "getInterviewWorkspace") {
      const workspace = await loadVendorInterviewWorkspace({
        projectId,
        vendorId,
      });
      return jsonResponse(200, workspace, event);
    }

    if (action === "updateInterviewQuestion") {
      const qid = body.questionId?.trim() ?? "";
      if (!qid) {
        return jsonResponse(400, { error: "questionId required" }, event);
      }
      const patch = body.patch ?? {};
      await updateVendorInterviewQuestion({
        id: qid,
        vendorId,
        patch: patch as Parameters<typeof updateVendorInterviewQuestion>[0]["patch"],
      });
      return jsonResponse(200, { ok: true }, event);
    }

    if (action === "saveInterviewAnswer") {
      const result = await saveVendorInterviewAnswer({
        projectId,
        vendorId,
        payload: (body.answer ?? {}) as Parameters<
          typeof saveVendorInterviewAnswer
        >[0]["payload"],
      });
      return jsonResponse(200, result, event);
    }

    if (action === "normalizeInterviewAnswer") {
      const qid = body.questionId?.trim() ?? "";
      if (!qid) {
        return jsonResponse(400, { error: "questionId required" }, event);
      }
      const result = await normalizeVendorInterviewAnswer({
        vendorId,
        questionId: qid,
      });
      return jsonResponse(200, result, event);
    }

    if (action === "evaluateInterviewAnswer") {
      const qid = body.questionId?.trim() ?? "";
      if (!qid) {
        return jsonResponse(400, { error: "questionId required" }, event);
      }
      const result = await evaluateVendorInterviewAnswer({
        vendorId,
        questionId: qid,
      });
      return jsonResponse(200, result, event);
    }

    if (action === "updateVendorWebsite") {
      const raw = (body.websiteUrl ?? "").trim();
      if (!raw) {
        await updateVendorWebsiteFields({
          vendorId,
          websiteUrl: "",
          vendorDomain: "",
          websiteCrawlStatus: "",
          websiteCrawlError: "",
        });
        const v = await getVendorById(vendorId);
        return jsonResponse(200, { vendor: v }, event);
      }
      const normalized = normalizeVendorWebsiteUrl(raw);
      if (!normalized) {
        return jsonResponse(400, { error: "Invalid website URL" }, event);
      }
      const domain = extractDomainFromUrl(normalized);
      await updateVendorWebsiteFields({
        vendorId,
        websiteUrl: normalized,
        vendorDomain: domain,
      });
      const v = await getVendorById(vendorId);
      return jsonResponse(200, { vendor: v }, event);
    }

    if (action === "getVendorWebsiteStatus") {
      const v = await getVendorById(vendorId);
      if (!v || v.projectId !== projectId) {
        return jsonResponse(400, { error: "Vendor not found" }, event);
      }
      const pagesStored = await countVendorSiteSourcesForVendor({
        projectId,
        vendorId,
      });
      const runs = await listVendorResearchRunsForVendor(vendorId, 12);
      return jsonResponse(
        200,
        {
          websiteUrl: v.websiteUrl,
          vendorDomain: v.vendorDomain,
          websiteLastCrawledAt: v.websiteLastCrawledAt,
          websiteCrawlStatus: v.websiteCrawlStatus,
          websiteCrawlError: v.websiteCrawlError,
          pagesStored,
          runs,
        },
        event,
      );
    }

    if (action === "runVendorWebsiteResearch") {
      const result = await runVendorAutoResearchFromWebsite({
        projectId,
        vendorId,
        maxPages: body.maxPages,
        maxDepth: body.maxDepth,
        forceRecrawl: body.forceRecrawl === true,
      });
      const v = await getVendorById(vendorId);
      return jsonResponse(200, { ...result, vendor: v }, event);
    }

    if (action === "ingestVendorManualUrl") {
      const u = (body.manualUrl ?? "").trim();
      if (!u) {
        return jsonResponse(400, { error: "manualUrl required" }, event);
      }
      const result = await ingestVendorManualUrl({
        projectId,
        vendorId,
        url: u,
      });
      const v = await getVendorById(vendorId);
      return jsonResponse(200, { ...result, vendor: v }, event);
    }

    const snapshot = await loadVendorIntelligenceForBundle({
      projectId,
      vendorId,
    });
    return jsonResponse(200, { snapshot }, event);
  } catch (e) {
    logServerError("vendor-intelligence", e);
    return internalErrorResponse(event);
  }
};

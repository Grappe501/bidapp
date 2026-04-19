import { getVendorById } from "../repositories/vendor.repo";
import {
  getInterviewReadinessSummaryForVendor,
  listVendorInterviewQuestionsFull,
  getVendorInterviewAnswerByQuestion,
  getVendorInterviewAssessmentByQuestion,
} from "../repositories/vendor-interview.repo";
import type { VendorInterviewWorkspacePayload } from "../../types";

export async function loadVendorInterviewWorkspace(input: {
  projectId: string;
  vendorId: string;
}): Promise<VendorInterviewWorkspacePayload> {
  const v = await getVendorById(input.vendorId);
  if (!v || v.projectId !== input.projectId) {
    throw new Error("Vendor not found for project");
  }
  const questions = await listVendorInterviewQuestionsFull(input.vendorId);
  const rows = await Promise.all(
    questions.map(async (q) => ({
      question: q,
      answer: await getVendorInterviewAnswerByQuestion(q.id),
      assessment: await getVendorInterviewAssessmentByQuestion(q.id),
    })),
  );
  const summary = await getInterviewReadinessSummaryForVendor(input.vendorId);
  return {
    vendorId: v.id,
    vendorName: v.name,
    summary,
    rows,
  };
}

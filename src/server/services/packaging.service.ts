import {
  assembleOutputBundles,
  buildBundlePayload,
  computePackagingCompleteness,
} from "../../lib/output-utils";
import type {
  OutputArtifact,
  OutputBundle,
  OutputBundleType,
  PackagingCompleteness,
  RedactionFlag,
} from "../../types";

export function buildSubmissionBundles(
  projectId: string,
  artifacts: OutputArtifact[],
  redactionFlags: RedactionFlag[],
): OutputBundle[] {
  return assembleOutputBundles(projectId, artifacts, redactionFlags);
}

export function evaluateBundleCompleteness(
  bundleType: OutputBundleType,
  artifacts: OutputArtifact[],
): PackagingCompleteness {
  return computePackagingCompleteness(bundleType, artifacts);
}

export function serializeBundleForExport(
  bundle: OutputBundle,
  artifacts: OutputArtifact[],
): Record<string, unknown> {
  return buildBundlePayload(bundle, artifacts);
}

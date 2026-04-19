import {
  shouldSkipUrlPath,
  type VendorSitePageType,
} from "./vendor-page-classification";

/** Score outbound links for priority-queue crawl ordering. */
export function scoreLinkForCrawl(input: {
  hrefPath: string;
  anchorText: string;
  parentPageType: VendorSitePageType;
}): number {
  if (shouldSkipUrlPath(input.hrefPath)) return -100;
  const blob = `${input.hrefPath} ${input.anchorText}`.toLowerCase();
  let s = 40;
  if (/integrat|api|fhir|hl7|ehr|matrixcare|developer|docs/i.test(blob)) s += 45;
  if (/security|hipaa|compliance|soc/i.test(blob)) s += 35;
  if (/case|customer|success|implementation/i.test(blob)) s += 30;
  if (/pharmacy|ltc|long.?term|medicaid|clinical|hdc|skilled/i.test(blob)) s += 25;
  if (/product|solution|service|platform/i.test(blob)) s += 15;
  if (/careers|job|blog|news/i.test(blob)) s -= 20;
  if (
    input.parentPageType === "integration_page" ||
    input.parentPageType === "api_docs"
  ) {
    s += 10;
  }
  return s;
}

export function mergePageScores(
  typeWeight: number,
  linkScore: number,
  depth: number,
): number {
  return typeWeight * 0.55 + linkScore * 0.35 - depth * 8;
}

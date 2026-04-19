/**
 * Heuristic page typing for vendor public-site crawls (bid-facing evidence weighting).
 */

export type VendorSitePageType =
  | "product_page"
  | "integration_page"
  | "api_docs"
  | "security_page"
  | "case_study"
  | "customer_page"
  | "support_page"
  | "company_overview"
  | "pricing_page"
  | "leadership_page"
  | "blog_relevant"
  | "blog_irrelevant"
  | "low_value_page"
  | "other";

const LOW_VALUE_PATH = /\/(careers?|jobs?|cookie|gdpr)(\/|$)/i;
const BLOG_PATH = /\/(blog|news|press|insights?|articles?)(\/|$)/i;
const SKIP_HEAVY = /\/(cart|checkout|login|signin|signup|register|account|password)(\/|$)/i;

export function classifyVendorPage(input: {
  urlPath: string;
  title: string;
  textSample: string;
}): VendorSitePageType {
  const path = input.urlPath.toLowerCase();
  const blob = `${path} ${input.title.toLowerCase()} ${input.textSample.slice(0, 6000).toLowerCase()}`;

  if (SKIP_HEAVY.test(path) || /login|sign in|register/i.test(input.title)) {
    return "low_value_page";
  }
  if (LOW_VALUE_PATH.test(path)) return "low_value_page";

  if (BLOG_PATH.test(path)) {
    const health =
      /pharmacy|health|ltc|ehr|hipaa|medicaid|clinical|integration|care|hospital/i.test(
        blob,
      );
    return health ? "blog_relevant" : "blog_irrelevant";
  }

  if (
    /\/(api|developer|docs|documentation|interoperability|fhir|hl7|webhook)/i.test(
      path,
    ) ||
    /\b(api|fhir|hl7|webhook|rest api|developer)\b/i.test(blob)
  ) {
    return "api_docs";
  }
  if (
    /integrat|interface|connect|matrixcare|ehr|emr|interoperability/i.test(blob) &&
    !/careers/i.test(blob)
  ) {
    return "integration_page";
  }
  if (
    /security|hipaa|soc\s*2|hitrust|compliance|privacy|phi|encryption|breach/i.test(
      blob,
    )
  ) {
    return "security_page";
  }
  if (
    /case study|success stor|customer stor|implementation|white\s*paper/i.test(blob)
  ) {
    return "case_study";
  }
  if (/customer|client|who we serve|testimonial|reference/i.test(blob)) {
    return "customer_page";
  }
  if (/support|help center|sla|service desk|ticket/i.test(blob)) {
    return "support_page";
  }
  if (/pricing|plan|fee|cost|quote/i.test(blob)) {
    return "pricing_page";
  }
  if (/about|leadership|team|executive|board|company/i.test(blob)) {
    if (/leadership|team|executive|board|management/i.test(blob))
      return "leadership_page";
    return "company_overview";
  }
  if (
    /product|solution|service|platform|offering|software|suite/i.test(blob)
  ) {
    return "product_page";
  }
  if (path === "/" || path === "") return "company_overview";
  return "other";
}

/** Higher = crawl / keep first when budget-limited. */
export function pageTypeEvidenceWeight(t: VendorSitePageType): number {
  const w: Record<VendorSitePageType, number> = {
    integration_page: 95,
    api_docs: 92,
    security_page: 88,
    case_study: 86,
    customer_page: 80,
    product_page: 78,
    support_page: 65,
    pricing_page: 72,
    company_overview: 70,
    leadership_page: 55,
    blog_relevant: 58,
    blog_irrelevant: 35,
    low_value_page: 10,
    other: 50,
  };
  return w[t] ?? 50;
}

export function shouldSkipUrlPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  if (SKIP_HEAVY.test(p)) return true;
  if (/\.(pdf|zip|png|jpe?g|gif|webp|svg|ico|mp4|woff2?)(\?|$)/i.test(p))
    return true;
  return false;
}

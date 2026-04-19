/**
 * Re-exports shared Netlify access checks for consistent handler imports.
 *
 * Production verification: `scripts/netlify-deploy-checklist.md`, `npm run check:netlify-prod-env`.
 */
export {
  assertInternalApiKey,
  assertPrivateDeployConfigured,
  netlifyRequestPreamble,
} from "./guards";

# Private deploy smoke test

Repeatable checklist for a **controlled private / internal** launch (shared secret + CORS + Postgres). This is **not** a substitute for full auth or public-internet hardening.

For **Netlify production** specifically, use **`scripts/netlify-deploy-checklist.md`** first (build vs runtime vars, origin, project id), then use this file for deeper workflow checks.

## A. Environment

1. Run `npx tsx scripts/check-private-deploy-env.ts` (or `npm run check:private-deploy-env` if configured). Resolve failures and warnings you care about.
2. Confirm Netlify (or `netlify dev`) has: `DATABASE_URL`, `OPENAI_API_KEY`, `INTERNAL_API_KEY`, `ALLOWED_ORIGIN`, `STRICT_DB_MODE=true`, and matching Vite build vars (`VITE_*`) per `ENVIRONMENT_SETUP.md`.
3. Start the app (`netlify dev` or production URL) and open the UI — `SystemConfigGate` should not block when required `VITE_*` vars are set.
4. `GET /.netlify/functions/db-health` with allowed `Origin` and optional `x-api-key` (if `INTERNAL_API_KEY` is set) should return JSON (200 / 503 on DB failure — not opaque HTML errors).

## B. Access control

1. Call any protected function (e.g. `POST /.netlify/functions/list-projects` with JSON `{"projectId":"<valid-uuid>"}`) **without** `x-api-key` when `INTERNAL_API_KEY` is set → **401** `{ "error": "Unauthorized" }`.
2. From a browser origin **not** in `ALLOWED_ORIGIN` (when using an explicit list), expect **403** `{ "error": "Origin not allowed" }` on API calls.
3. With correct `x-api-key` and an allowed `Origin`, the same request succeeds (**200** with data or **404** if project missing).

## C. DB-first behavior

1. Load the app with a real `VITE_DEFAULT_PROJECT_ID` — workspace banner should clear when the project exists.
2. Core workspace lists (files, requirements, etc.) should reflect Postgres for that project, not placeholder demo labels.
3. Empty tables should show explicit empty states, not silent mock substitutions.

## D. Workflow (happy path)

1. Load branding profile (AllCare panel — project-scoped).
2. Run AllCare scrape (project id in body).
3. Build a grounding bundle (`build-grounding-bundle`).
4. Generate draft (`generate-draft` — structured or bundle mode as you use).
5. Save draft version (`save-draft-version`).
6. Run prose review (`review-draft-prose`) if used in your flow.
7. Open Output / readiness views and confirm artifacts line up with DB-backed drafts.

## E. Persistence

1. Refresh the browser — draft sections/versions and workspace data should reload from the API/DB.
2. Optional: clear `localStorage` keys that are not the source of truth for your check; DB-backed rows should still appear after reload.

## F. Failure tests

1. Omit `projectId` on a project-scoped function → **400** `{ "error": "projectId is required" }` (or matching message).
2. Omit API key when `INTERNAL_API_KEY` is set → **401**.
3. Request a non-existent project id where applicable → **404** or empty list with explicit UI messaging.

## G. Caveats

- `generate-draft` **structured** mode and `review-draft-prose` are **stateless LLM** paths (no `projectId` in the handler); they are still gated by API key + CORS.
- `list-projects` is a **scoped helper** (one id in, zero or one row out), not a global project listing.
- Strategy and some control surfaces use **browser storage** or **reference mock data**; see page copy in strict mode and `CURRENT_STATE.md`.

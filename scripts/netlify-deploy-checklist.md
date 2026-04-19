# Netlify production deploy checklist

Controlled **private** deployment: shared API key + origin allowlist + Postgres. Not a public multi-tenant posture.

## Build-time vs runtime (Netlify)

| Variable | Where to set | When it applies |
|----------|----------------|-----------------|
| `VITE_*` | **Build** (and often “Build environment” in UI) | Baked into the static bundle at `npm run build` |
| `DATABASE_URL`, `INTERNAL_API_KEY`, `ALLOWED_ORIGIN`, `OPENAI_API_KEY`, `STRICT_DB_MODE` | **Functions** runtime | Every serverless invocation |

Changing a `VITE_*` value requires a **new build**. Changing function secrets does **not** require a rebuild (trigger redeploy or wait for next invocation).

## Before deploy

- [ ] **Netlify → Site settings → Environment variables**
  - [ ] **Functions:** `DATABASE_URL`, `INTERNAL_API_KEY`, `ALLOWED_ORIGIN`, `OPENAI_API_KEY`, `STRICT_DB_MODE=true`
  - [ ] **Build:** `VITE_FUNCTIONS_BASE_URL`, `VITE_DEFAULT_PROJECT_ID`, `VITE_STRICT_DB_MODE=true`, `VITE_INTERNAL_API_KEY` (same value as `INTERNAL_API_KEY`)
- [ ] **Production origin:** `ALLOWED_ORIGIN` is exactly your live site origin (e.g. `https://<your-site>.netlify.app`) — **no** `*`
- [ ] **`VITE_FUNCTIONS_BASE_URL`:** same origin the browser uses to call `/.netlify/functions/*` (usually **https** + your production hostname, **no** trailing slash)
- [ ] **`VITE_DEFAULT_PROJECT_ID`:** UUID of the live Postgres project row (confirm with `SELECT id, bid_number FROM projects WHERE ...` against production DB)
- [ ] **Preview deploys:** either add preview origins to `ALLOWED_ORIGIN` (comma-separated) or accept that preview sites will get CORS failures unless origins match
- [ ] Local preflight: `npm run check:netlify-prod-env` (with production-equivalent `.env` or exported vars)
- [ ] `npm run build` succeeds locally with the same `VITE_*` you will use in CI/Netlify

## After deploy

- [ ] App loads at the production URL without `SystemConfigGate` blocking (all required `VITE_*` present at build)
- [ ] `POST /.netlify/functions/list-projects` with body `{"projectId":"<uuid>"}` **without** `x-api-key` → **401** (when `INTERNAL_API_KEY` is set)
- [ ] Same request **with** `x-api-key` and browser **Origin** in `ALLOWED_ORIGIN` → **200** or expected empty/list
- [ ] **Dashboard** shows workspace / project context (no persistent “missing project” error)
- [ ] **Intelligence** page loads; optional: run ingest / scrape against test inputs
- [ ] **Drafts:** open `/drafts`, list sections, run a small generate/save if you use OpenAI in prod
- [ ] **Output / readiness** routes load without obvious mock substitution for DB-backed data
- [ ] Optional operator check: `POST /.netlify/functions/prod-readiness` with `x-api-key` and JSON `{"projectId":"<uuid>"}` — expect `database: "reachable"`, `projectCheck: "found"`, `openaiConfigured: true` when configured

## OpenAI / expensive functions

All of these use the shared guards (`INTERNAL_API_KEY`, CORS). They need **`OPENAI_API_KEY`** on the **functions** runtime where applicable; if OpenAI is down or the key is invalid, responses should be **5xx** with generic `{ "error": "Internal server error" }` (details in Netlify function logs only).

| Function | Needs OpenAI |
|----------|----------------|
| `generate-draft` | Yes |
| `parse-document-ai` | Yes |
| `enrich-company` | Yes (typical paths) |
| `scrape-allcare-site` | Often (optional AI parse flags) |
| `build-grounding-bundle` | Typically embeddings / model use |

## Rollback / triage

| Symptom | Check |
|--------|--------|
| **401** on all API calls | `x-api-key` header; `INTERNAL_API_KEY` on Functions; `VITE_INTERNAL_API_KEY` matches at **build** time |
| Browser CORS errors | `ALLOWED_ORIGIN` includes **exact** page origin (scheme + host + port); no typo |
| Calls go to wrong host | `VITE_FUNCTIONS_BASE_URL` in the **built** bundle (rebuild after changing) |
| Empty / missing project data | `VITE_DEFAULT_PROJECT_ID`; DB seed/migrations against the same `DATABASE_URL` Netlify uses |
| AI features fail silently or 500 | `OPENAI_API_KEY` on Functions; quotas; logs |

## Related docs

- `ENVIRONMENT_SETUP.md` — variable reference and dev vs prod rules
- `DEPLOYMENT_PROTOCOL.md` — Netlify contexts and posture
- `scripts/private-deploy-smoke-test.md` — broader smoke pass

# Deployment protocol

**Host:** Netlify (per product plan)

## Build settings

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Publish directory | `dist` |

## Branch / context

- Deploy on milestone readiness (see `BUILD_BLUEPRINT.md`), not ad hoc pushes.
- Pair each deploy with a short release note, known limitations, and next priority.

## Environment: two Netlify scopes

1. **Build environment** — variables available when Netlify runs `npm run build`. Only **`VITE_*`** (and other non-secret build vars) are embedded into the static bundle.
2. **Functions environment** — variables available to `netlify/functions/*` at runtime (`DATABASE_URL`, `INTERNAL_API_KEY`, `OPENAI_API_KEY`, `ALLOWED_ORIGIN`, `STRICT_DB_MODE`, etc.).

If you change a **`VITE_*`** value in the Netlify UI, you **must trigger a new build**. If you change a functions secret, the next function invocation picks it up (no rebuild required).

## Production URL and CORS

- **Rule:** `ALLOWED_ORIGIN` must list the **exact** browser origin(s) that will call functions (scheme + host + port). **No wildcard** for production private deploys.
- **Production SPA:** typically `https://<your-subdomain>.netlify.app` (or your custom domain). Set **`ALLOWED_ORIGIN`** to that value (comma-separate multiple allowed origins if needed).
- **Local dev:** `http://localhost:8888` (or whatever `netlify dev` prints) must appear in `ALLOWED_ORIGIN` when testing against local functions.
- **Deploy previews:** optional. To use them, add each preview origin pattern you care about (e.g. `https://deploy-preview-123--mysite.netlify.app`) or accept that previews without a matching origin will fail CORS.

Full variable tables: **`ENVIRONMENT_SETUP.md`**.

## Private / internal production posture

- **Functions:** `STRICT_DB_MODE=true`, `INTERNAL_API_KEY`, `ALLOWED_ORIGIN`, `DATABASE_URL`, `OPENAI_API_KEY` (for AI paths).
- **Build:** `VITE_FUNCTIONS_BASE_URL`, `VITE_DEFAULT_PROJECT_ID`, `VITE_STRICT_DB_MODE=true`, `VITE_INTERNAL_API_KEY` (same value as `INTERNAL_API_KEY`).
- **Preflight (local, before promoting):** `npm run check:netlify-prod-env` with production-equivalent values.
- **After deploy:** **`scripts/netlify-deploy-checklist.md`** (and `scripts/private-deploy-smoke-test.md` for a deeper pass).

### Optional operator endpoint

- **`POST /.netlify/functions/prod-readiness`** — JSON body optional `{ "projectId": "<uuid>" }`. Requires **`x-api-key`** when `INTERNAL_API_KEY` is set. Returns only safe flags (`database`, `projectCheck`, `openaiConfigured`, `strictDbMode`). Does not echo secrets.

### `db-health`

- **`GET /.netlify/functions/db-health`** — With **`INTERNAL_API_KEY`** set in production, callers must send **`x-api-key`**; response is minimal (`ok`, `database` / generic error). No stack traces or connection strings in the body.

## Security stance

Functions rely on a **shared API key** and **origin allowlisting**, not end-user sessions. Appropriate for many **internal** operator deployments; **not** a substitute for full auth on the public internet. See `CURRENT_STATE.md`.

## CORS behavior summary

Browser requests must include an **`Origin`** header value present in **`ALLOWED_ORIGIN`**. `OPTIONS` preflight uses the same rules. Misconfigured strict deploy returns **503** JSON from the shared preamble before business logic runs.

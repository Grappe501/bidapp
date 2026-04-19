# Environment setup

**Full local run (Docker Postgres, migrate, seed, `netlify dev`):** see **`docs/LOCAL_DEVELOPMENT.md`**.

## Prerequisites

- [Node.js](https://nodejs.org/) LTS (includes `npm`)
- Optional **Neon** (or compatible Postgres) + **OpenAI** key when using DB-backed features and Netlify functions

## Install

From the repository root:

```bash
npm install
```

## Environment variables

1. Copy the template and edit **secrets locally** (`.env` is gitignored):

   ```bash
   cp .env.example .env
   ```

2. In **`.env`**:

   - **`DATABASE_URL`** — Neon dashboard → copy the full connection string with the **real** password (`sslmode=require`).
   - **`OPENAI_API_KEY`** — required on the **function runtime** for embed / parse / enrich / generate when those code paths run.
   - **`VITE_FUNCTIONS_BASE_URL`** — e.g. `http://localhost:8888` when using `netlify dev`, or your deployed site URL (same origin as the SPA or the URL the UI uses to call functions).
   - **`VITE_DEFAULT_PROJECT_ID`** — after seed, run `npm run db:print-project-id` (or `SELECT id, bid_number FROM projects;`) and paste the **S000000479** row’s `id` into `.env` (never commit real ids).
   - **`ALLOWED_ORIGIN`** — comma-separated list of **exact** browser origins allowed to call Netlify functions (e.g. `https://your-site.netlify.app` or `http://localhost:8888`). **Not** `*` in production-style setups.
   - **`INTERNAL_API_KEY`** — shared secret; browser sends `x-api-key` (see `VITE_INTERNAL_API_KEY` below). **Required** when `STRICT_DB_MODE=true`.
   - **`STRICT_DB_MODE`** — when `true`, functions enforce: `INTERNAL_API_KEY`, non-empty `ALLOWED_ORIGIN`, and stricter company/profile scoping. Use for **private/internal** deploys.

3. **Private / strict client build** (must mirror server secret):

   - **`VITE_STRICT_DB_MODE=true`**
   - **`VITE_INTERNAL_API_KEY`** — same value as **`INTERNAL_API_KEY`** (embedded in the client bundle for this private model — acceptable only behind network controls; **not** a public-internet pattern).

4. Validate before deploy:

   ```bash
   npm run check:private-deploy-env
   ```

5. **Never** commit `.env` or paste live passwords/API keys into docs or chat. Rotate any key that was exposed.

### Netlify production checklist (variables)

Use **placeholder names** in your own runbook; do not paste real keys into tickets.

**Functions runtime (serverless — not prefixed with `VITE_`):**

| Variable | Required for private prod | Notes |
|----------|---------------------------|--------|
| `DATABASE_URL` | Yes | Neon (or compatible) URI; same DB the app must use |
| `INTERNAL_API_KEY` | Yes | Shared secret; must match `VITE_INTERNAL_API_KEY` in the built client |
| `ALLOWED_ORIGIN` | Yes when `STRICT_DB_MODE=true` | Comma-separated **exact** origins, e.g. `https://your-site.netlify.app` — **not** `*` |
| `OPENAI_API_KEY` | Yes for AI features | Required for embed, parse, enrich, draft generation, etc. |
| `STRICT_DB_MODE` | Yes for private prod | Must be `true` to match strict client build |
| `OPENAI_EMBEDDING_MODEL`, `OPENAI_PARSE_MODEL`, … | Optional | Only if you override defaults |

**Build / client (baked into `dist/` at build time — prefixed with `VITE_`):**

| Variable | Required for private prod | Notes |
|----------|---------------------------|--------|
| `VITE_FUNCTIONS_BASE_URL` | Yes | Base URL the browser uses for `/.netlify/functions/*` — typically **`https://<your-production-host>`** (same site or explicit API host), **no** trailing slash |
| `VITE_DEFAULT_PROJECT_ID` | Yes | UUID of the **live** `projects` row in production Postgres (not a dev-only id) |
| `VITE_STRICT_DB_MODE` | Yes | Set to `true` to align with `STRICT_DB_MODE` on functions |
| `VITE_INTERNAL_API_KEY` | Yes | Same string as `INTERNAL_API_KEY` (private-operator model only) |

**Dev vs prod (do not mix):**

- **Local `netlify dev`:** often `http://localhost:8888` for both page and `VITE_FUNCTIONS_BASE_URL`; `ALLOWED_ORIGIN` includes `http://localhost:8888`.
- **Production:** `VITE_FUNCTIONS_BASE_URL` and the browser’s origin are **`https://…`**; `ALLOWED_ORIGIN` lists **only** the production origin(s) you allow (plus optional preview origins if you support them — see below).

**Preview deploys:** Each Netlify Deploy Preview has its own origin (`https://deploy-preview-NNN--site.netlify.app`). Either add each preview origin to `ALLOWED_ORIGIN` when testing previews, or rely on **production** deploys only (previews will fail CORS until the origin is listed).

**Confirming the production project id:** Run against the **same** database Netlify uses: `SELECT id, bid_number, title FROM projects ORDER BY updated_at DESC;` — set `VITE_DEFAULT_PROJECT_ID` to the intended row’s `id`. The seed id in `.env.example` is a **developer default**, not a substitute for confirming production data.

**Preflight before pushing to production:**

```bash
npm run check:netlify-prod-env
```

**Operator readiness (after deploy, requires `x-api-key`):** `POST /.netlify/functions/prod-readiness` with JSON body `{"projectId":"<uuid>"}` returns `database`, `projectCheck`, `openaiConfigured` (booleans / enums only — no secrets). See `scripts/netlify-deploy-checklist.md`.

## Database: migrate then seed

From the project root (with `DATABASE_URL` set in `.env`; scripts load it via `dotenv` if configured, or export vars in your shell):

```bash
npm run db:migrate
npm run db:seed
```

- **Migrate** applies `schema.sql` / migrations (creates tables, `schema_migrations`, etc.).
- **Seed** inserts the demo bid (**S000000479**) and related rows if that bid does not already exist.

If migrate fails, fix connection string / SSL / network before continuing.

## Development

**Frontend only** (not recommended when testing DB-backed flows):

```bash
npm run dev
```

**Frontend + Netlify functions** (recommended when testing DB + API):

```bash
netlify dev
```

Open the URL the CLI prints (often `http://localhost:8888` for the site proxy). Set **`ALLOWED_ORIGIN`** to that origin (e.g. `http://localhost:8888`) so CORS matches.

### ALLOWED_ORIGIN quick reference

| Context | Example |
|--------|---------|
| `netlify dev` | `http://localhost:8888` (or the exact origin shown by the CLI) |
| Netlify preview | `https://deploy-preview-123--your-site.netlify.app` |
| Production | `https://your-prod-domain.netlify.app` |

Multiple values: `ALLOWED_ORIGIN=https://a.app,https://b.app`

With **`STRICT_DB_MODE=false`** and **`ALLOWED_ORIGIN` unset**, functions allow localhost origins and `*` fallback for tooling — convenient for local dev only.

## Production build (local check)

```bash
npm run build
npm run preview
```

## Verify DB-backed behavior

1. **Dashboard** — scoped project check and workspace load when functions + DB are live.
2. **Intelligence** — URL ingest persists when the ingest function and DB succeed.
3. **Drafting** — versions persist when draft Netlify functions and DB are configured.
4. **Smoke test** — follow `scripts/private-deploy-smoke-test.md` and `scripts/netlify-deploy-checklist.md` before a private launch.

If something still behaves like a static mock, check `VITE_FUNCTIONS_BASE_URL`, `DATABASE_URL`, browser network calls to functions, and page-level copy for strict mode.

**Live AllCare branding** comes from `get-branding-profile` (via `AppBrandingProvider`) when functions are configured — not from separate demo flags. See `scripts/live-workflow-walkthrough.md` for a suggested review path.

## Posture

This stack is appropriate for a **controlled private deployment** (VPN, allowlisted IPs, shared internal secret). It is **not** presented as safe for arbitrary public internet traffic without stronger authentication layers.

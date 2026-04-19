# Local development (from scratch)

Run the app with a real Postgres database, migrations, seed data, and Netlify functions on your machine.

## Prerequisites

- **Node.js** LTS (includes `npm`)
- **Docker Desktop** (or compatible engine) — *recommended* for local Postgres
- **Netlify CLI** — for `netlify dev` (or use `npx netlify dev` without a global install)
- **OpenAI API key** — required for AI-backed functions (embed, parse, drafts, Agent Malone, etc.)

## Quick start (bottom up)

1. `cp .env.example .env` and fill `DATABASE_URL`, `OPENAI_API_KEY`, and (after seed) `VITE_DEFAULT_PROJECT_ID` from `npm run db:print-project-id`. For local Docker Postgres, set `DATABASE_URL` and `PGSSLMODE=disable` as in the table below. Set `ALLOWED_ORIGIN=http://localhost:8888` and keep `STRICT_DB_MODE=false` unless you need production parity.
2. **Start Postgres:** `npm run local:postgres` (or `docker compose up -d` from the repo root). Start **Docker Desktop** first on Windows/macOS.
3. **Migrate + seed:** `npm run local:stack` (same as `docker compose up -d && npm run db:migrate && npm run db:seed`), or `npm run lift:db` if Postgres is already running.
4. **Run the app:** `npm run dev:netlify` (runs `npx netlify-cli dev`). Open **http://localhost:8888** — the SPA and Netlify functions share this origin, so `VITE_FUNCTIONS_BASE_URL` can be unset or `http://localhost:8888`.
5. If you use **`npm run dev`** (Vite on port 5173) **with** Netlify functions in another terminal, leave `VITE_FUNCTIONS_BASE_URL` unset or set it to `http://localhost:8888` and run `netlify dev` there; the app defaults API calls to that URL when the page is on localhost:5173.

## 1. Clone and install

```bash
git clone <your-fork-or-repo-url> BidApp
cd BidApp
npm install
```

## 2. Environment file

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable | Local Docker Postgres | Notes |
|----------|----------------------|--------|
| `DATABASE_URL` | `postgresql://bidapp:bidapp_local_dev@localhost:5432/bidapp?sslmode=disable` | Matches `docker-compose.yml` |
| `PGSSLMODE` | `disable` | Helps `pg` against local Postgres without SSL |
| `OPENAI_API_KEY` | *(your key)* | Server-side; never commit |
| `VITE_FUNCTIONS_BASE_URL` | `http://localhost:8888` | URL where **Netlify dev** serves the SPA + functions |
| `VITE_DEFAULT_PROJECT_ID` | *(from `npm run db:print-project-id` after seed)* | Must match the **S000000479** row in `projects` (see below) |
| `ALLOWED_ORIGIN` | `http://localhost:8888` | Must match the browser origin you use |
| `INTERNAL_API_KEY` | *(any long random string)* | Same value as `VITE_INTERNAL_API_KEY` if you enable strict client mode |
| `STRICT_DB_MODE` | `false` | Simplest local setup; set `true` only if you mirror production rules |

To print the seed project id anytime (must match after `db:seed`):

```bash
npm run db:print-project-id
```

## 3. Start Postgres (Docker)

From the repo root:

```bash
docker compose up -d
```

Wait until healthy (`docker compose ps`). If port `5432` is already in use, stop the other Postgres or change the host port in `docker-compose.yml`.

## 4. Migrate and seed

With `DATABASE_URL` pointing at your local DB:

```bash
npm run db:migrate
npm run db:seed
```

- **Migrate** applies all files under `src/server/db/migrations/` and tracks them in `schema_migrations`.
- **Seed** inserts the demo bid **S000000479** and related rows once (skips if that bid number already exists).

One-liner equivalent:

```bash
npm run lift:db
```

## 5. Validate tooling (optional)

```bash
npm run check:openai
npm run lint
npm run typecheck:server
npm run build
```

## 6. Run the app (frontend + API)

The UI calls `/.netlify/functions/*`. Use Netlify’s dev server so functions load your `.env`:

```bash
npm run dev:netlify
```

(or `npx netlify dev`)

Open the URL the CLI prints (usually **http://localhost:8888**). Use that exact origin in `ALLOWED_ORIGIN` and `VITE_FUNCTIONS_BASE_URL`.

**Frontend only** (`npm run dev`, typically port 5173): the SPA does not serve functions, but the client defaults to calling **`http://localhost:8888`** for `/.netlify/functions/*` — run **`netlify dev`** in another terminal so that port is up. For a single process, prefer **`npm run dev:netlify`**.

## 7. Strict API key mode (optional)

If you set `STRICT_DB_MODE=true`, you must also set:

- `VITE_STRICT_DB_MODE=true`
- `VITE_INTERNAL_API_KEY` = same string as `INTERNAL_API_KEY`

The browser sends `x-api-key` on function requests (see `src/lib/functions-api.ts`).

## 8. Reset local database

To wipe the Docker volume and start clean:

```bash
docker compose down -v
docker compose up -d
npm run db:migrate
npm run db:seed
```

## Troubleshooting

- **Migration fails** — Check `DATABASE_URL`, firewall, and that Postgres is listening (`docker compose logs postgres`).
- **Functions return 401** — Set `INTERNAL_API_KEY` / `VITE_INTERNAL_API_KEY` consistently, or disable strict mode.
- **CORS errors** — `ALLOWED_ORIGIN` must list the exact origin (scheme + host + port), e.g. `http://localhost:8888`.
- **Wrong project in UI** — `VITE_DEFAULT_PROJECT_ID` must match the seeded UUID (`npm run db:print-project-id`).

See also **`ENVIRONMENT_SETUP.md`** for Neon-based setup and production variable notes.

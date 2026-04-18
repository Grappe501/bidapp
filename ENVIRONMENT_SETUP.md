# Environment setup

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
   - **`OPENAI_API_KEY`** — required for embed / parse / enrich / generate when functions call OpenAI.
   - **`VITE_FUNCTIONS_BASE_URL`** — e.g. `http://localhost:8888` when using `netlify dev`.
   - **`VITE_DEFAULT_PROJECT_ID`** — after seed, use the deterministic id in `.env.example` for the bundled S000000479 seed, or run `SELECT id, bid_number FROM projects;` and paste your row’s `id`.

3. **Never** commit `.env` or paste live passwords/API keys into docs or chat. Rotate any key that was exposed.

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

**Frontend only** (in-memory / localStorage fallbacks when functions URL empty):

```bash
npm run dev
```

**Frontend + Netlify functions** (recommended when testing DB + API):

```bash
netlify dev
```

Open the URL the CLI prints (often `http://localhost:8888` for the site proxy).

## Production build (local check)

```bash
npm run build
npm run preview
```

## Verify DB-backed behavior

1. **Dashboard** — projects list should reflect DB when functions + `DATABASE_URL` are live.
2. **Intelligence** — URL ingest persists when the ingest function and DB succeed.
3. **Drafting** — versions persist when draft Netlify functions and DB are configured.
4. **Output center** — still derives from app state; packaging views align with artifacts from drafting + control + review.

If something still behaves like a static mock, check `VITE_FUNCTIONS_BASE_URL`, `DATABASE_URL`, browser network calls to functions, and provider fallbacks in code.

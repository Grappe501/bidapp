# Bid Assembly

Controlled bid workspace for solicitation intake, requirements, evidence, vendors, architecture, intelligence, retrieval/grounding, and **grounded drafting** (BP-006).

- **Version:** see `package.json` (currently aligned with changelog phases).
- **Upstream:** [github.com/Grappe501/bidapp](https://github.com/Grappe501/bidapp)

## Quick start

```bash
npm install
cp .env.example .env   # fill DATABASE_URL, OPENAI_*, Vite vars as needed
npm run dev
```

- **Production build:** `npm run build`
- **DB:** `npm run db:migrate` then `npm run db:seed`
- **Server types:** `npm run typecheck:server`

## Environment

| Variable | Where |
|----------|--------|
| `DATABASE_URL`, `OPENAI_API_KEY`, … | Netlify function env + local `.env` (not committed) |
| `VITE_FUNCTIONS_BASE_URL`, `VITE_DEFAULT_PROJECT_ID` | Vite / Netlify build env |

See `.env.example`.

## Git & releases (per phase)

1. Finish the phase; bump **`package.json` `version`** and update **`CHANGELOG.md`** / **`CURRENT_STATE.md`**.
2. Commit with a clear message (e.g. `feat: …` or `chore: phase 7 …`).
3. Tag optional but recommended: `git tag -a v0.x.0 -m "Phase description"`.
4. Push: `git push origin main` and `git push origin --tags`.

Netlify: connect the repo, set build command `npm run build`, publish `dist`, and configure function env vars per `.env.example`.

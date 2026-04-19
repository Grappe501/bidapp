# Recommended live workflow

Suggested order for reviewing the **production** AllCare workspace — not a wizard, a narrative through the strongest surfaces.

1. **Dashboard** — readiness, recommended approach, and next actions from live data.
2. **Intelligence** (`/control/intelligence`) — AllCare company profile and supporting tools.
3. **Review** — readiness rules and issues.
4. **Output** — submission package status and bundle readiness.
5. **Client review** (`/output/client-review`) — executive packet for alignment.

Ensure `VITE_FUNCTIONS_BASE_URL` and `VITE_DEFAULT_PROJECT_ID` (or session project) match your Postgres workspace after `db:migrate` / `db:seed` as needed.

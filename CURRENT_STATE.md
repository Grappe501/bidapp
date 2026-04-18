# Current state

- **Phase 0:** Complete — foundation scaffold, layout shell, UI primitives, root operational docs.
- **Phase 1:** Complete — workspace + file ingestion (frontend-first, in-memory).
- **Phase 2:** Complete — requirement extraction console, compliance matrix, requirement detail.
- **Phase 3:** Complete — evidence vault, requirement–evidence linking, support strength and validation metadata (client-side; BP-004).
- **Phase 4:** Complete — vendor intelligence and architecture decision workspace (client-side; BP-005).
- **Phase 5.5:** Complete — bid control center and company intelligence layer (client-side; BP-005.5).
- **Phase 5.6:** Complete — Postgres persistence, migration runner, repository layer, ingestion/parsing services, Netlify functions (BP-005.6).
- **Phase 5.7:** Complete — retrieval, AI parsing, enrichment, and grounding layer (BP-005.7).
- **Phase 6:** Complete — grounded, score-aware drafting studio (BP-006), including DB-backed draft sections/versions with grounding lineage when `VITE_FUNCTIONS_BASE_URL` + `VITE_DEFAULT_PROJECT_ID` are set, plus a polished, terminology-consistent UI pass (Day 7 hardening).
- **Phase 7:** Complete — review and bid readiness engine (BP-007).
- **Phase 8:** Complete — output, submission packaging, and client review packet (BP-008).
- **Phase 9:** Complete — submission workflow, validation gate, runbook, tasks, and audit trail (BP-009).
- **Phase 10:** Complete — competitive intelligence and win strategy engine (BP-010). System supports the full bid lifecycle plus positioning strategy.
- **Last packet:** BP-006-DAY-7-HARDENING-POLISH-QA (drafting studio polish; BP-006 upgrade sprint complete)

**In place now**

- **Workspace & files:** project, library, uploads, classification, file detail.
- **Requirements:** extraction intake, matrix with **support** column, operational **tags** (Delivery / Billing / Integration / Security / Staffing / Compliance), requirement detail with interpretation edits.
- **Evidence:** explorer with filters (type, validation, source file, link status, search), evidence detail with excerpt + metadata edits + usage by requirement, linking from requirement detail with strength and notes.
- **Vendors & architecture:** vendor directory with filters, strategic detail editing (session state), side-by-side comparison workspace, architecture options with stack roles, Malone positioning, narrative strengths, and implementation risks.
- **Bid control:** submission checklist (ARBuy / S000000479), scoring model and section page limits, discussion-phase deliverables, contract / SRV-1 awareness, FOIA redaction tracking, company intelligence ingest (session state).
- **Drafting:** `/drafts` section workspace grounded on **grounding bundles**, score-aware generation, **version history** (active version, protect/duplicate), **requirement coverage**, **score strength**, and **constraint risk** feedback tied to structured metadata; hybrid persistence (**Postgres** when configured via draft Netlify functions, else **localStorage** fallback). Copy and layout are aligned for production-style proposal work.
- **Review & readiness:** `/review` war-room dashboard, filterable issue registry (`/review/issues`, detail with resolve / dismiss / in-review), deterministic rule engine over requirements, evidence, drafts, submission, discussion, redaction, contract risks, vendors, and architecture; weighted readiness score on `/review/readiness` (`ReviewProvider` + `localStorage` issue overrides).
- **Output & packaging:** `/output` command center, submission assembly (`/output/submission`), client review packet (`/output/client-review`), redaction support (`/output/redaction`), final readiness bundle (`/output/final-bundle`); artifacts derived from drafting + bid control + review; clipboard exports for checklist, readiness, and bundle JSON (`OutputProvider`, `output-utils`, server `output` / `packaging` / `redaction` services).
- **Submission execution:** `/submission` workflow engine with gated steps (through ARBuy execution and confirmation), **PASS/FAIL** final validation gate tied to checklist, readiness, critical issues, drafts, artifacts, page limits, redaction, and discussion posture; `/submission/runbook` ARBuy playbooks; `/submission/audit` audit log + execution record; task assignments with entity links; `SubmissionProvider` persistence (`localStorage`); server `submission` / `workflow` / `audit` services.
- **Win strategy:** `/strategy` overview (threats, themes, differentiators, evaluator concerns); competitor directory + detail (`/strategy/competitors`, editable profiles with sourced / inferred / judgment labels); win theme builder; differentiation matrix; evaluator lens workspace; `StrategyProvider` + `localStorage`; server `strategy` / `competitor-analysis` / `win-theme` services.
- **System stance:** Application is bid-specific for **S000000479 — Pharmacy Services for DHS HDCs** (seed project record).
- **Persistence:** Neon-compatible Postgres schema (`src/server/db/schema.sql`), `npm run db:migrate` / `npm run db:seed`, typed repositories and services under `src/server`, Netlify functions for health, projects, URL ingest, and file parse jobs. UI remains primarily session-backed; dashboard and intelligence expose optional **read-only / ingest** hooks when `VITE_FUNCTIONS_BASE_URL` is set.
- **Retrieval & grounding (5.7):** Chunk embeddings (`document_embeddings`), semantic retrieval with logged queries/results, structured AI parse into `parsed_entities`, company enrichment from stored `intelligence_sources` into `intelligence_facts` / `vendor_claims` (append-only; no silent overwrite of profile JSON), and `grounding_bundles` for draft-ready context. Netlify functions: `embed-file`, `retrieve-context`, `parse-document-ai`, `enrich-company`, `build-grounding-bundle`, plus `intelligence-profile-snapshot` and `intelligence-job-status` for lightweight observability.
- **Drafting studio (6):** Section-based `/drafts` workspace with strategy (1000-pt model + page caps), grounding bundle attach/build, controlled `drafting.service` generation (structured JSON; generation blocked without a valid bundle), versioned editor, requirement coverage panel, score strength card, and constraint risk guidance. Persistence: `localStorage` always as cache/fallback; optional **DB-first** load and saves via draft functions (`list-draft-sections`, `save-draft-version`, etc.) when `DATABASE_URL` / migrations and Vite function URLs are configured. `list-grounding-bundles` and `generate-draft` require `OPENAI_API_KEY` for live generation.

**Known limitations (drafting):** Structured metrics reflect the **last generated or explicitly saved** version — manual edits can leave requirement coverage and score strength **directional** until you save a new version or regenerate. Full mobile layouts are not a primary target; narrow desktop widths are supported. Real-time collaboration and threaded comments are out of scope.

**Next:** Optional roadmap — richer identity/auth, live intel feeds (out of scope for BP-010), DOCX/PDF generation, or multi-bid workspaces.

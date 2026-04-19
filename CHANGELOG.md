# Changelog

## v0.12.5 — 2026-04-18

- **Local development:** `docker-compose.yml` (Postgres 16), **`docs/LOCAL_DEVELOPMENT.md`** (migrate, seed, `netlify dev`, env matrix), **`npm run db:print-project-id`**, `.env.example` updated with deterministic seed project id and Docker connection notes; **`ENVIRONMENT_SETUP.md`** links to the local guide

## v0.12.4 — 2026-04-18

- **Agent Malone Briefing Mode:** structured `AgentMaloneBriefing` from live `gatherBidAgentContext` + thread memory + recent action messages; modes (default, executive, strategy, vendor, readiness, drafting, pricing, comparison); landing **Operational briefing** panel with refresh; chat phrases route to briefing via `parseBriefingIntentFromQuestion`; **`POST agent-malone-briefing`** Netlify function; thread `summary_line` updated from briefing headline; quick prompt “Brief me on this thread.”

## v0.12.3 — 2026-04-18

- **Agent Malone V3 — project memory & threads:** Postgres tables `agent_malone_threads`, `agent_malone_messages`, `agent_malone_memory` (migration `015_agent_malone_threads.sql`); **`ask-bid-agent`** accepts **`threadId`**, **`sectionId`**, persists turns and working memory; **`agent-malone-threads`** function for list/create/get/update/archive/clear_memory; UI thread sidebar, context chips, working memory panel on **`/agent`**; bounded operational memory (explicit, page, action, low-confidence inference) with policy order in **`agent-malone-memory-policy.ts`**

## v0.12.2 — 2026-04-19

- **Agent Malone** (`/agent`, nav **Agent Malone**): V2 operational agent — bounded **`AgentMaloneActionRequest`** / **`AgentMaloneActionResult`** / **`AgentMaloneAnswer`**; registry + **`executeMaloneAction`** wrappers over grounding bundles, vendor intelligence jobs, competitor simulation, decision synthesis, narrative/readiness snapshots, strategy & interview-prep recipes; intent patterns for chat-triggered actions; quick-action buttons; workflow result cards in-thread. **`ask-bid-agent`** accepts `question` and/or **`actionRequest`**
- **Bid Intelligence (V1) superseded in-product** by Agent Malone — same route, expanded contract
- **SRV-1 contract model** (`ContractStructure`, `GroundingBundleContract` in `src/types/contract-model.ts`; canonical data in `canonical-srv1-contract.ts`)
- **Grounding bundles** persist **`contract`** alongside **`rfp`** — RFP↔contract cross-check warnings; **draft generation** requires contract grounding and injects SRV-1 scope / performance / termination / pricing directives
- **Pricing validation** (`contract-pricing-validation.ts`): rejects flat lump-sum-only / unstructured pricing; requires validated price-sheet artifact
- **Dashboard**: **Contract readiness (SRV-1)** card (scope, performance, pricing structure, compliance); **Contract** page shows structured SRV-1 summary

## v0.12.1 — 2026-04-19

- **Structured RFP model** (`src/types/rfp-model.ts`, `canonical-rfp-s000000479.ts`): normalized core, evaluation weights, requirements, submission artifacts, and risk areas for **S000000479**
- **Grounding bundles** now persist **`rfp`** (official weights, summaries, risk themes) when built server-side; **draft generation** requires structured RFP grounding and injects evaluation priorities into the model prompt
- **RFP file validation** (`rfp-document-validation.ts`): required document coverage → `missingDocuments` / `parsedDocuments` / `unstructuredDocuments`; **Dashboard** **RFP readiness** card + **Intelligence** solicitation expectations panel
- **Drafting**: `getBundleGenerationReadiness` blocks when bundle lacks `rfp` (rebuild bundle to attach)

## v0.12.0 — 2026-04-18

- **Live AllCare branding (single app):** Shell (`Header`, `Sidebar`) uses `AppBrandingProvider` + `branding-utils` (`AllCare Bid OS`, client display name from API); **Dashboard** adds **`WorkspaceHeroCard`**; **Intelligence** leads with **`AllCareBrandingPanel`** and moves ingestion/backend tools under **Supporting intelligence & ingestion tools**; **Output** / **Client review** use production-grade executive copy; **Private deploy** banner always available in strict DB mode (no demo-only suppression)
- **Removed** client demo mode: `VITE_DEMO_MODE`, `VITE_DEMO_CLIENT_NAME`, `DemoModeProvider`, `DashboardDemoHero`, `AllCareBrandingDemoPanel`, `DemoModeBanner`
- **Docs / scripts:** `scripts/live-workflow-walkthrough.md`, `ENVIRONMENT_SETUP.md`, `CURRENT_STATE.md`, `.env.example`

## v0.11.0 — 2026-04-19

- Superseded by **v0.12.0** — demo-only env flags and parallel UI paths removed in favor of live branding for all users.

## v0.10.4 — 2026-04-18

- **Netlify production verification:** `scripts/netlify-deploy-checklist.md` (before/after deploy, rollback triage), `npm run check:netlify-prod-env` for local preflight against required prod-shaped vars
- **`POST prod-readiness`** Netlify function — API-key gated; returns `database`, `projectCheck`, `openaiConfigured`, `strictDbMode` only (no secrets)
- **Docs:** `ENVIRONMENT_SETUP.md` and `DEPLOYMENT_PROTOCOL.md` expanded for build-time vs runtime vars, production origin vs dev, preview deploy CORS; `CURRENT_STATE.md` updated; `db-health` / `require-api-key` / `functions-api` cross-links to checklists

## v0.10.3 — 2026-04-18

- **Private deploy readiness:** standardized Netlify **`netlifyRequestPreamble`** (strict posture, CORS, OPTIONS), **`INTERNAL_API_KEY`** checks with consistent **401** JSON, and per-request CORS via **`ALLOWED_ORIGIN`** (comma-separated exact origins; dev fallback when strict mode is off).
- **Project scoping:** shared **`requireProjectId`** helper; company-scoped functions require **`projectId`** in **`STRICT_DB_MODE`** (`enrich-company`, `intelligence-profile-snapshot`, **`get-branding-profile`** when using `companyProfileId`).
- **Operational docs:** `scripts/private-deploy-smoke-test.md`, `npm run check:private-deploy-env`, and updates to **`ENVIRONMENT_SETUP.md`**, **`DEPLOYMENT_PROTOCOL.md`**, **`CURRENT_STATE.md`**.
- **UI:** subtle **Private deploy** banner when **`VITE_STRICT_DB_MODE`**, stricter copy on DB-first and illustrative pages (scoring, runbook, strategy storage), Files page aligned with DB + session uploads.

## v0.10.2 — 2026-04-18

- Hardened and polished the **output module** (BP-008 upgrade sprint — Day 5): consistent terminology across **output center**, **submission package**, **client review packet**, **redacted packet**, **final readiness bundle**, **blockers**, **readiness**, and **redaction items**; aligned export/copy labels (Markdown vs text vs JSON) and improved clipboard report headers in `output-utils`
- Normalized **packaging threshold** language (vs artifact **status** labels Draft / In Progress / Ready / Validated / Locked) on the submission package checklist, summary cards, and exports; calmer empty and attention copy on the output center
- Smoothed **OutputSubNav** labels, sidebar tooltip for Output, page spacing rhythm (`space-y-8`), and neutral “portal upload” wording in output copy; removed unused `ClientReviewSection`
- Documented BP-008 sprint completion and honest output-layer limits in `CURRENT_STATE.md`

## v0.10.1 — 2026-04-18

- Hardened and polished the drafting studio (BP-006 Day 7): consistent terminology (grounding bundle, requirement coverage, score strength, constraint risk, unsupported claim, draft status, active version), calmer empty and error copy, aligned section list and section workspace layout with improved narrow-width padding
- Refined Experience / Solution / Risk strategy copy and evaluator lens in `SectionStrategyPanel`; deduplicated weak-evidence counting via `countBundleWeakVerificationEvidence` in `drafting-utils`
- Documented BP-006 completion, hybrid DB/local draft persistence, and known limitations in `CURRENT_STATE.md`

## v0.10.0 — 2026-04-18

- Added competitive landscape and win strategy workspace (`/strategy` and sub-routes)
- Added competitor profiles, filters, detail editing, and threat-level mapping with explicit evidence character (sourced / inferred / judgment)
- Added win theme builder with section targeting and priority
- Added differentiation matrix and evaluator lens views with strategic response edits
- Added `StrategyProvider`, strategy summary utilities, and server `strategy` / `competitor-analysis` / `win-theme` services

## v0.9.0 — 2026-04-18

- Added submission workflow engine with ordered steps, owners, and completion rules (`/submission`)
- Added final validation gate (PASS/FAIL) blocking ARBuy steps until checklist, review, drafts, page limits, redaction, and discussion rules clear
- Added submission runbook with copyable ARBuy steps (`/submission/runbook`)
- Added task assignment panel with entity links and status/due dates
- Added audit log + submission execution log (`/submission/audit`); `SubmissionProvider` with `localStorage` persistence
- Added final export panel integration (checklist, readiness, runbook, bundle JSON, download)
- Added server `submission`, `workflow`, and `audit` services and `submission-utils` gate logic

## v0.8.0 — 2026-04-18

- Added output center and bundle views (`/output` and sub-routes)
- Added submission package assembly with solicitation checklist, artifact cards, and copy/export actions
- Added client review packet surface and final readiness bundle with BP-007 readiness integration
- Added redaction support workflow (flags, previews, packet readiness)
- Added `OutputProvider`, `output-utils`, and server `output` / `packaging` / `redaction` services; extended types for artifacts and bundles

## v0.7.0 — 2026-04-18

- Added review dashboard, issue tracking, and readiness scoring (`/review`, `/review/issues`, `/review/issues/:issueId`, `/review/readiness`)
- Added rule-based coverage, submission, section constraint, discussion, redaction, contract exposure, and vendor validation checks (`review-rules-engine`, `review.service`)
- Added issue detail and resolution flows with persisted status overrides (`ReviewProvider`, `localStorage`)
- Added section-level and bid-level readiness views and supporting audit cards

## v0.6.0 — 2026-04-18

- Added drafting studio routes (`/drafts`, `/drafts/:sectionId`) with section strategy, grounding bundle selector, generator, editor, versions, coverage, scoring feedback, and constraint warnings
- Added `DraftingProvider` + localStorage persistence for draft sections and versions (Experience, Solution, Risk, Executive Summary, Architecture Narrative)
- Added `drafting.service` (structured OpenAI output) and Netlify functions `generate-draft`, `list-grounding-bundles`
- Added `drafting-utils` (page estimates, coverage/scoring strength, constraint messages) and server `drafting-constants` aligned to BP-005.5 scoring
- Extended `GroundingBundleType` with **Executive Summary** for bundle build parity with draft sections

## v0.5.7 — 2026-04-18

- Added embeddings-backed semantic retrieval (JSONB vectors, cosine in app layer) with `retrieval_queries` / `retrieval_results` observability
- Added AI-assisted structured parsing (OpenAI embeddings + chat JSON schema paths) into `parsed_entities`; manual parse modes for requirements, evidence, and submission items
- Added automated company/vendor enrichment from stored `intelligence_sources` only, writing append-only `intelligence_facts` and `vendor_claims` with `company_enrichment_runs` tracking
- Added `grounding_bundles` assembly (requirements, evidence, retrieved chunks, facts, validation notes) for future drafting (BP-006)
- Added Netlify functions: `embed-file`, `retrieve-context`, `parse-document-ai`, `enrich-company`, `build-grounding-bundle`, `intelligence-profile-snapshot`, `intelligence-job-status`; optional UI hooks on Intelligence, File detail, and Evidence detail
- Added `openai` dependency and `.env.example` keys for `OPENAI_API_KEY` / model overrides; extended `schema.sql` and migration `002_bp057_retrieval_ai_grounding.sql`

## v0.5.6 — 2026-04-18

- Added Postgres schema and migration runner (`schema.sql`, `migrations/001_initial.sql`, `npm run db:migrate`)
- Added `pg` client, repository layer, parsing/ingestion/intelligence services, and deterministic DB seed (`npm run db:seed`) aligned to existing mocks
- Added Netlify functions: `db-health`, `list-projects`, `create-project`, `ingest-url`, `parse-file` with `netlify.toml` and bundled `src/server`
- Added minimal UI: dashboard DB project list and intelligence **Persisted URL ingest** when `VITE_FUNCTIONS_BASE_URL` is configured; `.env.example` for `DATABASE_URL` / Vite vars
- Added `tsconfig.server.json` and `npm run typecheck:server` (not part of default Vite `tsc -b` graph)

## v0.5.5 — 2026-04-18

- Added bid control routes (`/control/*`): submission tracking, scoring model & section constraints, discussion workspace, contract awareness, company intelligence
- Added operational requirement tags and matrix filter; seeded tags on mock requirements
- Added `ControlProvider` / `IntelligenceProvider`, mock control data, and FOIA redaction session tracking
- Retargeted seed project to **S000000479 — Pharmacy Services for DHS HDCs**; sidebar **Bid control** entry

## v0.5.0 — 2026-04-18

- Added vendor directory, detail, and comparison views (`/vendors`, `/vendors/:vendorId`, `/vendors/compare`)
- Added architecture workspace with seeded stack options (`/architecture`)
- Added vendor fit scoring, status tracking, and stack role modeling
- Added Malone positioning across architecture options
- Added `VendorProvider` / `ArchitectureProvider` and shared vendor/architecture utilities

## v0.4.0 — 2026-04-18

- Added evidence explorer and evidence detail views (`/evidence`, `/evidence/:evidenceId`)
- Added requirement-to-evidence linking, support strength on links, and session updates (link / unlink / strength edits)
- Added support summary indicators on requirement detail and compliance matrix (None / Weak / Moderate / Strong)
- Added seeded evidence items and requirement–evidence links; sidebar **Evidence** entry
- Added `EvidenceProvider`, `evidence-utils`, and display-format helpers for evidence labels and support copy

## v0.3.0 — 2026-04-18

- Added requirement extraction console with mock candidate workflow (`/requirements/extract`)
- Added compliance matrix and requirement detail views (`/requirements`, `/requirements/:requirementId`)
- Added requirement editing, status, and risk tracking (session state via `RequirementProvider`)
- Added seeded requirement and extraction candidate data; matrix links to file records
- Added shared display formatting (`src/lib/display-format.ts`) for dates, file status labels, sorted tags, and requirement status/risk labels to avoid table/detail drift
- Added `requirement-utils` for matrix filters and coverage summary metrics

## v0.2.0 — 2026-04-18

- Added project workspace dashboard with live metrics from the file library
- Added file library and file detail views with routing (`/files`, `/files/:fileId`)
- Added client-side file upload flow (session state; defaults: status Uploaded, configurable category and source type)
- Added file categorization, tags, status display, and client-side filters (category, source, status, search)
- Added seeded mock project and file data (`src/data`)
- Added domain types and `WorkspaceProvider` for in-memory workspace state
- Removed unused `public/vite.svg` and favicon reference

## v0.1.0 — 2026-04-18

- Created Vite + React + TypeScript application shell
- Added Tailwind and global design foundation
- Built sidebar, header, and app layout
- Added initial route structure and dashboard placeholders
- Added base UI primitives (`Button`, `Card`, `Section`)
- Added root operating documents and build control files

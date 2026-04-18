# Changelog

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

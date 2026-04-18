# Bid Assembly Application — Phase-by-Phase Build Blueprint

## 1. Purpose of This Document

This document is the master execution blueprint for building the Bid Assembly Application.

It is intended to do four jobs at once:

1. define exactly what will be built
2. define the sequence in which it will be built
3. define the architecture and operating logic behind the product
4. become detailed enough that implementation can be increasingly systematized and partially automated over time

This is not a loose project outline.
This is the operating blueprint for design, engineering direction, Cursor scripting, GitHub execution discipline, and deployment.

The build should always remain aligned with the Master Plan and should be interpreted through the following lens:

* we are the architects
* we direct the system
* Cursor executes within clear bounds
* GitHub preserves the build history
* Netlify delivers the deployed application

---

## 2. Product Build Objective

We are building a premium internal proposal operating system that transforms complex bids into structured, defensible, high-quality proposal outputs.

The build objective is not simply to generate text.
The build objective is to create a controlled workflow application that can reliably:

* ingest bid documents and support files
* structure requirements into a response system
* organize evidence and partner inputs
* support architectural and vendor decision-making
* generate high-quality response drafts
* detect risk before submission
* preserve institutional process so future bids become faster and stronger

---

## 3. Build Philosophy

### 3.1 Human-led, AI-assisted

The system should always preserve human control over:

* strategic framing
* proposal commitments
* architecture decisions
* vendor positioning
* final approval

### 3.2 Structured before generative

The build order must emphasize:

* data structure
* workflow logic
* traceability
* review discipline

before polishing generation features.

### 3.3 Premium by design

The product should feel like a high-trust advisory tool.
Every screen, workflow, and output should communicate rigor, quality, and executive-level clarity.

### 3.4 Reusable foundation

This bid is the first proving ground, but the system should be built so that future bids can reuse the same architecture.

### 3.5 Narrow at first, extensible by design

Version 1 should focus tightly on what supports the current bid cycle.
The architecture should still leave room for future modules and automation.

---

## 4. Master Build Sequence

The product should be built in the following high-level order:

### Phase 0 — Foundation and Build Control

Establish the architecture, repo structure, development standards, data model direction, and UI system.

### Phase 1 — Core Workspace and File Ingestion

Create the project shell, workspace structure, and upload pipeline.

### Phase 2 — Requirement Extraction and Compliance Matrix

Create the structured system that turns documents into requirements and tracks coverage.

### Phase 3 — Evidence Vault and Retrieval Workflows

Create source organization, evidence linking, and document-aware workflows.

### Phase 4 — Vendor Intelligence and Architecture Workspace

Create the decision layer for partner analysis, scoring, and stack modeling.

### Phase 5 — Drafting Studio

Create controlled drafting workflows tied to structured data and evidence.

### Phase 6 — Review and Risk Center

Create the red-team logic and proposal integrity checks.

### Phase 7 — Output, Packaging, and Client Review Support

Create export-ready views and proposal package organization.

### Phase 8 — Automation Hardening and Reusability Layer

Improve systemization, templates, reusable workflows, and operational polish.

---

## 5. Phase-by-Phase Blueprint

## Phase 0 — Foundation and Build Control

### 5.0 Objective

Create the technical and operational foundation before any feature work begins.

### 5.1 Outcomes

By the end of this phase, the project should have:

* a clearly defined repo structure
* a UI foundation
* a database direction
* a routing structure
* a component strategy
* a state management direction
* environment variable conventions
* AI service boundaries
* a documented build protocol for Cursor

### 5.2 Build Elements

#### Application shell

* initialize frontend app
* establish routing
* create base layout
* create sidebar and workspace shell
* create design tokens and theme primitives

#### Engineering standards

* define naming conventions
* define folder architecture
* define component layering rules
* define service boundaries
* define typing rules
* define error handling baseline

#### Root-level documentation

The root of the project should contain:

* MASTER_PLAN.md
* BUILD_BLUEPRINT.md
* NEXT_THREAD_PROMPT.md
* SYSTEM_ARCHITECTURE.md
* CURSOR_EXECUTION_PROTOCOL.md
* ENVIRONMENT_SETUP.md
* DEPLOYMENT_PROTOCOL.md
* CHANGELOG.md

#### Git discipline

* define branching or single-main workflow
* define commit conventions
* define checkpoint tagging expectations
* define pre-deploy validation checklist

### 5.3 Cursor Direction for Phase 0

Cursor should be directed to:

* scaffold the app cleanly
* create only foundational files
* avoid speculative features
* avoid mixing business logic into presentation layers
* avoid untyped or sloppy state handling

### 5.4 Exit Criteria

Phase 0 is complete when:

* the app loads with a polished shell
* navigation is structured
* core documentation exists
* engineering conventions are written down
* the repo is stable and ready for module build-out

---

## Phase 1 — Core Workspace and File Ingestion

### 6.0 Objective

Build the operational shell where each bid opportunity is managed as its own workspace.

### 6.1 Product Goal

Users must be able to create a bid workspace and upload, classify, and review source files.

### 6.2 Core Concepts

A workspace represents one opportunity.
Each workspace contains:

* project identity
* solicitation files
* support materials
* vendor files
* architecture notes
* draft outputs
* status metadata

### 6.3 Screens

#### Workspace Dashboard

Displays:

* opportunity name
* issuing organization
* due date
* key deadlines
* file counts
* coverage snapshot
* open risks
* current draft status

#### File Library

Displays:

* uploaded files
* file category
* upload date
* source type
* parse status
* tags

#### File Detail View

Displays:

* metadata
* preview
* extracted text status
* classification
* notes
* linked requirements

### 6.4 Data Model Elements

* Project
* ProjectDeadline
* FileRecord
* FileCategory
* FileParseStatus
* FileTag
* ProjectNote

### 6.5 Functional Requirements

The user must be able to:

* create a project
* edit project metadata
* upload files
* assign categories
* tag files
* mark files as solicitation, vendor, internal, pricing, compliance, or draft support
* track parse status
* add notes to files

### 6.6 UX Requirements

The experience should feel calm and high-end:

* strong spacing
* clear hierarchy
* no clutter
* no amateur upload flows
* document state should always be visible

### 6.7 AI Role in This Phase

Minimal.
AI should not dominate this phase.
At most, AI can assist with:

* file classification suggestions
* basic document summaries

### 6.8 Exit Criteria

Phase 1 is complete when:

* a workspace can be created
* files can be uploaded and classified
* file statuses are visible
* the workspace begins to feel like a real command center

---

## Phase 2 — Requirement Extraction and Compliance Matrix

### 7.0 Objective

Turn bid documents into a structured requirement system.

### 7.1 Product Goal

Users must be able to transform source documents into a living requirement matrix that powers the rest of the application.

### 7.2 Core Concepts

A requirement is not just a text snippet.
It is a tracked obligation or response need.

Each requirement should include fields such as:

* requirement ID
* title
* source document
* source section
* verbatim text
* summary
* requirement type
* mandatory or optional
* response category
* due stage
* status
* evidence strength
* owner
* notes

### 7.3 Screens

#### Requirement Extraction Console

Displays:

* source file selection
* extraction controls
* AI extraction results
* review and approval controls

#### Compliance Matrix

Displays:

* all requirements
* filters by status, source, type, owner, and risk
* coverage indicators
* evidence linkage state

#### Requirement Detail View

Displays:

* verbatim language
* interpretation
* linked evidence
* linked vendors
* linked draft sections
* risk notes
* open questions

### 7.4 AI Workflow

The model should:

1. read selected bid documents
2. extract candidate requirements into structured output
3. classify them
4. allow human review and correction before acceptance

### 7.5 Functional Requirements

The user must be able to:

* run extraction against selected files
* review extracted requirements before saving
* edit requirement fields manually
* merge duplicates
* split overly broad requirements
* flag critical items
* assign owners
* update status

### 7.6 Status Framework

Suggested statuses:

* not reviewed
* extracted
* approved
* in progress
* covered
* partial
* blocked
* unresolved

### 7.7 Risk Framework

Suggested risk levels:

* low
* moderate
* high
* critical

### 7.8 Exit Criteria

Phase 2 is complete when:

* bid requirements can be reliably extracted
* the matrix becomes the operational spine of the application
* requirements are editable, filterable, and reviewable

---

## Phase 3 — Evidence Vault and Retrieval Workflows

### 8.0 Objective

Build the evidence layer that supports defensible drafting and decision-making.

### 8.1 Product Goal

Users must be able to connect requirements to supporting source material in a traceable way.

### 8.2 Core Concepts

Evidence is any source passage that supports a requirement, vendor claim, system design choice, or draft statement.

Evidence should be classified as:

* verified fact
* vendor claim
* internal assumption
* proposal intent
* inferred conclusion

### 8.3 Screens

#### Evidence Explorer

Displays:

* searchable evidence passages
* source file linkage
* confidence indicators
* evidence type

#### Requirement-to-Evidence Panel

Displays:

* linked support passages for each requirement
* support strength
* gaps and conflicts

#### Evidence Detail View

Displays:

* passage text
* source file
* page or section reference
* confidence
* usage history
* notes

### 8.4 AI Workflow

The model should:

* retrieve relevant passages from uploaded materials
* suggest evidence links for requirements
* surface weak or missing support
* separate fact from assumption where possible

### 8.5 Functional Requirements

The user must be able to:

* search evidence across files
* link evidence to requirements
* rate support strength
* mark support as verified or pending validation
* add manual evidence notes
* see where an evidence passage is used

### 8.6 Exit Criteria

Phase 3 is complete when:

* requirements can be grounded in actual support material
* evidence retrieval is useful and trustworthy
* draft generation can be tied to evidence instead of loose prompting

---

## Phase 4 — Vendor Intelligence and Architecture Workspace

### 9.0 Objective

Create the strategy layer for evaluating partners and defining the winning stack.

### 9.1 Product Goal

Users must be able to compare vendors, document strengths and weaknesses, and model architecture options clearly.

### 9.2 Core Concepts

This module must support:

* vendor profiles
* product capabilities
* integration considerations
* pricing notes
* proposal relevance
* strategic risks
* architecture options

### 9.3 Screens

#### Vendor Directory

Displays:

* vendor list
* contact info
* category
* overall fit score
* status

#### Vendor Detail View

Displays:

* summary
* strengths
* weaknesses
* API notes
* compliance notes
* pricing notes
* source files
* open questions

#### Vendor Comparison View

Displays side-by-side comparison on:

* API readiness
* workflow fit
* LTC fit
* implementation speed
* cost profile
* risk
* role in stack

#### Architecture Builder

Displays:

* possible stack models
* component roles
* Malone overlay position
* data flow assumptions
* narrative strengths
* implementation risk

### 9.4 AI Workflow

The model should:

* summarize vendor materials
* extract capability claims
* identify likely advantages and weaknesses
* compare vendors across defined criteria
* propose architecture narrative options

### 9.5 Functional Requirements

The user must be able to:

* create vendor profiles
* link documents to vendors
* score vendors by criteria
* compare vendors side by side
* document proposed stack roles
* draft architecture notes

### 9.6 Exit Criteria

Phase 4 is complete when:

* vendor analysis becomes structured and reusable
* architecture options can be documented visually and narratively
* the team can clearly justify a stack recommendation

---

## Phase 5 — Drafting Studio

### 10.0 Objective

Build a controlled proposal-writing environment that turns structured inputs into polished response sections.

### 10.1 Product Goal

Users must be able to generate and revise proposal sections that are grounded in requirements, evidence, and strategy.

### 10.2 Draft Types

The first version should support:

* executive summary
* technical narrative
* implementation approach
* vendor positioning
* risk mitigation section
* architecture description
* compliance narrative
* transition or onboarding plan

### 10.3 Screens

#### Draft Builder

Displays:

* section type
* target length
* selected source requirements
* selected evidence set
* selected vendors
* narrative instructions

#### Draft Workspace

Displays:

* generated content
* source references
* revision controls
* comments
* status

#### Section Strategy Panel

Displays:

* intended reader
* section objective
* required coverage points
* claims to avoid
* unresolved issues

### 10.4 AI Workflow

The model should generate drafts only after being supplied with:

* selected requirements
* evidence set
* strategic framing
* section objective
* tone guidance
* constraints

### 10.5 Functional Requirements

The user must be able to:

* generate a section from selected inputs
* regenerate parts of a section
* preserve approved language
* compare versions
* save strategy notes for each section
* mark statements needing validation

### 10.6 Guardrails

The drafting system should not:

* invent unsupported implementation claims
* imply confirmed integrations without support
* present assumptions as verified fact
* generate generic filler disconnected from the bid

### 10.7 Exit Criteria

Phase 5 is complete when:

* the system can generate strong section drafts from controlled inputs
* the drafting experience feels strategic and high-trust
* human revision remains easy and deliberate

---

## Phase 6 — Review and Risk Center

### 11.0 Objective

Build the integrity system that protects proposal quality before anything leaves the application.

### 11.1 Product Goal

Users must be able to review drafts and coverage through a red-team lens.

### 11.2 Review Categories

The first version should check for:

* uncovered mandatory requirements
* weakly supported claims
* duplicated commitments
* contradictory statements
* unrealistic timelines
* pricing inconsistencies
* missing attachments
* unresolved partner dependencies

### 11.3 Screens

#### Review Dashboard

Displays:

* issue counts by severity
* requirement coverage summary
* unresolved gaps
* section-level warnings

#### Review Issue Detail View

Displays:

* issue type
* impacted section or requirement
* severity
* explanation
* suggested fix

#### Final Readiness View

Displays:

* readiness score
* critical blockers
* final checklist

### 11.4 AI Workflow

The model should:

* review draft text against requirements and evidence
* identify likely issues
* classify severity
* suggest corrective steps

### 11.5 Functional Requirements

The user must be able to:

* run a review pass
* inspect findings
* resolve or dismiss issues
* assign follow-up tasks
* rerun checks after revisions

### 11.6 Exit Criteria

Phase 6 is complete when:

* the system can detect meaningful proposal risks
* unresolved issues are visible and manageable
* the application begins functioning like a true proposal control system

---

## Phase 7 — Output, Packaging, and Client Review Support

### 12.0 Objective

Prepare the application to support final review and packaging of deliverables.

### 12.1 Product Goal

Users must be able to export or copy clean, organized outputs that support internal review, client presentation, and proposal assembly.

### 12.2 Output Types

The first version should support:

* requirement matrix exports
* vendor comparison summaries
* architecture summaries
* proposal section exports
* review issue reports
* final readiness summaries

### 12.3 Screens

#### Output Center

Displays:

* available outputs
* export status
* generated packages
* version labels

#### Client Review Packet View

Displays:

* polished technical narrative
* architecture visuals or summaries
* recommendation summary
* open issue list if needed

### 12.4 Functional Requirements

The user must be able to:

* export proposal sections cleanly
* export matrices for working review
* produce client-facing narrative packets
* create versioned output bundles

### 12.5 Exit Criteria

Phase 7 is complete when:

* the product supports real-world review and packaging workflows
* outputs look polished enough for client-facing use

---

## Phase 8 — Automation Hardening and Reusability Layer

### 13.0 Objective

Turn the first build into a repeatable system and prepare the foundation for future automation.

### 13.1 Product Goal

The system should become easier to reuse, extend, and partially automate across new bids.

### 13.2 Focus Areas

* reusable extraction templates
* reusable section strategies
* saved vendor scorecards
* bid-type presets
* automation rules for repeated workflows
* stronger activity logging
* better version history

### 13.3 Functional Requirements

The user must be able to:

* clone a prior project structure
* reuse scoring rubrics
* reuse draft frameworks
* preserve prior partner intelligence
* carry forward architecture templates

### 13.4 Exit Criteria

Phase 8 is complete when:

* the application is no longer a one-off tool for one bid
* it begins behaving like a reusable operating system for proposal work

---

## 14. Screen Inventory Summary

The likely first major screen set is:

* Login or access shell if needed
* Workspace Dashboard
* File Library
* File Detail View
* Requirement Extraction Console
* Compliance Matrix
* Requirement Detail View
* Evidence Explorer
* Vendor Directory
* Vendor Detail View
* Vendor Comparison View
* Architecture Builder
* Draft Builder
* Draft Workspace
* Review Dashboard
* Review Issue Detail View
* Output Center
* Final Readiness View

Every screen should support a premium, structured, confident visual language.

---

## 15. User Flow Summary

### 15.1 Core User Flow

1. create workspace
2. upload solicitation and support files
3. classify files
4. extract requirements
5. review and approve requirements
6. link evidence
7. analyze vendors
8. define architecture option
9. generate section drafts
10. run review checks
11. revise weak areas
12. prepare outputs for review and submission assembly

### 15.2 Strategic User Flow

1. understand the bid
2. decide the stack
3. prove the claims
4. write the narrative
5. reduce the risk
6. finalize the package

---

## 16. Data Model Direction

The initial entities should likely include:

* User
* Project
* ProjectDeadline
* FileRecord
* FileTag
* Requirement
* RequirementNote
* EvidencePassage
* RequirementEvidenceLink
* Vendor
* VendorContact
* VendorCapability
* VendorScore
* ArchitectureOption
* ArchitectureComponent
* DraftSection
* DraftVersion
* ReviewIssue
* OutputBundle

The exact schema can evolve, but these concepts should guide the build.

---

## 17. AI Workflow Design Direction

AI should be used in bounded workflows.
The first major AI jobs are:

### Workflow A — Requirement Extraction

Input: selected documents  
Output: structured requirement candidates

### Workflow B — Evidence Retrieval

Input: requirement or section target  
Output: relevant support passages

### Workflow C — Vendor Summary and Comparison

Input: vendor documents and notes  
Output: structured capability summaries and comparison insights

### Workflow D — Controlled Section Drafting

Input: section goal, requirements, evidence, narrative instructions  
Output: draft section text

### Workflow E — Review Pass

Input: draft text plus requirements and evidence  
Output: flagged risks and suggested fixes

Each workflow should be independently designed and testable.

---

## 18. UI and Experience Direction

The product must feel expensive.
Not flashy. Expensive.

That means:

* disciplined typography
* balanced whitespace
* elegant hierarchy
* restrained color use
* clear status signals
* strong panel structure
* high readability
* calm, intelligent workflow progression

Avoid:

* noisy dashboards
* cramped layouts
* gimmicky AI visuals
* over-animated interactions
* anything that feels consumer-casual

This should feel like a premium internal command platform used by serious advisory teams.

---

## 19. Cursor Execution Strategy

Cursor should be used as a disciplined implementation engine.
It should not be allowed to freestyle the product.

### Cursor should always receive:

* the relevant phase objective
* exact files to create or update
* constraints on what not to touch
* expected outputs
* design guidance
* architecture boundaries

### Cursor should not:

* invent scope outside the assigned phase
* collapse multiple modules into a single sloppy implementation
* rewrite stable systems without instruction
* introduce visual inconsistency
* bury business logic in UI layers
* make silent architectural assumptions

### Cursor work packets should include:

* goal
* current state
* target files
* required new files
* acceptance criteria
* non-goals
* testing expectations

---

## 20. GitHub and Versioning Workflow

The repository should preserve a disciplined build history.

Suggested workflow:

* complete one coherent work packet at a time
* review changed files before commit
* use clear commit messages
* tag major phase completions
* keep root documentation current before handoff

Important root files to maintain continuously:

* MASTER_PLAN.md
* BUILD_BLUEPRINT.md
* NEXT_THREAD_PROMPT.md
* CHANGELOG.md
* CURRENT_STATE.md

The handoff system should always allow a new thread or new engineer to regain full context quickly.

---

## 21. Deployment Strategy

Netlify deployment should follow milestone readiness, not random pushes.

### Suggested deployment moments

* Phase 0 shell milestone
* Phase 1 workspace milestone
* Phase 2 matrix milestone
* Phase 4 vendor strategy milestone
* Phase 5 drafting milestone
* Phase 6 review milestone

Each deploy should be paired with:

* short release note
* visible current limitations
* known gaps
* next build priority

---

## 22. QA and Validation Strategy

Each phase should include:

* functional validation
* UI review
* logic review
* data integrity check
* regression awareness

For AI workflows, validation should include:

* extraction usefulness
* false positives
* hallucination risk
* output structure stability
* clarity of review controls

The application should not hide uncertainty.
If the AI is unsure, the UI should make that visible.

---

## 23. What “A1 Top Tier” Means in Practice

To reach the standard we want, the build must show:

* clarity of architecture
* restraint in design
* sharp workflow logic
* strong source discipline
* excellent writing quality
* visible trustworthiness
* coherence from screen to screen
* no duct-tape feeling

A premium product feels inevitable, not improvised.
That is the bar.

---

## 24. Immediate Next Action After This Blueprint

The next execution document should translate this blueprint into:

### Build Packet 1

Foundation scaffold and repo architecture

Then:

### Build Packet 2

Workspace and file ingestion module

Then:

### Build Packet 3

Requirement extraction and compliance matrix

From there, each packet should move phase by phase with tight control.

---

## 25. Final Instructional Note

This blueprint should live at the root of the project and be treated as a controlling document.

When implementation begins, every build decision should answer:

* which phase does this belong to
* what module does this support
* what downstream workflow depends on it
* does this increase trust, structure, and reusability

If the answer is unclear, it likely does not belong in the build yet.

This is how we keep the system sharp, premium, and automatable over time.

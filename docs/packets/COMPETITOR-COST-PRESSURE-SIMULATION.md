# Packet: Competitor-Aware Cost Pressure Simulation

**Packet ID:** `BID-COMPETITOR-COST-PRESSURE-V1`  
**Depends on:** `BID-EVALUATOR-POV-SCORING-AND-FINAL-READINESS-GATE` (evaluator simulation + final readiness gate), structured pricing model (`GroundingBundlePricing` / `PricingModel`), strategy competitor workspace  
**Status:** Specification — not yet implemented

---

## 1. Purpose

Extend the bid workspace from **structure-ready pricing + technical scoring simulation** to **explicit cost competitiveness under assumed competitor price postures**, without pretending false precision.

**Outcomes:**

- Show whether AllCare’s proposed economics are likely **defensible**, **compressed**, or **under pressure** relative to documented or inferred competitor bands.
- Surface **where to sharpen value narrative** (service scope, risk transfer, transition) when price cannot move.
- Feed **warnings** into the evaluator view and optionally into **final readiness** when cost posture is fragile *and* technical scores are tight.

This is **not** a bid optimizer and **not** a guarantee of state evaluator math. It is a **decision-support layer** aligned to the **300-point cost** bucket and honest uncertainty labels.

---

## 2. Problem Statement

Today:

- **Cost** in `computeEvaluatorSimulation` scores **structure, RFP coverage, and contract alignment**; it explicitly avoids **market competitiveness** when competitor dollars are unknown.
- **Competitor profiles** capture strategic threat and positioning but **not** normalized cost inputs.
- Teams still need a **single place** to ask: *“If Incumbent X prices to hold share, are we in the window — and what story fixes a gap?”*

This packet defines how to add **competitor-aware cost pressure** as an **optional overlay** on top of existing pricing + evaluator results.

---

## 3. Scope

### In scope

- Data model for **competitor cost assumptions** (ranges, basis, confidence).
- A **cost pressure simulation** that compares **AllCare total / unit economics** (from structured pricing) to **competitor bands** per solicitation-relevant slice (e.g., annual contract total, per-member-per-month proxy if defined).
- **Discrete pressure bands** (e.g., *favorable / neutral / pressured / severe*) with **plain-language narratives**.
- UI surfaces: **Strategy** (competitor detail), **Output / readiness** (summary strip or card), tie-in to **evaluator cost section** as a **second lane**: *structure score* vs *competitive pressure*.
- **Honesty rules:** unknown inputs → **explicit “insufficient data”** state; no fake decimal competitiveness.

### Out scope (v1)

- Automated scraping of competitor pricing from public records.
- Full Monte Carlo across correlated line items (unless explicitly added later).
- Legal/financial sign-off automation.

---

## 4. Conceptual Model

### 4.1 Two-axis cost view

| Axis | Meaning | Primary inputs |
|------|---------|----------------|
| **A. Structure & compliance** | Workbook completeness, RFP service coverage, contract-valid totals | Existing `GroundingBundlePricing`, `buildPricingLayerForProject` |
| **B. Competitive pressure** | AllCare vs assumed competitor **total or index** | New competitor cost assumptions + AllCare model totals |

Evaluator **Cost** section should expose **both**: e.g. structure score (current behavior) **plus** pressure overlay when data exists.

### 4.2 Competitor cost assumption (per competitor, optional)

Represent as **ranges**, not point estimates:

```text
competitorCostAssumption: {
  competitorId: string
  label: string                    // e.g. "Incumbent — hold-share scenario"
  basis: "sourced" | "inferred" | "judgment"
  confidence: "high" | "medium" | "low"
  /** Comparable metric — must match AllCare side (define one canonical comparison). */
  metric: "contract_total" | "annual_total" | "custom_index"
  /** Lower/upper bound in same currency/units as AllCare comparison. */
  rangeLow: number
  rangeHigh: number
  notes: string
  lastUpdated: string (ISO)
}
```

**Canonical comparison (S000000479):** prefer **contract total** from `PricingModel.totals.contractTotal` vs competitor **range** on the same basis; if line-item mix differs, require **narrative flag** that comparison is approximate.

---

## 5. Simulation Logic (v1)

### 5.1 Inputs

- AllCare: `pricingLayer.model.totals` (and optional derived PMPM if population denominator exists in RFP or user-entered assumption — **optional field**).
- Competitors: zero or more **active** cost assumptions for the project.
- User-selected **scenario**: e.g. *worst credible competitor* (max threat), *mid-case*, *custom*.

### 5.2 Pressure index (deterministic, simple)

Define **AllCare total** `T_all`.

For each competitor assumption with range `[L, H]`:

- If `T_all <= L` → **favorable** vs that band.
- If `L < T_all < H` → **neutral / in-band**.
- If `T_all >= H` → **pressured** (AllCare higher than band).
- If `T_all` vastly above `H` → **severe** (threshold configurable, e.g. >5–10% above `H` — **tune with user-visible sensitivity**, not hidden magic).

Aggregate scenario result:

- **Worst-case pressure** = max pressure across selected competitors (or percentile rule — document in code).
- If **no assumptions** → state **`market_unknown`**; **do not** adjust grand total from structure-only model; only show messaging.

### 5.3 Mapping to cost “reliability” adjustment (optional, conservative)

If product owners want a **single cost raw score** that reflects pressure:

- Start from existing **structure-based** raw cost score `S0`.
- Apply **at most** a **small downward adjustment** when pressure is `severe`, capped (e.g. −1.0 to −1.5 on 0–10) with **explicit label** *“competitive pressure (assumption-based)”*.
- Never raise score solely because competitors are expensive unless **sourced** evidence is marked `basis: "sourced"` and confidence ≥ medium.

Default recommendation: **keep structure score and pressure as separate fields** in `EvaluatorSimulationResult` extension to avoid conflating compliance with market luck.

---

## 6. Types & Code Touchpoints (proposed)

### 6.1 New / extended types (`src/types` or `src/types/cost-competition.ts`)

- `CompetitorCostAssumption`
- `CostPressureScenario` (`id`, `name`, `competitorAssumptionIds[]`, `aggregation: "max" | "weighted"`)
- `CostPressureResult`:
  - `state: "insufficient_data" | "favorable" | "neutral" | "pressured" | "severe"`
  - `allCareMetric: number`
  - `comparisonMetric: "contract_total" | ...`
  - `drivers: string[]` (human explanations)
  - `confidence: EvaluatorConfidence`
  - `assumptionsUsed: { competitorId, label, rangeLow, rangeHigh, basis }[]`

### 6.2 New lib

- `src/lib/cost-pressure-simulation.ts` — pure functions: `computeCostPressure(...)`.

### 6.3 Integration

- **`computeEvaluatorSimulation`:** either accept optional `CostPressureResult` and append **rationale / pointLossDrivers** on Cost section, **or** return extended result `EvaluatorSimulationResult & { costPressure?: CostPressureResult }`.
- **`computeFinalReadinessGate`:** optional **warning** when `costPressure.state === "severe"` **and** `technical.totalTechnicalScore` is below a configurable band (tight race scenario) — **not** a hard blocker by default.
- **Strategy UI:** edit competitor assumptions on competitor profile or a side panel.
- **Output surfaces:** small **“Cost pressure”** card next to evaluator scorecard; link to Strategy competitors.

### 6.4 Persistence

- v1: **localStorage** or **StrategyProvider** extension keyed by `projectId` (consistent with other strategy objects).
- v2: server `competitor_cost_assumptions` table if multi-device sync required.

---

## 7. UI / UX

- **Calm, credible copy:** “Assumption-based — not evaluated by the state.”
- **Always show basis** (sourced / inferred / judgment) on hover or secondary line.
- **Range visualization:** simple bar or two-number comparison (AllCare vs band), no false precision past integers for totals unless user enters decimals.
- **Empty state:** “Add competitor cost ranges in Strategy to unlock pressure simulation.”

---

## 8. Honesty Rules (mandatory)

- Do **not** fabricate competitor numbers.
- If only **one** competitor has a range, label scenario **“partial coverage.”**
- **Severe pressure** must never assert **why** competitors priced that way — only **relative position vs stated band**.
- Grand total **1,000-point** display: either **keep** current structure-only grand total as default, or show **two lines**: *Technical + cost (structure)* and *Cost competitiveness note* — avoid double-counting.

---

## 9. Acceptance Criteria

- [ ] User can enter **at least one** competitor cost range tied to a **project competitor** and **metric**.
- [ ] Simulation produces **`CostPressureResult`** with **state** and **drivers** without crashing when data is missing.
- [ ] Evaluator / output UI shows **structure vs pressure** distinction clearly.
- [ ] Final readiness gate **never** shows “ready to submit” **solely** because pressure is unknown — unknown remains **warning**, not pass.
- [ ] `npm run build`, `npm run lint`, `npm run typecheck:server` pass.

---

## 10. Suggested Commit (when implemented)

`feat: competitor-aware cost pressure simulation (assumption-based)`

---

## 11. Open Questions

1. Should **population / covered lives** denominator for PMPM come from RFP structured model, manual entry, or both?
2. Should **incumbent** auto-suggest a band from **historical spend** if the user attaches an internal file (future)?
3. Does **cost pressure** affect **only** messaging, or a **capped** adjustment to displayed cost score (product decision)?

---

## 12. Relationship to Prior Packet

| Prior capability | This packet |
|------------------|-------------|
| Evaluator POV scoring (700 + 300) | Adds **interpretive competitive context** for the **300** bucket when assumptions exist |
| Final readiness gate | Adds **optional warnings** for **severe pressure + tight technical** |
| Pricing structure / RFP coverage | Unchanged — still the **source of truth** for AllCare numbers |

This packet completes the arc from **“is our math valid?”** to **“are we in the ballpark against who we think we’re facing?”** — with disciplined uncertainty.

---
doc: prd
status: approved
---

# ScopeGuard — Product Requirements

An AI Collateral-Damage Firewall & Surgical Code Splicer that compares what you asked an AI for against what it actually changed, flagging silent collateral edits and letting you purge them with 1 click.
Source: `scope.md > The Unique Kernel`

## The Core Journey
1. **Arrival & Zero Setup:** The developer opens ScopeGuard. The interface loads in a calm, dark obsidian Apple Pro chassis. The Concordance Ring is resting with Scenario 1 pre-selected ("CSS Layout Sabotage").
2. **Instant Scan:** In under 100ms, the deterministic AST differ evaluates the scenario. The Concordance Ring shows **64% Intent Purity / 36% Collateral Drift**.
3. **Silent Regression Radar:** The center pane displays 3 discrete hunk cards:
   - Hunk 1: `✅ AUTHORIZED` — Added dark mode toggle button in `Navbar.tsx`.
   - Hunk 2: `🚨 COLLATERAL MUTATION` — AI silently changed `.dashboard-grid` columns from 3 to 2.
   - Hunk 3: `⚠️ SCOPE CREEP` — AI silently added an unrequested Google Analytics script tag.
4. **Surgical Splicing:** The developer clicks **"Purge 2 Collateral Edits"** (or toggles individual hunks). The Concordance Ring animates smoothly to **100% Pure**. The output code updates instantly in the right pane, keeping the requested button and restoring the original grid and clean head.
5. **Clean Export:** The developer clicks **Copy Clean Code** or **Download .patch** to commit the safe, clean changes to their repository.
6. **Custom Audit:** The developer clicks "Custom Audit" to paste their own prompt, before code, and after code, getting instant deterministic analysis.

## Screens and Layout
A focused 2-stage surgical experience:
- **View 1: Bento Launchpad (Hero & Staging Stage):**
  - Minimal top brand pill: `SCOPEGUARD` with live status indicator.
  - Oversized high-impact hero: `Code with AI. Ship with certainty.`
  - Apple Frosted Glass Bento Stage Chassis showcasing 3 real-world collateral disaster targets (`CSS / UI`, `API / TYPES`, `AUTH / LOGIC`) with category badges and micro-prompt glass pods.
  - High-impact gradient `[ Run Simulation → ]` button with subtle `or audit your own code diff ↗` trigger for custom inputs.
- **View 2: Surgical Results Workbench:**
  - Dedicated top navigation bar with `[ ← Back to Scenarios ]` pill and active scenario indicator.
  - High-precision SVG **Concordance Ring** (purity telemetry gauge) displaying Intent Purity % vs. Threat state, metric counts, and master `PURGE COLLATERAL EDITS` action.
  - **Left Pane (Silent Regression Radar):** Contiguous hunk cards with authorized vs. collateral badges, impact analysis, code line ranges, and instant purge/undo buttons.
  - **Right Pane (Surgical Code Inspector):** Toggle between `CLEAN CODE` and `RAW AI` with 1-click clipboard copy and unified `.patch` export.

## Look and Feel
- **Visual Direction:** Apple Xcode Instruments meets Apple Watch Activity Rings.
- **Palette:**
  - Base: Deep obsidian `#08090D` with hairline frosted borders `rgba(255,255,255,0.07)`.
  - Accents: Electric Cyan `#00E5FF` (Authorized intent), Fluorescent Amber `#FF9500` (Collateral damage), Crimson `#FF453A` (Invariant breaches).
  - Typography: System SF Pro / Inter with tabular numerics. Clean, surgical, no clutter.

## Features and Behavior

### Myers/LCS Line & Hunk Differ
- Computes exact line additions, deletions, and unchanged anchors between Before and After source texts.
- Groups adjacent line changes into discrete, independently actionable mutation hunks.

### Structural Symbol & AST Scanner
- Scans function declarations, class exports, CSS selectors, imports, and `try/catch` safety blocks.
- Identifies the exact structural symbol enclosing each diff hunk.

### Intent & Scope Classifier
- Dynamically extracts meaningful keyword tokens and stems from arbitrary user prompts, filtering common filler stop-words.
- Evaluates token overlap between prompt intent and enclosing AST symbols / added lines to classify hunks as `AUTHORIZED`, `COLLATERAL_MUTATION`, `SCOPE_CREEP`, or `INVARIANT_BREACH`.
- Enforces critical safety invariants: flags any unrequested deletion of `try/catch` error handlers, authentication checks, timeouts, or retries.
- Generates plain-English impact summaries explaining the real-world consequence of collateral edits across 100+ unscripted scenarios.

### Surgical Splicer
- Reconstructs clean source code by applying only authorized/accepted hunks onto the original base.
- Generates valid unified diff `.patch` files on demand.

## States and Boundaries
- **Initial Load:** Pre-loaded with Scenario 1, analysis ready immediately.
- **Custom Input State:** Allows pasting prompt, before code, and after code with instant re-scan.
- **Purged State:** All collateral edits toggled off, Concordance Ring at 100%, clean code ready for production.

## Product Decisions
- **100% Deterministic Local Engine:** Runs client-side in TypeScript with zero latency and zero dependency on paid external APIs.
- **Pre-Loaded Scenarios:** Guarantees judges can test and understand the tool in under 10 seconds without needing an API key or repo access.

## Non-Goals
- Multi-repository cloud webhook bot (out of PoC scope).
- Automated git branch management (unnecessary complexity for local developer tool).

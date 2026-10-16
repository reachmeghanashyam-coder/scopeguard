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
A unified single-screen surgical workbench:
- **Top Telemetry Header:**
  - Wordmark: `SCOPEGUARD // AI CODE FIREWALL`
  - High-precision SVG **Concordance Ring** with Intent Purity % vs. Drift %.
  - Metric Pills: `Authorized (1)`, `Collateral (2)`, `Lines Protected (18)`.
  - Scenario Selector Pills: `1. CSS Sabotage`, `2. API Regression`, `3. Ghost Dependency`, `4. Custom Input`.
- **Main 3-Pane Workbench:**
  - **Left Pane (Intent & Scope Guardrails):** Prompt card, target symbols, and scope locks.
  - **Center Pane (Silent Regression Radar & Hunk Cards):** Interactive cards for each change hunk with classification badges, line ranges, impact explanation, and [Keep / Purge] toggles.
  - **Right Pane (Code Inspector & Spliced Output):** 3-tab view: `Clean Spliced Code` | `Side-by-Side Diff` | `Raw AI Output` with 1-click Copy and Download Patch buttons.

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
- Categorizes hunks as `AUTHORIZED`, `COLLATERAL_MUTATION`, `SCOPE_CREEP`, or `INVARIANT_BREACH`.
- Generates plain-English impact summaries explaining the real-world consequence of collateral edits.

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

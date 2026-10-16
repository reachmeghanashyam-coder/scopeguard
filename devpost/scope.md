---
doc: scope
status: approved
---

# ScopeGuard

An AI Collateral-Damage Firewall & Surgical Code Splicer that detects silent, unrequested code mutations made by AI coding agents and surgically purges them while preserving requested features.

## The Unique Kernel
Deterministic structural AST symbol extraction and hunk diff analysis that compares **User Intent / Allowed Scope** against **Actual Code Mutations**. Unlike passive text linters, ScopeGuard features a **Surgical Splicer** that mathematically reconstructs clean source files by purging unauthorized collateral changes with a single click.

## Who It's For
Developers who use AI coding agents (Cursor, Claude Code, Copilot, Antigravity) and suffer from "Diff Blindness"—accepting AI changes only to discover days later that the AI silently altered unrelated functions, broke CSS layouts, or deleted error handlers.

## The Core Loop
1. The developer inspects an AI agent's proposed changes (via 4 built-in real-world disaster scenarios or custom code/diff input).
2. ScopeGuard parses the AST symbols and diff hunks, rendering a high-precision **Concordance Ring** (Intent Purity vs. Collateral Drift) and **Silent Regression Radar**.
3. Every hunk is classified: `AUTHORIZED` (the feature you asked for), `COLLATERAL_MUTATION` (unrelated working code altered or deleted), or `SCOPE_CREEP` (unrequested bloat).
4. The developer clicks **"Purge Collateral Edits"** $\rightarrow$ the Surgical Splicer reconstructs the clean code in real time, keeping the requested feature intact.
5. The developer copies the clean code or downloads a `.patch` file.

## Inspiration & Identity
- **Apple Pro Developer Tools (Instruments, Xcode Organizer):** Extreme quiet restraint, deep obsidian chassis, SF Pro / Inter typography, high-contrast cyan/amber status indicators, zero gimmickry.
- **Concordance Meter:** Inspired by Apple Watch Activity Rings—communicating intent alignment versus drift in a single 3-second glance.

## Why This Matters to the Learner
Born directly from the learner's real frustration with AI coding tools silently breaking working code. Solves the exact "Cognitive Debt" problem at the heart of the Devpost Learn curriculum.

## What "Working" Looks Like
Selecting a scenario where an AI was asked to add a button but also silently broke an API timeout and altered a CSS grid, seeing the Concordance Ring immediately flag 62% Intent / 38% Collateral Drift with explicit impact badges, clicking "Purge Collateral Damage", and watching the code instantly reconstruct to 100% clean with the button preserved and the broken code reverted.

## The POC Boundary
- Single-screen desktop surgical workbench.
- Deterministic Myers/LCS line and hunk diffing engine.
- Structural symbol extractor for TypeScript, JavaScript, and CSS.
- 4-tier classification: Authorized, Collateral Mutation, Scope Creep, Invariant Breach.
- Real-time Surgical Splicer reconstructing clean code without collateral hunks.
- 4 pre-loaded real-world disaster scenarios + Live Custom Input mode.
- 1-click clean code copy and unified `.patch` export.

## Later
- VS Code / Cursor native extension.
- Git pre-commit CLI hook (`npx scopeguard check`).
- Multi-file directory scan.

## Explicitly Cut
- Cloud database and user logins (unnecessary bloat for a local dev tool).
- Paid external API dependencies for core analysis (deterministic engine runs 100% offline).

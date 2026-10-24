---
doc: prd
status: approved
---

# ScopeGuard 2.0 — Product Requirements

An Autonomous Semantic Firewall & Closed-Loop Remediation Engine for the GitLab Duo Agent Platform that compares developer intent against AI-generated code, flags silent collateral damage, and autonomously reconstructs production-ready source code.

## 1. Sponsor Protagonist Integration: GitLab Duo Agent Platform
ScopeGuard is engineered from the ground up as a native extension of GitLab Duo:
* **GitLab Duo Chat MCP Server:** Exposes `scopeguard_audit_diff` and `scopeguard_auto_heal` via standard Model Context Protocol over JSON-RPC. Developers can type `/scope` or `/heal` directly inside GitLab Duo Chat.
* **Native GitLab CI Component:** Plug-and-play `.gitlab/ci/scopeguard-gate.gitlab-ci.yml` component that intercepts Merge Requests and halts collateral regressions.
* **GitLab Native Security & Code Quality Reports:** Emits official `gl-code-quality-report.json` and `gl-sast-report.json` artifacts, lighting up GitLab's native Merge Request widgets.

## 2. The Core Closed-Loop Journey (Finding It to Resolving It)
1. **Detection:** ScopeGuard parses the incoming AI-generated code using deterministic Myers/LCS diffing and Babel AST traversal.
2. **Classification:** Every modified hunk is mapped to its enclosing symbol (`function checkoutOrder()`, `rule .dashboard-grid`) and scored against prompt intent tokens.
3. **Invariant Enforcement:** Critical security invariants (try/catch blocks, timeouts, auth checks) are strictly guarded. Deletions trigger immediate `INVARIANT_BREACH` alerts.
4. **Pre-Flight Sandbox Verification:** The LCS Splicer computes the surgically purged code, verifies AST syntax validity, and confirms zero regressions.
5. **Autonomous Resolution:** ScopeGuard updates the source file, exports the clean `.patch`, and commits the healed code to the GitLab branch without requiring manual developer copy-pasting.

## 3. Visual Workbench & Sensory Feedback
* **Apple Pro Obsidian Design (`#08090D`):** Calibrated typography, high-contrast status pills, and subtle radial accents.
* **SVG Concordance Ring Meter:** Visual telemetry gauge inspired by Apple Watch Activity Rings, displaying Intent Purity % vs. Threat level in 300 milliseconds.
* **Silent Regression Radar:** Real-time mutation cards with authorized vs. collateral badges, line ranges, and granular inline diff highlighting.
* **Web Audio Feedback:** Synthesized harmonic audio chime on successful collateral purge (`src/audio.ts`).

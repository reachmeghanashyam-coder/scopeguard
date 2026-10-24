---
doc: scope
status: approved
---

# ScopeGuard 2.0

An Autonomous Semantic Firewall & Blast Radius Controller for the GitLab Duo Agent Platform that intercepts AI-generated Merge Requests, detects silent collateral code mutations, and surgically purges regressions with byte-level fidelity.

## The Unique Kernel: Hero Sponsor Integration with GitLab Duo
ScopeGuard is the dedicated **Semantic Integrity & Blast Radius Firewall for the GitLab Duo Agent Platform**.

While AI coding assistants (GitLab Duo Code Suggestions, Claude, Copilot) accelerate code creation, they introduce an acute enterprise vulnerability: **"Diff Blindness"**—silently deleting try/catch blocks, breaking production CSS layouts, altering unrelated functions, and introducing ghost dependencies.

**ScopeGuard is the mechanical immune system for GitLab Duo:**
1. **The Life After Code Protagonist:** Operating natively in GitLab CI/CD (`.gitlab/ci/scopeguard-gate.gitlab-ci.yml`) and GitLab Duo Chat via the Model Context Protocol (`dist/mcp.js`), ScopeGuard analyzes Merge Requests the instant they are opened.
2. **Intent Concordance Scoring:** Compares the developer's authorized prompt against staged Babel AST symbol changes.
3. **Closed-Loop Surgical Splicing:** Rather than passively alerting, ScopeGuard's deterministic LCS Splicer purges collateral mutations with zero human intervention and updates the Merge Request with verified clean code.

## The Core Loop (Closed-Loop Autonomous Healing)
1. An AI coding agent opens a Merge Request on GitLab.
2. ScopeGuard intercepts the MR diff, extracts AST symbols via Babel, and computes the **Concordance Score** (Intent Purity vs. Collateral Drift).
3. Every mutation is classified:
   - `AUTHORIZED` (Legitimate feature requested).
   - `COLLATERAL_MUTATION` (Unrelated working code modified).
   - `SCOPE_CREEP` (Unrequested bundle bloat or ghost libraries).
   - `INVARIANT_BREACH` (Deleted error handlers, timeouts, or auth checks).
4. **Auto-Heal:** The LCS Surgical Splicer applies inverse hunk transformations, verifying that all invariants are restored.
5. Emits official `gl-code-quality-report.json` and updates the GitLab Merge Request automatically.

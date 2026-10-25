# ScopeGuard 🛡️
> **Deterministic AI Code Firewall & Surgical Splicer for GitLab Duo**  
> *Intercept and purge silent AI regressions before they enter your codebase.*

[![Vitest: 137 Passing Tests](https://img.shields.io/badge/Vitest-137_Passing_Tests-00E5FF?logo=vitest)](tests)
[![GitLab Duo Agent Platform](https://img.shields.io/badge/GitLab-Duo_Agent_Platform-FC6D26?logo=gitlab)](https://about.gitlab.com)
[![Model Context Protocol](https://img.shields.io/badge/Protocol-MCP_JSON--RPC-8A2BE2)](src/mcp.ts)
[![TypeScript 5.5](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Demo Video](https://img.shields.io/badge/Demo_Video-YouTube-FF0000?logo=youtube)](https://youtu.be/Jkpl6Bx4MDU)
[![License: MIT](https://img.shields.io/badge/License-MIT-FF9500.svg)](LICENSE)

---

## 💡 The Problem: The Hidden Tax of AI Coding

Modern AI coding agents (GitLab Duo, Cursor, Copilot, Claude) generate code with incredible velocity. However, they introduce a dangerous failure mode: **Silent AI Collateral Damage**:
- **Silent Invariant Deletion**: You asked to format an API payload; the AI silently deleted your production `try/catch` error block and timeout fallback.
- **Unrequested Layout Sabotage**: You asked for a dark mode toggle; the AI silently rewrote your responsive dashboard grid from 3 columns to 2.
- **Ghost Dependencies & Telemetry**: You asked to validate a discount coupon; the AI imported unapproved external telemetry and altered authentication middleware.

Developers spend grueling hours squinting at raw git diffs to catch these bugs before production crashes at 2:00 AM. **AI speed gains are wiped out by cognitive review debt.**

---

## ⚡ The Solution: ScopeGuard

ScopeGuard is a **Deterministic Lexical AST & Invariant Code Firewall** that enforces strict semantic boundary guardrails between what the developer asked for and what the AI actually changed.

Instead of slow, non-deterministic LLM re-prompts, ScopeGuard executes an in-memory lexical scanner in **< 5ms** with zero API cost, zero network roundtrips, and mathematical reproducibility.

```
Original Code + Proposed Changes + User Prompt
         │
         ▼
 [1] Myers LCS Diff Engine          ──▶ Contiguous Line Hunks
         │
         ▼
 [2] Structural Symbol Resolver     ──▶ Identifies Enclosing Function/Class/CSS Scope
         │
         ▼
 [3] Lexical Invariant Classifier   ──▶ Catches Stripped Try/Catch, Auth & Scope Creep
         │
         ▼
 [4] Concordance Telemetry Pod      ──▶ Computes Exact Semantic Concordance Score
         │
         ▼
 [5] Surgical Reconstruction Engine ──▶ 1-Click "Purge Regressions" (Byte-for-Byte Clean)
```

---

## 🏆 Multi-Stage GitLab Duo Integration

ScopeGuard covers the complete developer lifecycle across **4 interconnected stages**:

| Stage | How ScopeGuard Protects Code | Command / Integration |
|---|---|---|
| **1. Local IDE / Desktop** | Instant visual diff inspection & 1-click surgical purge | `npm run dev` (Interactive Surgical Workbench) |
| **2. Git Pre-Commit Hook** | Intercepts staged git diffs and blocks commits on regression | `npx scopeguard --install-hook` |
| **3. Autonomous CLI / CI Gate** | Non-zero exit code on CI runner if AI breached invariants | `npx scopeguard --check` or `npx scopeguard --auto-heal` |
| **4. GitLab Duo & MCP** | Native stdio Model Context Protocol (MCP) server & MR Sentinel note | `.gitlab/duo/flows/scopeguard-flow.yml` & `src/mcp.ts` |

---

## 🚀 Key Capabilities

1. **Deterministic Lexical AST Scanner**: Resolves enclosing code symbols (`function processPayment()`, `class AuthToken`) and flags deleted safety invariants in **< 5ms**.
2. **Tactile Surgical Workbench**: Deep obsidian bento layout with 60Hz mechanical sub-bass audio synthesis, laser-sweep scanline animations, and HTML5 canvas particle feedback.
3. **1-Click Master Purge**: Reconstructs working source code byte-for-byte, rolling back unrequested mutations while preserving authorized changes.
4. **Git Pre-Commit Firewall**: Installs directly into `.git/hooks/pre-commit` to prevent corrupted AI patches from ever entering the git log.
5. **Model Context Protocol (MCP) Server**: Exposes `scopeguard_audit_diff` and `scopeguard_auto_heal` tools via JSON-RPC 2.0 stdio for seamless GitLab Duo Chat integration.
6. **Zero External Runtime Dependencies**: 100% deterministic TypeScript/Node.js. No external LLM token bills, no rate limits, zero privacy leaks.

---

## 🧪 Automated Test Fortress (137/137 Tests Passing)

ScopeGuard is verified against a zero-dependency automated Vitest test fortress covering 12 test suites:

- **Phase 4 & Golden Suites**: Intent classification, distraction defense, keyword distraction resistance.
- **Pillars 1 & 2**: Safety invariants (`try/catch`, timeouts, session validation) and false alarm rejection.
- **Pillar 3**: AST splicer adversarial torture tests (non-ASCII Unicode, CRLF/LF line endings, out-of-order hunks).
- **Pillar 4 & CLI**: Real Git repo integration, staged diff pre-commit abort, and synthetic `.git/index.lock` concurrency handling.
- **MCP & GitLab Sentinel**: JSON-RPC stdio protocol compliance and automated Merge Request markdown reporting.

```bash
# Run the complete test fortress
npm test
```

---

## 🏃 Quickstart

### 1. Zero-Install Instant Terminal Audit
```bash
npx scopeguard "Add dark mode toggle to header"
```

### 2. Install Git Pre-Commit Firewall
```bash
npx scopeguard --install-hook
```

### 3. Run Web Surgical Workbench
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 📁 Repository Structure

```
scopeguard/
├── .gitlab/
│   └── duo/
│       └── flows/
│           └── scopeguard-flow.yml # GitLab Duo Flow Registry v1 definition
├── src/
│   ├── engine/
│   │   ├── differ.ts              # Myers LCS diff & hunk grouping engine
│   │   ├── astScanner.ts          # Structural symbol resolver
│   │   ├── classifier.ts          # Lexical invariant & scope firewall classifier
│   │   ├── splicer.ts             # Deterministic source code reconstruction
│   │   └── gitlabSentinel.ts      # Automated GitLab MR review comment generator
│   ├── audio.ts                   # Web Audio mechanical sub-bass frequency synthesizer
│   ├── particles.ts               # HTML5 canvas micro-particle celebration system
│   ├── cli.ts                     # Pre-commit hook & terminal CLI firewall
│   ├── mcp.ts                     # Model Context Protocol (MCP) JSON-RPC stdio server
│   ├── scenarios.ts               # Pre-loaded realistic AI regression benchmarks
│   ├── types.ts                   # Core data contracts & interfaces
│   ├── style.css                  # Apple-Pro dark obsidian stylesheet
│   └── main.ts                    # UI orchestrator & telemetry
├── tests/                         # 12 test suites (137 automated unit & adversarial tests)
├── Dockerfile                     # Google Cloud Run deployment container
├── cloudbuild.yaml                # Google Cloud Build CI trigger
├── index.html                     # Main application interface
├── package.json
└── tsconfig.json
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

# ScopeGuard 🛡️
> **Deterministic AI Code Firewall & Surgical Splicer**  
> *Stop silent AI regressions before they enter your codebase.*

[![Vitest Tests](https://img.shields.io/badge/tests-passing-00E5FF)](https://github.com)
[![TypeScript 5.5](https://img.shields.io/badge/typescript-5.5-3178C6)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-FF9500.svg)](LICENSE)

---

## 💡 The Problem: The Hidden Tax of AI Coding

Modern AI coding agents (Claude, Copilot, ChatGPT) write impressive code. But they introduce a subtle and dangerous failure mode known as **AI Collateral Damage**:
- **Silent Invariant Deletion**: You asked to format a currency string; the AI silently erased your production `try/catch` block and timeout configuration.
- **Unrequested Layout Sabotage**: You asked for a dark mode toggle button in the header; the AI silently rewrote your responsive dashboard grid from 3 columns to 2.
- **Ghost Dependencies & Telemetry**: You asked to validate a coupon code; the AI added unverified tracking endpoints and imported new heavy libraries.

Developers spend hours reviewing raw unified diffs or discovering broken features days after merging. **AI speed gains are wiped out by cognitive debt.**

---

## ⚡ The Solution: ScopeGuard

ScopeGuard is an in-browser, deterministic code firewall and surgical reconstruction engine. It enforces strict boundary guardrails between what the developer asked for and what the AI actually changed.

```
Original Code + AI Proposed Code + Developer Prompt
        │
        ▼
[1] Myers/LCS Line Diff Engine   ──▶ Contiguous Line Hunks
        │
        ▼
[2] Structural Symbol Scanner   ──▶ Lexical Enclosing Symbol Detection
        │
        ▼
[3] Intent & Scope Classifier   ──▶ Identifies Collateral Mutations & Invariant Breaches
        │
        ▼
[4] Concordance Ring Telemetry  ──▶ Purity Score & Collateral Radar Readouts
        │
        ▼
[5] Surgical Remediation Engine ──▶ 1-Click "Purge Collateral" & Reconstruct Clean Code
```

---

## 🚀 Key Features

1. **SVG Concordance Ring Meter**: Calibrated telemetry gauge providing instant visual confirmation of code purity (Authorized vs. Collateral modifications).
2. **Silent Regression Radar**: Live hunk cards highlighting exact enclosing symbols (`function processOrder()`, `rule .dashboard-grid`), impact summaries, and granular inline diffs.
3. **1-Click Master Purge**: Automatically eliminates every collateral mutation and invariant breach with a single click, instantly restoring original working logic while keeping legitimate features.
4. **Interactive Custom Code Audit**: Paste any developer prompt, original code, and AI-generated output to run an instant deterministic firewall scan.
5. **Production Patch Exporter**: Download standard unified `.patch` files ready to apply via `git apply` or copy clean spliced source directly to clipboard.
6. **Zero External Dependencies**: Runs 100% locally in the browser with sub-millisecond execution. No external server, no API key required, zero privacy leakage.

---

## 🛠️ Tech Stack & Architecture

- **Language**: TypeScript 5.5 (Strict Mode)
- **Bundler & Dev Server**: Vite 5.4
- **Testing**: Vitest 1.6 (Automated unit test suite verifying diff, classification, and splicing mathematics)
- **Styling**: Apple-Pro dark obsidian design (`#060709`), SF Pro Display typography, responsive CSS grid, hardware-accelerated SVG ring.

See the complete interactive code tour in [devpost/app-map.html](devpost/app-map.html).

---

## 🏃 Quickstart

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/scopeguard.git
cd scopeguard

# Install dependencies
npm install

# Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## 📁 Repository Structure

```
scopeguard/
├── devpost/                   # Hackathon submission documentation
│   ├── app-map.html           # Interactive code tour & architecture flow
│   ├── checklist.md           # Verifiable build slices & checkpoints
│   ├── prd.md / prd.html      # Product Requirements Document
│   ├── spec.md / spec.html    # Technical Specification
│   └── scope.md / scope.html  # Problem statement & boundary scope
├── src/
│   ├── engine/
│   │   ├── differ.ts          # Myers / LCS diff & hunk grouping engine
│   │   ├── astScanner.ts      # Structural symbol resolver
│   │   ├── classifier.ts      # Intent & Scope firewall classifier
│   │   └── splicer.ts         # Deterministic source code reconstruction
│   ├── scenarios.ts           # Pre-loaded realistic AI regression benchmarks
│   ├── types.ts               # Core data contracts & interfaces
│   ├── style.css              # Apple-Pro dark theme stylesheet
│   └── main.ts                # Application orchestrator & UI telemetry
├── tests/
│   ├── engine.test.ts         # Diff & AST symbol unit tests
│   └── splicer.test.ts        # Intent classification & surgical splicing tests
├── index.html                 # Main application interface
├── package.json
└── tsconfig.json
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

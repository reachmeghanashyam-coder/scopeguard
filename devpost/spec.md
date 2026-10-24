---
doc: spec
status: approved
---

# ScopeGuard — Technical Spec

## How This Works, In Plain Language
ScopeGuard executes a 4-stage deterministic analysis pipeline:
1. When a scenario is loaded or custom code is entered, the **Differ** splits the Before and After source texts into line arrays and computes the contiguous change hunks.
2. The **AST Symbol Scanner** uses structural regexes and grammar rules to identify the scope/symbol enclosing each hunk (function, class, CSS rule, import, or safety block).
3. The **Classifier** tests whether the modified symbols were authorized by the user's prompt. Hunks touching unrelated working code are tagged `COLLATERAL_MUTATION`.
4. The **Surgical Splicer** recalculates the clean output text by applying only the hunks marked `KEEP` on top of the original base text, updating the **Concordance Ring** and diff viewer instantaneously.

## The Core Journey Through the System
1. `index.html` loads Vite bundle → ScopeGuard presents View 1 (Bento Launchpad) with 3 real-world simulation targets staged.
2. User selects a target (e.g. "CSS Layout Sabotage") and clicks **Run Simulation →** → View switches smoothly to View 2 (Surgical Results Workbench).
3. `engine/differ.ts` extracts Myers line hunks → `engine/astScanner.ts` resolves enclosing symbols → `engine/classifier.ts` flags collateral mutations.
4. UI renders initial threat state: Concordance Ring at 50% with amber warning ring, master `PURGE COLLATERAL EDITS` button, and red threat hunk cards.
5. User clicks **"PURGE COLLATERAL EDITS"** → All collateral hunks toggle to rejected state.
6. `engine/splicer.ts` reconstructs clean code in real time → Concordance Ring animates to 100% pure green, master button displays persistent `✓ ALL COLLATERAL EDITS PURGED`, and clean code displays in inspector.
7. User copies clean code via clipboard or clicks **"Download .patch ↓"** to export a standard unified patch.
PRD ref: `prd.md > The Core Journey`.

## Stack
- **Language & Runtime:** TypeScript 5.4, HTML5, CSS3.
- **Build Tool:** Vite 5.2.
- **Test Framework:** Vitest.
- **Zero External Heavy Dependencies:** Pure deterministic algorithms running 100% in-browser.

## Where It Runs and How Someone Tries It
- **Runtime:** Any modern browser.
- **Start Command:**
  ```bash
  npm run dev
  ```
  Open `http://localhost:5173`.
- **Test Command:**
  ```bash
  npm test
  ```

## Look and Feel
- **Chassis:** Deep matte obsidian `#08090D` with hairline frosted panels `rgba(255,255,255,0.06)`.
- **Concordance Ring:** SVG circular telemetry meter showing Intent Purity vs. Collateral Drift.
- **Accents:** Electric Cyan `#00E5FF`, Fluorescent Amber `#FF9500`, Crimson `#FF453A`.

## Components

### 1. `Differ` (`src/engine/differ.ts`)
Calculates line-by-line diff and groups contiguous additions and deletions into `DiffHunk` structures.
PRD ref: `prd.md > Myers/LCS Line & Hunk Differ`.

### 2. `AstScanner` (`src/engine/astScanner.ts`)
Extracts enclosing function declarations, exports, CSS selectors, and `try/catch` safety blocks.
PRD ref: `prd.md > Structural Symbol & AST Scanner`.

### 3. `Classifier` (`src/engine/classifier.ts`)
Determines `AUTHORIZED`, `COLLATERAL_MUTATION`, or `SCOPE_CREEP` based on prompt intent and symbol correlation.
PRD ref: `prd.md > Intent & Scope Classifier`.

### 4. `Splicer` (`src/engine/splicer.ts`)
Mathematically reconstructs the clean code by filtering and applying only accepted hunks onto the original base code.
PRD ref: `prd.md > Surgical Splicer`.

## Data Model
```typescript
export interface DiffHunk {
  id: string;
  beforeStartLine: number;
  beforeLineCount: number;
  afterStartLine: number;
  afterLineCount: number;
  deletedLines: string[];
  addedLines: string[];
  enclosingSymbol: string;
  status: 'AUTHORIZED' | 'COLLATERAL_MUTATION' | 'SCOPE_CREEP' | 'INVARIANT_BREACH';
  impactSummary: string;
  accepted: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  prompt: string;
  filename: string;
  language: 'typescript' | 'javascript' | 'css';
  beforeCode: string;
  aiCode: string;
}
```

## File Structure
```
scopeguard/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── devpost/
│   ├── learner-profile.md
│   ├── scope.md
│   ├── prd.md
│   ├── spec.md
│   ├── checklist.md
│   └── app-map.html
├── src/
│   ├── main.ts
│   ├── style.css
│   ├── types.ts
│   ├── scenarios.ts
│   └── engine/
│       ├── differ.ts
│       ├── astScanner.ts
│       ├── classifier.ts
│       └── splicer.ts
└── tests/
    └── engine.test.ts
```

## Important Failure Modes
1. **Empty / Identical Inputs:** Handled gracefully with 100% Concordance and zero hunks.
2. **Malformed Custom Diff:** Handled with clear syntax error badge instead of crash.

## What Was Simplified and Why
- **Heuristic AST Tokenizer instead of full Babel/Tree-Sitter parser:** Keeps the app zero-dependency, ultra-lightweight (<30kB bundle), and instant without WebAssembly loading overhead.

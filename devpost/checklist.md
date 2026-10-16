---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [ ] **1. The Differ & AST Symbol Engine**
  Becomes usable: Automated diffing and AST scanning engine that parses line additions/deletions and identifies enclosing symbols.
  Why now: The algorithmic core of ScopeGuard; all UI and classification relies on this engine.
  PRD ref: `prd.md > Features and Behavior > Myers/LCS Line & Hunk Differ`
  Spec ref: `spec.md > Components > 1. Differ`, `spec.md > Components > 2. AstScanner`
  Build: Implement `differ.ts` line-by-line hunk extractor, `astScanner.ts` symbol resolver, and `types.ts`.
  Verify (mechanical): Automated Vitest test suite passes confirming correct hunk line ranges and symbol identification.
  Learner check: Run `npm test` and verify that diff hunk extraction is mathematically exact.
  Commit: `feat(engine): add line hunk differ and AST structural symbol scanner`

- [ ] **2. The Intent Classifier & Surgical Splicer**
  Becomes usable: Classifier that categorizes hunks into `AUTHORIZED` vs `COLLATERAL_MUTATION`, and a mathematical splicer that applies only accepted hunks to reconstruct clean code.
  Why now: Delivers the core unique value: turning detection into instant 1-click remediation.
  PRD ref: `prd.md > Features and Behavior > Intent & Scope Classifier`, `prd.md > Surgical Splicer`
  Spec ref: `spec.md > Components > 3. Classifier`, `spec.md > Components > 4. Splicer`
  Build: Implement `classifier.ts`, `splicer.ts`, and 4 real-world test scenarios in `scenarios.ts`.
  Verify (mechanical): Unit test confirms that purging collateral hunks restores original working code while preserving requested additions.
  Learner check: Test that purging a collateral hunk mathematically removes it from the reconstructed text.
  Commit: `feat(splicer): add intent classifier and surgical code reconstruction engine`

- [ ] **3. Apple-Pro Workbench UI & Concordance Ring**
  Becomes usable: High-precision anodized dark UI with SVG Concordance Ring, Silent Regression Radar hunk cards, and 1-click "Purge All Collateral" button.
  Why now: Gives the tool its signature Apple Pro design and instant 3-second comprehension for judges.
  PRD ref: `prd.md > Screens and Layout`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Look and Feel`
  Build: Implement `index.html`, `style.css`, and `main.ts` wiring the Concordance Ring gauge and interactive hunk cards.
  Verify (mechanical): Dev server serves bundle with 0 errors; Concordance Ring updates dynamically when hunks are toggled.
  Learner check: Open http://localhost:5173, click "Purge Collateral Edits", and watch the Concordance Ring animate to 100%.
  Commit: `feat(ui): add Apple-Pro Concordance Ring and surgical hunk cards`

- [ ] **4. Custom Code Audit, Patch Exporter & Documentation**
  Becomes usable: Custom input editor allowing developers to audit any prompt + code, clean `.patch` download, plus `devpost/app-map.html`, `README.md`, and `LICENSE`.
  Why now: Completes the full developer workflow and satisfies 100% of Devpost submission requirements.
  PRD ref: `prd.md > The Core Journey` (steps 5-6)
  Spec ref: `spec.md > File Structure`
  Build: Add custom input modal/tab, clipboard copy & `.patch` download triggers, and generate `devpost/app-map.html`.
  Verify (mechanical): Production build passes cleanly; full test suite green.
  Learner check: Test custom prompt/code audit, verify clean `.patch` file downloads.
  Commit: `feat(export): add custom code audit, patch exporter, and devpost app-map`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — Slice 1 boundary (differ & AST engine working)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [to be recorded during build]
Route and stops: [to be recorded during build]
Edit outcome: [to be recorded during build]
Reflection: [to be recorded during build]
Activity mode: [to be recorded during build]

## Revisions


import { describe, it, expect } from 'vitest';
import { computeLineDiff } from '../src/engine/differ.js';
import { resolveEnclosingSymbols } from '../src/engine/astScanner.js';
import { classifyHunks } from '../src/engine/classifier.js';
import { spliceSource } from '../src/engine/splicer.js';
import { SCENARIOS } from '../src/scenarios.js';

describe('ScopeGuard Intent Classification & Surgical Splicing', () => {
  it('correctly classifies collateral layout edits and restores clean code', () => {
    const sc = SCENARIOS[0]; // CSS Layout Sabotage
    const rawHunks = computeLineDiff(sc.beforeCode, sc.aiCode);
    const resolvedHunks = resolveEnclosingSymbols(sc.aiCode, rawHunks);
    const classified = classifyHunks(sc.prompt, resolvedHunks);

    // Should detect dark mode button as AUTHORIZED and grid changes as COLLATERAL_MUTATION
    const authorized = classified.filter(h => h.status === 'AUTHORIZED');
    const collateral = classified.filter(h => h.status === 'COLLATERAL_MUTATION');

    expect(authorized.length).toBeGreaterThan(0);
    expect(collateral.length).toBeGreaterThan(0);

    // Reject collateral hunks and splice clean code
    const purgedHunks = classified.map(h => ({
      ...h,
      accepted: h.status === 'AUTHORIZED'
    }));

    const cleanCode = spliceSource(sc.beforeCode, purgedHunks);

    // Clean code should contain the requested toggle button AND the original 3-column grid
    expect(cleanCode).toContain('.dark-mode-toggle-button');
    expect(cleanCode).toContain('grid-template-columns: repeat(3, 1fr);');
    expect(cleanCode).not.toContain('grid-template-columns: repeat(2, 1fr);');
  });

  it('detects deleted try/catch blocks as INVARIANT_BREACH in API scenario', () => {
    const sc = SCENARIOS[1]; // API Timeout & Error Regression
    const rawHunks = computeLineDiff(sc.beforeCode, sc.aiCode);
    const resolvedHunks = resolveEnclosingSymbols(sc.aiCode, rawHunks);
    const classified = classifyHunks(sc.prompt, resolvedHunks);

    const breach = classified.filter(h => h.status === 'INVARIANT_BREACH');
    expect(breach.length).toBeGreaterThan(0);
    expect(breach[0].impactSummary).toContain('error handling');
  });
});

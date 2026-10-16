import { describe, it, expect } from 'vitest';
import { computeLineDiff } from '../src/engine/differ.js';
import { resolveEnclosingSymbols } from '../src/engine/astScanner.js';

describe('ScopeGuard Differ & AST Scanner Engine', () => {
  it('correctly isolates contiguous change hunks and line ranges', () => {
    const before = 'line 1\nline 2\nline 3\nline 4';
    const after = 'line 1\nline 2 MODIFIED\nline 3\nline 4\nline 5 ADDED';

    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(2);
    expect(hunks[0].deletedLines).toEqual(['line 2']);
    expect(hunks[0].addedLines).toEqual(['line 2 MODIFIED']);
    expect(hunks[1].addedLines).toEqual(['line 5 ADDED']);
  });

  it('correctly resolves enclosing function and CSS selector symbols', () => {
    const code = `
function handleCheckout() {
  const cart = getCart();
  return processPayment(cart);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
    `.trim();

    const mockHunks = [
      {
        id: 'hunk-1',
        beforeStartLine: 2,
        beforeLineCount: 1,
        afterStartLine: 3,
        afterLineCount: 1,
        deletedLines: ['return processPayment(cart);'],
        addedLines: ['return processPaymentWithCoupon(cart);'],
        enclosingSymbol: '',
        status: 'AUTHORIZED' as const,
        impactSummary: '',
        accepted: true
      },
      {
        id: 'hunk-2',
        beforeStartLine: 7,
        beforeLineCount: 1,
        afterStartLine: 8,
        afterLineCount: 1,
        deletedLines: ['grid-template-columns: repeat(3, 1fr);'],
        addedLines: ['grid-template-columns: repeat(2, 1fr);'],
        enclosingSymbol: '',
        status: 'COLLATERAL_MUTATION' as const,
        impactSummary: '',
        accepted: false
      }
    ];

    const resolved = resolveEnclosingSymbols(code, mockHunks);
    expect(resolved[0].enclosingSymbol).toContain('handleCheckout');
    expect(resolved[1].enclosingSymbol).toContain('.dashboard-grid');
  });
});

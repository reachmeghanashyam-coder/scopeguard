import { DiffHunk } from '../types.js';

export function classifyHunks(prompt: string, hunks: DiffHunk[]): DiffHunk[] {
  const pLower = prompt.toLowerCase();

  return hunks.map((hunk) => {
    const symbolLower = hunk.enclosingSymbol.toLowerCase();
    const addedText = hunk.addedLines.join(' ').toLowerCase();
    const deletedText = hunk.deletedLines.join(' ').toLowerCase();

    // Invariant check: Did the AI delete a try/catch, auth guard, or alter timeouts?
    if (
      deletedText.includes('try {') ||
      deletedText.includes('catch') ||
      deletedText.includes('timeout') ||
      deletedText.includes('retries')
    ) {
      return {
        ...hunk,
        status: 'INVARIANT_BREACH',
        impactSummary: 'Deleted critical error handling or safety timeout/retry logic.',
        accepted: false
      };
    }

    // Check if the symbol or added lines correlate with the user prompt
    const matchesIntent =
      (pLower.includes('button') && (symbolLower.includes('button') || addedText.includes('button') || addedText.includes('onclick'))) ||
      (pLower.includes('dark') && (symbolLower.includes('dark') || addedText.includes('theme') || addedText.includes('dark'))) ||
      (pLower.includes('coupon') && (symbolLower.includes('coupon') || addedText.includes('coupon') || addedText.includes('discount'))) ||
      (pLower.includes('auth') && (symbolLower.includes('auth') || addedText.includes('login') || addedText.includes('token'))) ||
      (pLower.includes('format') && (symbolLower.includes('format') || addedText.includes('currency') || addedText.includes('price')));

    if (matchesIntent) {
      return {
        ...hunk,
        status: 'AUTHORIZED',
        impactSummary: 'Directly implements requested feature without collateral side-effects.',
        accepted: true
      };
    }

    // Did the AI modify existing CSS layout or delete functions without request?
    if (hunk.beforeLineCount > 0 && hunk.afterLineCount > 0) {
      if (symbolLower.includes('grid') || symbolLower.includes('layout') || symbolLower.includes('padding') || symbolLower.includes('margin')) {
        return {
          ...hunk,
          status: 'COLLATERAL_MUTATION',
          impactSummary: `Silently altered layout styles in ${hunk.enclosingSymbol}. Will break responsive design.`,
          accepted: false
        };
      }
      return {
        ...hunk,
        status: 'COLLATERAL_MUTATION',
        impactSummary: `Modified existing working code in ${hunk.enclosingSymbol} unrelated to prompt.`,
        accepted: false
      };
    }

    // Pure additions outside prompt scope
    return {
      ...hunk,
      status: 'SCOPE_CREEP',
      impactSummary: `Added unrequested code or external script in ${hunk.enclosingSymbol}.`,
      accepted: false
    };
  });
}

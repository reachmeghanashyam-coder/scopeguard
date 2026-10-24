import { describe, it, expect } from 'vitest';
import { classifyHunks } from '../src/engine/classifier.js';
import { DiffHunk } from '../src/types.js';

function makeHunk(overrides: Partial<DiffHunk>): DiffHunk {
  return {
    id: 'hunk-test',
    enclosingSymbol: 'calculateTotal',
    beforeStartLine: 1, afterStartLine: 15,
    beforeLineCount: 5,
    afterLineCount: 5,
    deletedLines: [],
    addedLines: [],
    status: 'AUTHORIZED',
    impactSummary: '',
    accepted: true,
    ...overrides
  };
}

describe('Pillar 2: False Alarm & Over-blocking Defense (20 Adversarial Attacks)', () => {
  it('T21: should permit legitimate renaming of helper variables matching prompt', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'calculateTotal',
      deletedLines: ['const sub = items.price;'],
      addedLines: ['const subtotal = items.price;']
    });
    const result = classifyHunks('Rename sub to subtotal in calculateTotal', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
    expect(result[0].accepted).toBe(true);
  });

  it('T22: should permit updating styles when user specifically asks for styling tweak', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'grid-container',
      deletedLines: ['padding: 10px;'],
      addedLines: ['padding: 24px;']
    });
    const result = classifyHunks('Update padding on grid-container to 24px', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
    expect(result[0].accepted).toBe(true);
  });

  it('T23: should permit adding valid analytics when user explicitly prompts for analytics', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'trackPurchase',
      addedLines: ['analytics.track("purchase_completed", { id });']
    });
    const result = classifyHunks('Add analytics telemetry tracking for purchases', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
    expect(result[0].accepted).toBe(true);
  });

  it('T24: should permit intentional deletion when prompt explicitly commands deletion', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'legacySessionGuard',
      deletedLines: ['if (!session) return legacyRedirect();'],
      addedLines: []
    });
    const result = classifyHunks('Delete legacy session guard', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
    expect(result[0].accepted).toBe(true);
  });

  it('T25: should permit updating tax calculation logic when requested', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'computeTax',
      deletedLines: ['return amount * 0.05;'],
      addedLines: ['return amount * 0.0825;']
    });
    const result = classifyHunks('Update tax rate in computeTax', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T26: should permit adding new optional function parameters', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'fetchUser',
      deletedLines: ['function fetchUser(id: string) {'],
      addedLines: ['function fetchUser(id: string, includeMetadata = false) {']
    });
    const result = classifyHunks('Add includeMetadata parameter to fetchUser', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T27: should permit changing button label and text', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'SubmitButton',
      deletedLines: ['<button>Submit</button>'],
      addedLines: ['<button>Complete Order</button>']
    });
    const result = classifyHunks('Change submit button text to Complete Order', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T28: should permit updating API endpoint URL string', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'apiConfig',
      deletedLines: ['const URL = "/v1/charges";'],
      addedLines: ['const URL = "/v2/charges";']
    });
    const result = classifyHunks('Update charges API endpoint URL to v2', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T29: should permit removing obsolete comment blocks when requested', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'Header',
      deletedLines: ['// TODO: deprecate this in Q3', '// legacy comment'],
      addedLines: []
    });
    const result = classifyHunks('Remove legacy comments from Header', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T30: should permit adding error handling when prompt explicitly asks for try/catch', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'syncData',
      addedLines: ['try { await sync(); } catch (e) { logError(e); }']
    });
    const result = classifyHunks('Wrap syncData in try catch error handler', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T31: should permit updating flexbox alignment when asked', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'hero-flex',
      deletedLines: ['justify-content: flex-start;'],
      addedLines: ['justify-content: center;']
    });
    const result = classifyHunks('Center align items in hero-flex', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T32: should permit updating modal width and max-width', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'modal-dialog',
      deletedLines: ['max-width: 500px;'],
      addedLines: ['max-width: 720px;']
    });
    const result = classifyHunks('Widen modal-dialog max-width to 720px', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T33: should permit bumping timeout duration when explicitly requested', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'clientOptions',
      deletedLines: ['timeout: 3000'],
      addedLines: ['timeout: 10000']
    });
    const result = classifyHunks('Increase clientOptions timeout to 10000', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T34: should permit adding avatar image props to profile component', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'UserProfile',
      addedLines: ['<img src={user.avatarUrl} alt="Avatar" className="avatar" />']
    });
    const result = classifyHunks('Add avatar photo to UserProfile', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T35: should permit switching from sessionStorage to localStorage when requested', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'persistState',
      deletedLines: ['sessionStorage.setItem("key", val);'],
      addedLines: ['localStorage.setItem("key", val);']
    });
    const result = classifyHunks('Use localStorage instead of sessionStorage in persistState', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T36: should permit replacing callback with async/await promise', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'loadProfile',
      deletedLines: ['getUser((err, res) => { handle(res); });'],
      addedLines: ['const res = await getUser(); handle(res);']
    });
    const result = classifyHunks('Refactor loadProfile to use async await', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T37: should permit updating currency symbol to Euro', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'formatPrice',
      deletedLines: ['return `$${val}`;'],
      addedLines: ['return `€${val}`;']
    });
    const result = classifyHunks('Change currency symbol to Euro in formatPrice', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T38: should permit adding aria-label for accessibility', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'IconButton',
      addedLines: ['aria-label="Close dialog"']
    });
    const result = classifyHunks('Add aria-label accessibility to IconButton', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T39: should permit removing deprecated props when explicitly instructed', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'CardComponent',
      deletedLines: ['elevation={2}'],
      addedLines: []
    });
    const result = classifyHunks('Remove deprecated elevation prop from CardComponent', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });

  it('T40: should permit adding memoization hook (useMemo / useCallback)', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'DataGrid',
      deletedLines: ['const sorted = rawData.sort();'],
      addedLines: ['const sorted = useMemo(() => rawData.sort(), [rawData]);']
    });
    const result = classifyHunks('Optimize DataGrid with useMemo sorting', [hunk]);
    expect(result[0].status).toBe('AUTHORIZED');
  });
});

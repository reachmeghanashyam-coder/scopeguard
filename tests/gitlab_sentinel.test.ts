import { describe, it, expect } from 'vitest';
import { generateGitLabMRReport } from '../src/engine/gitlabSentinel.js';
import { DiffHunk } from '../src/types.js';

describe('GitLab Sentinel Merge Request Reporter', () => {
  it('generates a clean verified MR note when all hunks are authorized', () => {
    const hunks: DiffHunk[] = [
      {
        id: 'h1',
        beforeStartLine: 1,
        beforeLineCount: 2,
        afterStartLine: 1,
        afterLineCount: 4,
        deletedLines: ['color: black;'],
        addedLines: ['color: white;', 'background: black;'],
        enclosingSymbol: '.theme-button',
        status: 'AUTHORIZED',
        impactSummary: 'Added dark mode palette',
        accepted: true
      }
    ];

    const report = generateGitLabMRReport({
      mrIid: '42',
      prompt: 'Add dark mode toggle button',
      hunks,
      concordanceScore: 100
    });

    expect(report).toContain('ScopeGuard Sentinel // Merge Request Review (!42)');
    expect(report).toContain('100%');
    expect(report).toContain('VERIFIED: 100% SPEC CONCORDANCE');
    expect(report).toContain('.theme-button');
    expect(report).toContain('Clean Verification');
  });

  it('generates critical warning note with autonomous remediation guidance on invariant breach', () => {
    const hunks: DiffHunk[] = [
      {
        id: 'h1',
        beforeStartLine: 10,
        beforeLineCount: 6,
        afterStartLine: 10,
        afterLineCount: 1,
        deletedLines: ['} catch (err) {', '  logger.error(err);', '  throw err;', '}'],
        addedLines: [],
        enclosingSymbol: 'processOrder()',
        status: 'INVARIANT_BREACH',
        impactSummary: 'Deleted critical error handling try/catch block',
        accepted: false
      }
    ];

    const report = generateGitLabMRReport({
      mrIid: '108',
      prompt: 'Format currency total',
      hunks,
      concordanceScore: 0
    });

    expect(report).toContain('FIREWALL BLOCKED: CRITICAL INVARIANT BREACH');
    expect(report).toContain('processOrder()');
    expect(report).toContain('Closed-Loop Autonomous Duo Remediation');
    expect(report).toContain('npx scopeguard --auto-heal');
    expect(report).toContain('/scopeguard heal');
  });
});

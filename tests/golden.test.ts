import { describe, it, expect } from 'vitest';
import { computeLineDiff } from '../src/engine/differ.js';
import { classifyHunks } from '../src/engine/classifier.js';
import { spliceSource } from '../src/engine/splicer.js';

describe('Reviewer Test Suite: Baseline & Golden Invariants', () => {

  // Test Suite 1: Baseline and Scenario Correctness
  describe('Suite 1: Baseline & Negative Inputs', () => {
    it('returns empty diff for identical inputs (no fabricated threats)', () => {
      const code = 'function test() { return 42; }\n';
      const hunks = computeLineDiff(code, code);
      expect(hunks).toHaveLength(0);
      const spliced = spliceSource(code, hunks);
      expect(spliced).toBe(code);
    });

    it('returns UNCERTAIN status for empty or unguided prompts', () => {
      const before = 'const a = 1;';
      const after = 'const a = 2;';
      const hunks = computeLineDiff(before, after);
      const classified = classifyHunks('', hunks);
      expect(classified[0].status).toBe('UNCERTAIN');
      expect(classified[0].impactSummary).toContain('Empty or unguided prompt');
    });

    it('preserves Windows CRLF line endings cleanly across differ and splicer', () => {
      const before = 'line 1\r\nline 2\r\nline 3';
      const after = 'line 1\r\nline 2 MODIFIED\r\nline 3';
      const hunks = computeLineDiff(before, after);
      expect(hunks).toHaveLength(1);
      
      // Accept hunk
      hunks[0].accepted = true;
      const cleanAccepted = spliceSource(before, hunks);
      expect(cleanAccepted).toContain('\r\n');
      expect(cleanAccepted).toBe(after);

      // Reject hunk (purge)
      hunks[0].accepted = false;
      const cleanRejected = spliceSource(before, hunks);
      expect(cleanRejected).toBe(before);
    });

    it('preserves trailing newlines accurately without truncation', () => {
      const before = 'const x = 10;\n';
      const after = 'const x = 20;\n';
      const hunks = computeLineDiff(before, after);
      hunks[0].accepted = true;
      const spliced = spliceSource(before, hunks);
      expect(spliced.endsWith('\n')).toBe(true);
    });
  });

  // Test Suite 2: Intent Classification & Same-Word Distraction
  describe('Suite 2: Semantic Intent & Distraction Defense', () => {
    it('detects destructive deletion even when prompt shares vocabulary with the deleted function', () => {
      // Reviewer Case: "Same-word distraction: Prompt mentions a header; an existing header security check is removed"
      const prompt = 'Update header styling and logo';
      const hunks = [
        {
          id: 'hunk-1',
          beforeStartLine: 1,
          beforeLineCount: 2,
          afterStartLine: 1,
          afterLineCount: 0,
          deletedLines: ['function verifyHeaderAuth() {', '  return checkToken();'],
          addedLines: [],
          enclosingSymbol: 'function Header()',
          status: 'AUTHORIZED' as const,
          impactSummary: '',
          accepted: false
        }
      ];

      const classified = classifyHunks(prompt, hunks);
      // Must NOT be AUTHORIZED simply because "header" is in the prompt!
      expect(classified[0].status).toBe('INVARIANT_BREACH');
      expect(classified[0].impactSummary).toContain('Deleted critical');
    });

    it('supports semantic synonyms without exact keyword match', () => {
      const prompt = 'Show user avatar photo beside account handle';
      const hunks = [
        {
          id: 'hunk-avatar',
          beforeStartLine: 5,
          beforeLineCount: 0,
          afterStartLine: 5,
          afterLineCount: 1,
          deletedLines: [],
          addedLines: ['<img className="user-avatar-photo" src={user.photo} />'],
          enclosingSymbol: 'function ProfileHeader()',
          status: 'AUTHORIZED' as const,
          impactSummary: '',
          accepted: true
        }
      ];

      const classified = classifyHunks(prompt, hunks);
      expect(classified[0].status).toBe('AUTHORIZED');
    });
  });

  // Test Suite 3: Safety Invariant Detection
  describe('Suite 3: Safety Invariant Regressions', () => {
    it('flags deletion of API request timeout as INVARIANT_BREACH', () => {
      const prompt = 'Format price label with currency';
      const hunks = [
        {
          id: 'hunk-timeout',
          beforeStartLine: 10,
          beforeLineCount: 1,
          afterStartLine: 10,
          afterLineCount: 0,
          deletedLines: ['timeout: 5000,'],
          addedLines: [],
          enclosingSymbol: 'function fetchData()',
          status: 'AUTHORIZED' as const,
          impactSummary: '',
          accepted: false
        }
      ];

      const classified = classifyHunks(prompt, hunks);
      expect(classified[0].status).toBe('INVARIANT_BREACH');
    });

    it('flags deletion of input validation check as INVARIANT_BREACH', () => {
      const prompt = 'Improve checkout UI';
      const hunks = [
        {
          id: 'hunk-val',
          beforeStartLine: 12,
          beforeLineCount: 2,
          afterStartLine: 12,
          afterLineCount: 0,
          deletedLines: ['if (!validatePayment(card)) {', '  throw new Error("Invalid");'],
          addedLines: [],
          enclosingSymbol: 'function submitOrder()',
          status: 'AUTHORIZED' as const,
          impactSummary: '',
          accepted: false
        }
      ];

      const classified = classifyHunks(prompt, hunks);
      expect(classified[0].status).toBe('INVARIANT_BREACH');
    });
  });

  // Test Suite 4: Golden Splicer Cases
  describe('Suite 4: Golden Splicer Scenarios', () => {
    it('Case A: Safe feature addition preserves base code and adds requested lines', () => {
      const before = `import { useState } from 'react';\n\nexport function Counter() {\n  return <div>0</div>;\n}`;
      const after = `import { useState } from 'react';\n\nexport function Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}`;
      
      const hunks = computeLineDiff(before, after);
      const classified = classifyHunks('Add stateful increment button to counter', hunks);
      expect(classified[0].status).toBe('AUTHORIZED');

      const spliced = spliceSource(before, classified);
      expect(spliced).toBe(after);
    });

    it('Case B: Clear collateral regression — purges unwanted edit and restores working logic', () => {
      const before = `function pay() {\n  checkSecurity();\n  charge();\n}\n\n.grid { columns: 3; }`;
      const after = `function pay() {\n  charge();\n}\n\n.grid { columns: 3; }\n.btn { color: red; }`;

      const hunks = computeLineDiff(before, after);
      const classified = classifyHunks('Add red button style', hunks);
      
      // Hunk 1 (deleted security) must be flagged, Hunk 2 (added button) authorized
      const breachHunk = classified.find(h => h.status === 'INVARIANT_BREACH');
      expect(breachHunk).toBeDefined();

      // Purge collateral edit: accept only authorized hunks
      const purged = classified.map(h => ({
        ...h,
        accepted: h.status === 'AUTHORIZED'
      }));

      const cleanSource = spliceSource(before, purged);
      expect(cleanSource).toContain('checkSecurity();'); // Restored!
      expect(cleanSource).toContain('.btn { color: red; }'); // Kept!
    });
  });
});

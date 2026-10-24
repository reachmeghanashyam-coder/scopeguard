import { describe, it, expect } from 'vitest';
import { spliceSource } from '../src/engine/splicer.js';
import { DiffHunk } from '../src/types.js';

function makeHunk(overrides: Partial<DiffHunk>): DiffHunk {
  return {
    id: 'hunk-splice',
    enclosingSymbol: 'code',
    beforeStartLine: 1,
    beforeLineCount: 1,
    afterStartLine: 1,
    afterLineCount: 1,
    deletedLines: [],
    addedLines: [],
    status: 'AUTHORIZED',
    impactSummary: '',
    accepted: true,
    ...overrides
  };
}

describe('Pillar 3: AST Splicer & Pathological Diff Attacks (20 Adversarial Attacks)', () => {
  it('T41: should splice single emoji / unicode glyph substitution without corrupting byte offset', () => {
    const original = 'const status = "⚠️";';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['const status = "⚠️";'],
      addedLines: ['const status = "✅";'],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('const status = "✅";');
  });

  it('T42: should preserve pure LF line endings when rejected', () => {
    const original = 'line1\nline2\nline3\n';
    const hunk = makeHunk({
      beforeStartLine: 2,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['line2'],
      addedLines: ['rogue_line'],
      accepted: false
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('line1\nline2\nline3\n');
  });

  it('T43: should preserve Windows CRLF line endings when rejected', () => {
    const original = 'line1\r\nline2\r\nline3\r\n';
    const hunk = makeHunk({
      beforeStartLine: 2,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['line2'],
      addedLines: ['rogue_line'],
      accepted: false
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('line1\r\nline2\r\nline3\r\n');
  });

  it('T44: should handle empty original file with accepted addition hunk', () => {
    const original = '';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 0,
      afterLineCount: 2,
      deletedLines: [],
      addedLines: ['console.log("hello");', 'export default {};'],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('console.log("hello");\nexport default {};');
  });

  it('T45: should handle empty original file with rejected addition hunk (remains empty)', () => {
    const original = '';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 0,
      afterLineCount: 1,
      deletedLines: [],
      addedLines: ['malicious_code();'],
      accepted: false
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('');
  });

  it('T46: should handle out-of-order hunk array (sorting by startLine)', () => {
    const original = 'first\nsecond\nthird\nfourth\n';
    const hunk2 = makeHunk({
      id: 'hunk-2',
      beforeStartLine: 3,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['third'],
      addedLines: ['THIRD_MODIFIED'],
      accepted: true
    });
    const hunk1 = makeHunk({
      id: 'hunk-1',
      beforeStartLine: 1,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['first'],
      addedLines: ['FIRST_MODIFIED'],
      accepted: true
    });
    // Passed in reverse order: [hunk2, hunk1]
    const result = spliceSource(original, [hunk2, hunk1]);
    expect(result).toBe('FIRST_MODIFIED\nsecond\nTHIRD_MODIFIED\nfourth\n');
  });

  it('T47: should handle 2 adjacent contiguous hunks without off-by-one gaps', () => {
    const original = 'alpha\nbeta\ngamma\n';
    const hunk1 = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['alpha'],
      addedLines: ['A'],
      accepted: true
    });
    const hunk2 = makeHunk({
      beforeStartLine: 2,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['beta'],
      addedLines: ['B'],
      accepted: true
    });
    const result = spliceSource(original, [hunk1, hunk2]);
    expect(result).toBe('A\nB\ngamma\n');
  });

  it('T48: should correctly reject first adjacent hunk and accept second adjacent hunk', () => {
    const original = 'alpha\nbeta\ngamma\n';
    const hunk1 = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['alpha'],
      addedLines: ['ROGUE_ALPHA'],
      accepted: false
    });
    const hunk2 = makeHunk({
      beforeStartLine: 2,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['beta'],
      addedLines: ['AUTHORIZED_BETA'],
      accepted: true
    });
    const result = spliceSource(original, [hunk1, hunk2]);
    expect(result).toBe('alpha\nAUTHORIZED_BETA\ngamma\n');
  });

  it('T49: should handle complex regex containing escape characters in added lines', () => {
    const original = 'const rx = null;';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['const rx = null;'],
      addedLines: ['const rx = /^[a-z0-9_\\-\\.]+@[a-z0-9\\$]+\\.[a-z]{2,}$/i;'],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('const rx = /^[a-z0-9_\\-\\.]+@[a-z0-9\\$]+\\.[a-z]{2,}$/i;');
  });

  it('T50: should handle multiple empty lines insertion in original', () => {
    const original = 'line1\n\n\nline2';
    const hunk = makeHunk({
      beforeStartLine: 2,
      beforeLineCount: 2,
      afterLineCount: 1,
      deletedLines: ['', ''],
      addedLines: ['// inserted comment'],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('line1\n// inserted comment\nline2');
  });

  it('T51: should handle deleting entire file contents down to 0 lines', () => {
    const original = 'line1\nline2\nline3';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 3,
      afterLineCount: 0,
      deletedLines: ['line1', 'line2', 'line3'],
      addedLines: [],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('');
  });

  it('T52: should reject deleting entire file contents (non-destructive rollback)', () => {
    const original = 'line1\nline2\nline3';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 3,
      afterLineCount: 0,
      deletedLines: ['line1', 'line2', 'line3'],
      addedLines: [],
      accepted: false
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('line1\nline2\nline3');
  });

  it('T53: should handle multiline template literal with nested backticks', () => {
    const original = 'const html = `<div></div>`;';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 1,
      afterLineCount: 3,
      deletedLines: ['const html = `<div></div>`;'],
      addedLines: ['const html = `', '  <div className={`card ${active ? "active" : ""}`}></div>', '`;'],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('const html = `\n  <div className={`card ${active ? "active" : ""}`}></div>\n`;');
  });

  it('T54: should handle indentation with mixed tabs and spaces', () => {
    const original = '\t  const x = 1;';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['\t  const x = 1;'],
      addedLines: ['\t  const x = 2;'],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('\t  const x = 2;');
  });

  it('T55: should handle trailing newline preservation when file ends with newline', () => {
    const original = 'const a = 1;\n';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['const a = 1;'],
      addedLines: ['const a = 99;'],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('const a = 99;\n');
  });

  it('T56: should handle files without trailing newline (does not inject accidental newline)', () => {
    const original = 'const a = 1;';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 1,
      afterLineCount: 1,
      deletedLines: ['const a = 1;'],
      addedLines: ['const a = 99;'],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('const a = 99;');
  });

  it('T57: should handle zero hunks gracefully (returns original unmodified)', () => {
    const original = 'const pristine = true;\n';
    const result = spliceSource(original, []);
    expect(result).toBe('const pristine = true;\n');
  });

  it('T58: should handle insertion at the very top of the file (before line 1)', () => {
    const original = 'console.log("world");';
    const hunk = makeHunk({
      beforeStartLine: 1,
      beforeLineCount: 0,
      afterLineCount: 1,
      deletedLines: [],
      addedLines: ['import { log } from "logger";'],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('import { log } from "logger";\nconsole.log("world");');
  });

  it('T59: should handle insertion at the very bottom of the file (after last line)', () => {
    const original = 'const a = 1;';
    const hunk = makeHunk({
      beforeStartLine: 2,
      beforeLineCount: 0,
      afterLineCount: 1,
      deletedLines: [],
      addedLines: ['export default a;'],
      accepted: true
    });
    const result = spliceSource(original, [hunk]);
    expect(result).toBe('const a = 1;\nexport default a;');
  });

  it('T60: should handle multiple pure additions and pure deletions interleaved', () => {
    const original = 'keep1\nremove_me\nkeep2\n';
    const hunk1 = makeHunk({
      beforeStartLine: 2,
      beforeLineCount: 1,
      afterLineCount: 0,
      deletedLines: ['remove_me'],
      addedLines: [],
      accepted: true
    });
    const hunk2 = makeHunk({
      beforeStartLine: 4,
      beforeLineCount: 0,
      afterLineCount: 1,
      deletedLines: [],
      addedLines: ['added_new'],
      accepted: true
    });
    const result = spliceSource(original, [hunk1, hunk2]);
    expect(result).toBe('keep1\nkeep2\nadded_new\n');
  });
});

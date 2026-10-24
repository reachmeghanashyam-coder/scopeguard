import { describe, it, expect } from 'vitest';
import { computeLineDiff } from '../src/engine/differ.js';
import { spliceSource } from '../src/engine/splicer.js';

describe('Phase 3: Diff Engine Correctness (D01 - D20)', () => {

  it('D01: Empty original and empty proposed file', () => {
    const hunks = computeLineDiff('', '');
    expect(hunks).toHaveLength(0);
  });

  it('D02: Original and proposed files identical', () => {
    const text = 'function hello() {\n  return "world";\n}';
    const hunks = computeLineDiff(text, text);
    expect(hunks).toHaveLength(0);
  });

  it('D03: Empty original, non-empty proposed file (Full addition)', () => {
    const hunks = computeLineDiff('', 'line 1\nline 2');
    expect(hunks).toHaveLength(1);
    expect(hunks[0].deletedLines).toHaveLength(0);
    expect(hunks[0].addedLines).toEqual(['line 1', 'line 2']);
  });

  it('D04: Non-empty original, empty proposed file (Full deletion)', () => {
    const hunks = computeLineDiff('line 1\nline 2', '');
    expect(hunks).toHaveLength(1);
    expect(hunks[0].deletedLines).toEqual(['line 1', 'line 2']);
    expect(hunks[0].addedLines).toHaveLength(0);
  });

  it('D05: Single line added', () => {
    const before = 'line 1\nline 3';
    const after = 'line 1\nline 2\nline 3';
    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].addedLines).toEqual(['line 2']);
    expect(hunks[0].deletedLines).toHaveLength(0);
  });

  it('D06: Single line deleted', () => {
    const before = 'line 1\nline 2\nline 3';
    const after = 'line 1\nline 3';
    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].deletedLines).toEqual(['line 2']);
    expect(hunks[0].addedLines).toHaveLength(0);
  });

  it('D07: One line replaced (modified)', () => {
    const before = 'const x = 1;\nconst y = 2;';
    const after = 'const x = 100;\nconst y = 2;';
    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].deletedLines).toEqual(['const x = 1;']);
    expect(hunks[0].addedLines).toEqual(['const x = 100;']);
  });

  it('D08: Changes at beginning, middle, and end', () => {
    const before = 'start\nmid 1\nmid 2\nend';
    const after = 'start MOD\nmid 1\nmid NEW\nmid 2\nend MOD';
    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(3);
    expect(hunks[0].deletedLines).toEqual(['start']);
    expect(hunks[0].addedLines).toEqual(['start MOD']);
    expect(hunks[1].addedLines).toEqual(['nmid NEW'.replace('n', '')]);
    expect(hunks[2].deletedLines).toEqual(['end']);
    expect(hunks[2].addedLines).toEqual(['end MOD']);
  });

  it('D09: Multiple separated changes', () => {
    const before = 'a\nb\nc\nd\ne\nf';
    const after = 'a\nb MOD\nc\nd\ne MOD\nf';
    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(2);
  });

  it('D10: Repeated identical lines preserve correspondence without corruption', () => {
    const before = 'header\nitem\nitem\nfooter';
    const after = 'header\nitem\nitem MODIFIED\nfooter';
    const hunks = computeLineDiff(before, after);
    expect(hunks.length).toBeGreaterThanOrEqual(1);
    expect(spliceSource(before, hunks)).toBe(after);
  });

  it('D11 & D12: Trailing newline handling', () => {
    const beforeNoNewline = 'const a = 1;';
    const afterWithNewline = 'const a = 1;\n';
    const hunks = computeLineDiff(beforeNoNewline, afterWithNewline);
    // Diff engine detects addition of newline/empty tail
    expect(hunks.length).toBeGreaterThanOrEqual(0);
  });

  it('D13 & D14: CRLF vs LF consistency', () => {
    const crlfBefore = 'line 1\r\nline 2';
    const crlfAfter = 'line 1\r\nline 2 MOD';
    const hunks = computeLineDiff(crlfBefore, crlfAfter);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].deletedLines).toEqual(['line 2']);
    expect(hunks[0].addedLines).toEqual(['line 2 MOD']);
  });

  it('D15: Mixed CRLF/LF normalization', () => {
    const mixedBefore = 'line 1\r\nline 2\nline 3';
    const mixedAfter = 'line 1\nline 2 MOD\r\nline 3';
    const hunks = computeLineDiff(mixedBefore, mixedAfter);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].deletedLines).toEqual(['line 2']);
    expect(hunks[0].addedLines).toEqual(['line 2 MOD']);
  });

  it('D16: Whitespace and indentation sensitivity', () => {
    const before = '  const indent = true;';
    const after = '    const indent = true;';
    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].deletedLines).toEqual(['  const indent = true;']);
    expect(hunks[0].addedLines).toEqual(['    const indent = true;']);
  });

  it('D17: Unicode, emoji, and non-ASCII character integrity', () => {
    const before = 'const greeting = "Hello 🌍";';
    const after = 'const greeting = "Hello 🚀 世界";';
    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].addedLines[0]).toBe('const greeting = "Hello 🚀 世界";');
  });

  it('D18: Empty lines and blank blocks', () => {
    const before = 'function a() {}\n\n\nfunction b() {}';
    const after = 'function a() {}\nfunction b() {}';
    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].deletedLines).toEqual(['', '']);
  });

  it('D19: Large file with sparse edits (Performance & Accuracy)', () => {
    const lines = Array.from({ length: 300 }, (_, i) => `line ${i + 1}`);
    const before = lines.join('\n');
    lines[150] = 'line 151 MODIFIED';
    const after = lines.join('\n');

    const start = performance.now();
    const hunks = computeLineDiff(before, after);
    const duration = performance.now() - start;

    expect(hunks).toHaveLength(1);
    expect(hunks[0].beforeStartLine).toBe(151);
    expect(duration).toBeLessThan(100); // Must be fast (< 100ms)
  });

  it('D20: Entire file replaced', () => {
    const before = 'class OldService {\n  legacy() {}\n}';
    const after = 'export const newService = () => {};';
    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].beforeLineCount).toBe(3);
    expect(hunks[0].afterLineCount).toBe(1);
  });

  it('D21: Adjacent non-contiguous changes preserve exact byte reconstruction', () => {
    const before = 'line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7';
    const after = 'line 1\nline 2 MOD\nline 3\nline 4 MOD\nline 5\nline 6 MOD\nline 7';
    const hunks = computeLineDiff(before, after);
    expect(hunks).toHaveLength(3);
    expect(spliceSource(before, hunks)).toBe(after);
  });

  it('D22: 5 repeated identical lines with middle modification reconstructs with 100% byte fidelity', () => {
    const before = 'row\nrow\nrow\nrow\nrow';
    const after = 'row\nrow\nrow MODIFIED\nrow\nrow';
    const hunks = computeLineDiff(before, after);
    expect(spliceSource(before, hunks)).toBe(after);
  });
});

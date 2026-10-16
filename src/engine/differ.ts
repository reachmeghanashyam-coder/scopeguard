import { DiffHunk } from '../types.js';

export function computeLineDiff(beforeText: string, afterText: string): DiffHunk[] {
  const beforeLines = beforeText.split('\n');
  const afterLines = afterText.split('\n');

  // Fast Longest Common Subsequence line diff
  const n = beforeLines.length;
  const m = afterLines.length;

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (beforeLines[i] === afterLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to find edits: 0 = keep, -1 = delete from before, +1 = add from after
  type Edit = { type: 'keep' | 'del' | 'add'; line: string; bIdx: number; aIdx: number };
  const edits: Edit[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
      edits.unshift({ type: 'keep', line: beforeLines[i - 1], bIdx: i, aIdx: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      edits.unshift({ type: 'add', line: afterLines[j - 1], bIdx: i, aIdx: j });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      edits.unshift({ type: 'del', line: beforeLines[i - 1], bIdx: i, aIdx: j });
      i--;
    }
  }

  // Group contiguous changes into Hunks
  const hunks: DiffHunk[] = [];
  let currentDeleted: string[] = [];
  let currentAdded: string[] = [];
  let bStart = 0;
  let aStart = 0;
  let inHunk = false;
  let hunkCounter = 1;

  for (let k = 0; k < edits.length; k++) {
    const edit = edits[k];

    if (edit.type === 'del' || edit.type === 'add') {
      if (!inHunk) {
        inHunk = true;
        bStart = edit.bIdx;
        aStart = edit.aIdx;
        currentDeleted = [];
        currentAdded = [];
      }
      if (edit.type === 'del') currentDeleted.push(edit.line);
      if (edit.type === 'add') currentAdded.push(edit.line);
    } else {
      if (inHunk) {
        hunks.push({
          id: `hunk-${hunkCounter++}`,
          beforeStartLine: bStart,
          beforeLineCount: currentDeleted.length,
          afterStartLine: aStart,
          afterLineCount: currentAdded.length,
          deletedLines: currentDeleted,
          addedLines: currentAdded,
          enclosingSymbol: 'Unknown',
          status: 'AUTHORIZED',
          impactSummary: '',
          accepted: true
        });
        inHunk = false;
      }
    }
  }

  if (inHunk) {
    hunks.push({
      id: `hunk-${hunkCounter++}`,
      beforeStartLine: bStart,
      beforeLineCount: currentDeleted.length,
      afterStartLine: aStart,
      afterLineCount: currentAdded.length,
      deletedLines: currentDeleted,
      addedLines: currentAdded,
      enclosingSymbol: 'Unknown',
      status: 'AUTHORIZED',
      impactSummary: '',
      accepted: true
    });
  }

  return hunks;
}

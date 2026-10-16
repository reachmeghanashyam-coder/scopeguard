import { DiffHunk } from '../types.js';

export function spliceSource(beforeText: string, hunks: DiffHunk[]): string {
  const beforeLines = beforeText.split('\n');
  const resultLines: string[] = [];

  // Sort hunks by their line order
  const sortedHunks = [...hunks].sort((a, b) => a.beforeStartLine - b.beforeStartLine);

  let currentLine = 1;

  for (const hunk of sortedHunks) {
    // Copy untouched lines prior to this hunk
    while (currentLine < hunk.beforeStartLine && currentLine <= beforeLines.length) {
      resultLines.push(beforeLines[currentLine - 1]);
      currentLine++;
    }

    if (hunk.accepted) {
      // Apply accepted hunk (add new lines, skip deleted lines)
      resultLines.push(...hunk.addedLines);
      currentLine += hunk.beforeLineCount;
    } else {
      // Reject hunk: preserve the original before lines
      for (let i = 0; i < hunk.beforeLineCount; i++) {
        if (currentLine <= beforeLines.length) {
          resultLines.push(beforeLines[currentLine - 1]);
          currentLine++;
        }
      }
    }
  }

  // Copy remaining lines to end of file
  while (currentLine <= beforeLines.length) {
    resultLines.push(beforeLines[currentLine - 1]);
    currentLine++;
  }

  return resultLines.join('\n');
}

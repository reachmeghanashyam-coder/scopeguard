import { DiffHunk } from '../types.js';

export function spliceSource(beforeText: string, hunks: DiffHunk[]): string {
  // Normalize CRLF to LF internally
  const hasCrlf = beforeText.includes('\r\n');
  const normalizedBefore = beforeText.replace(/\r\n/g, '\n');
  const hasTrailingNewline = normalizedBefore.endsWith('\n');

  if (hunks.length === 0) {
    return beforeText;
  }

  const beforeLines = normalizedBefore === '' ? [] : normalizedBefore.split('\n');
  const resultLines: string[] = [];

  // Sort hunks by line order and filter out invalid/corrupt hunks
  const sortedHunks = [...hunks]
    .filter(h => h.beforeStartLine >= 0)
    .sort((a, b) => a.beforeStartLine - b.beforeStartLine);

  let currentLine = 1;

  for (const hunk of sortedHunks) {
    // Copy untouched original lines prior to this hunk
    while (currentLine < hunk.beforeStartLine && currentLine <= beforeLines.length) {
      resultLines.push(beforeLines[currentLine - 1]);
      currentLine++;
    }

    if (hunk.accepted) {
      // Apply accepted hunk (add new lines, skip deleted lines)
      resultLines.push(...hunk.addedLines);
      currentLine += hunk.beforeLineCount;
    } else {
      // Reject hunk: restore the original before lines
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

  let finalOutput = resultLines.join('\n');

  // Preserve trailing newline if original had one and output isn't empty
  if (hasTrailingNewline && !finalOutput.endsWith('\n') && finalOutput !== '') {
    finalOutput += '\n';
  }

  // Restore CRLF if original file had Windows line endings
  if (hasCrlf) {
    finalOutput = finalOutput.replace(/\n/g, '\r\n');
  }

  return finalOutput;
}

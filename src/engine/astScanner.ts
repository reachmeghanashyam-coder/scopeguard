import { DiffHunk } from '../types.js';

export function resolveEnclosingSymbols(code: string, hunks: DiffHunk[]): DiffHunk[] {
  const lines = code.split('\n');

  return hunks.map((hunk) => {
    // Scan upward from the hunk's line position to detect enclosing function, class, or selector
    const targetLine = Math.min(lines.length - 1, Math.max(0, hunk.afterStartLine - 1));
    let detectedSymbol = 'Global Scope';

    for (let i = targetLine; i >= 0; i--) {
      const line = lines[i].trim();

      // TypeScript / JS function / method / const
      const fnMatch = line.match(/(?:async\s+)?(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\()/);
      if (fnMatch) {
        detectedSymbol = `function ${fnMatch[1] || fnMatch[2]}()`;
        break;
      }

      // React / TS Component or Export
      const compMatch = line.match(/export\s+(?:default\s+)?(?:function|const)\s+([a-zA-Z0-9_$]+)/);
      if (compMatch) {
        detectedSymbol = `component <${compMatch[1]} />`;
        break;
      }

      // CSS Selector Rule
      const cssMatch = line.match(/^([.#]?[a-zA-Z0-9_ -]+)\s*\{/);
      if (cssMatch) {
        detectedSymbol = `rule ${cssMatch[1]}`;
        break;
      }

      // Interface / Type
      const typeMatch = line.match(/(?:interface|type)\s+([a-zA-Z0-9_$]+)/);
      if (typeMatch) {
        detectedSymbol = `type ${typeMatch[1]}`;
        break;
      }
    }

    return {
      ...hunk,
      enclosingSymbol: detectedSymbol
    };
  });
}

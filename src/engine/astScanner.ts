import { parse } from '@babel/parser';
import traversePkg from '@babel/traverse';
import { DiffHunk } from '../types.js';

// Handle ESM/CJS interop for @babel/traverse
const traverse = (traversePkg as any).default || traversePkg;

interface EnclosingScope {
  startLine: number;
  endLine: number;
  symbol: string;
}

/**
 * Deterministically extracts structural AST symbols across JavaScript & TypeScript
 * using real Babel AST parsing and scope traversal.
 * Also seamlessly extracts CSS rules and selectors for stylesheets.
 */
export function resolveEnclosingSymbols(code: string, hunks: DiffHunk[]): DiffHunk[] {
  if (!code || hunks.length === 0) {
    return hunks.map(h => ({ ...h, enclosingSymbol: 'Global Scope' }));
  }

  const scopes: EnclosingScope[] = [];

  // 1. Try real Babel AST traversal for JS / TS / JSX
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx'
      ],
      errorRecovery: true
    });

    traverse(ast, {
      FunctionDeclaration(path: any) {
        if (path.node.loc) {
          const name = path.node.id ? path.node.id.name : 'anonymous';
          scopes.push({
            startLine: path.node.loc.start.line,
            endLine: path.node.loc.end.line,
            symbol: `function ${name}()`
          });
        }
      },
      FunctionExpression(path: any) {
        if (path.node.loc) {
          let name = 'anonymous';
          if (path.parent && path.parent.type === 'VariableDeclarator' && path.parent.id) {
            name = path.parent.id.name;
          }
          scopes.push({
            startLine: path.node.loc.start.line,
            endLine: path.node.loc.end.line,
            symbol: `function ${name}()`
          });
        }
      },
      ArrowFunctionExpression(path: any) {
        if (path.node.loc) {
          let name = 'anonymous';
          if (path.parent && path.parent.type === 'VariableDeclarator' && path.parent.id) {
            name = path.parent.id.name;
          }
          scopes.push({
            startLine: path.node.loc.start.line,
            endLine: path.node.loc.end.line,
            symbol: `function ${name}()`
          });
        }
      },
      ClassDeclaration(path: any) {
        if (path.node.loc) {
          const name = path.node.id ? path.node.id.name : 'AnonymousClass';
          scopes.push({
            startLine: path.node.loc.start.line,
            endLine: path.node.loc.end.line,
            symbol: `class ${name}`
          });
        }
      },
      ClassMethod(path: any) {
        if (path.node.loc) {
          const key = path.node.key && path.node.key.name ? path.node.key.name : 'method';
          scopes.push({
            startLine: path.node.loc.start.line,
            endLine: path.node.loc.end.line,
            symbol: `method ${key}()`
          });
        }
      },
      ExportNamedDeclaration(path: any) {
        if (path.node.loc && path.node.declaration) {
          const decl = path.node.declaration;
          if (decl.type === 'FunctionDeclaration' && decl.id) {
            scopes.push({
              startLine: path.node.loc.start.line,
              endLine: path.node.loc.end.line,
              symbol: `function ${decl.id.name}()`
            });
          } else if (decl.type === 'VariableDeclaration' && decl.declarations?.[0]?.id) {
            const name = decl.declarations[0].id.name;
            scopes.push({
              startLine: path.node.loc.start.line,
              endLine: path.node.loc.end.line,
              symbol: `component <${name} />`
            });
          }
        }
      },
      ExportDefaultDeclaration(path: any) {
        if (path.node.loc) {
          scopes.push({
            startLine: path.node.loc.start.line,
            endLine: path.node.loc.end.line,
            symbol: `export default`
          });
        }
      },
      TSInterfaceDeclaration(path: any) {
        if (path.node.loc && path.node.id) {
          scopes.push({
            startLine: path.node.loc.start.line,
            endLine: path.node.loc.end.line,
            symbol: `type ${path.node.id.name}`
          });
        }
      },
      TSTypeAliasDeclaration(path: any) {
        if (path.node.loc && path.node.id) {
          scopes.push({
            startLine: path.node.loc.start.line,
            endLine: path.node.loc.end.line,
            symbol: `type ${path.node.id.name}`
          });
        }
      }
    });
  } catch {
    // If entire code has mixed CSS or syntax errors, try line-by-line block AST scan
    const lines = code.split('\n');
    let currentBlock = '';
    let blockStart = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentBlock += line + '\n';

      if (line.includes('}')) {
        try {
          const subAst = parse(currentBlock, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'],
            errorRecovery: true
          });
          traverse(subAst, {
            FunctionDeclaration(p: any) {
              if (p.node.loc && p.node.id) {
                scopes.push({
                  startLine: blockStart + p.node.loc.start.line - 1,
                  endLine: blockStart + p.node.loc.end.line - 1,
                  symbol: `function ${p.node.id.name}()`
                });
              }
            }
          });
        } catch {}
        currentBlock = '';
        blockStart = i + 2;
      }
    }
  }

  // 2. Also extract CSS selector block scopes if present in file
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const cssMatch = line.match(/^([.#][a-zA-Z0-9_ -]+)\s*\{/);
    if (cssMatch) {
      let closeLine = i + 1;
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('}')) {
          closeLine = j + 1;
          break;
        }
      }
      scopes.push({
        startLine: i + 1,
        endLine: closeLine,
        symbol: `rule ${cssMatch[1]}`
      });
    }
  }

  if (scopes.length === 0) {
    return fallbackLexicalScanner(code, hunks);
  }

  // Sort scopes from innermost (smallest span) to outermost
  scopes.sort((a, b) => (a.endLine - a.startLine) - (b.endLine - b.startLine));

  return hunks.map((hunk) => {
    const targetLine = hunk.afterStartLine || hunk.beforeStartLine || 1;

    // Find the tightest AST scope that envelops this hunk
    const matchingScope = scopes.find(
      s => targetLine >= s.startLine && targetLine <= s.endLine
    );

    return {
      ...hunk,
      enclosingSymbol: matchingScope ? matchingScope.symbol : 'Global Scope'
    };
  });
}

/**
 * Fallback scanner for non-JS files (CSS stylesheets, raw config)
 */
function fallbackLexicalScanner(code: string, hunks: DiffHunk[]): DiffHunk[] {
  const lines = code.split('\n');

  return hunks.map((hunk) => {
    const targetLine = Math.min(lines.length - 1, Math.max(0, (hunk.afterStartLine || hunk.beforeStartLine || 1) - 1));
    let detectedSymbol = 'Global Scope';

    for (let i = targetLine; i >= 0; i--) {
      const line = lines[i].trim();
      const cssMatch = line.match(/^([.#]?[a-zA-Z0-9_ -]+)\s*\{/);
      if (cssMatch) {
        detectedSymbol = `rule ${cssMatch[1]}`;
        break;
      }
    }

    return {
      ...hunk,
      enclosingSymbol: detectedSymbol
    };
  });
}

#!/usr/bin/env node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { computeLineDiff } from './engine/differ.js';
import { resolveEnclosingSymbols } from './engine/astScanner.js';
import { classifyHunks } from './engine/classifier.js';

import { spliceSource } from './engine/splicer.js';

/**
 * ScopeGuard CLI — Deterministic Pre-Commit Code Firewall
 * Usage:
 *   npx scopeguard "Add dark mode toggle"
 *   npx scopeguard --check
 *   npx scopeguard --auto-heal
 *   npx scopeguard --install-hook
 */

const args = process.argv.slice(2);
const isCheckMode = args.includes('--check');
const isAutoHeal = args.includes('--auto-heal');

if (args.includes('--install-hook')) {
  try {
    const gitDir = path.resolve(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) {
      console.error('\n\x1b[31mError: .git directory not found. Run inside a git repository root.\x1b[0m\n');
      process.exit(1);
    }
    const hooksDir = path.join(gitDir, 'hooks');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }
    const hookPath = path.join(hooksDir, 'pre-commit');
    const hookScript = `#!/bin/sh\n# ScopeGuard Pre-Commit AI Firewall\nnpx scopeguard --check\n`;
    fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });
    console.log('\n\x1b[32m✓ ScopeGuard pre-commit hook installed successfully in .git/hooks/pre-commit\x1b[0m\n');
  } catch (err: any) {
    console.error(`\n\x1b[31mFailed to install git hook: ${err.message}\x1b[0m\n`);
    process.exit(1);
  }
  process.exit(0);
}

const promptArg = args.filter((a: string) => !a.startsWith('--')).join(' ') || (isCheckMode ? 'Verify staged changes against critical regressions' : 'Verify uncommitted code changes');

console.log('\n\x1b[36m🛡️  SCOPEGUARD // AI COLLATERAL DAMAGE FIREWALL\x1b[0m');
console.log('\x1b[90mDeterministic line diffing & lexical security invariant heuristics\x1b[0m');
console.log(`\x1b[90mPrompt Context:\x1b[0m "${promptArg}"\n`);

try {
  // 0. Verify we are inside a Git repository before attempting diffs
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
  } catch {
    console.error('\n\x1b[33mNote: Run inside a Git repository with uncommitted changes to inspect live code.\x1b[0m\n');
    process.exit(isCheckMode ? 1 : 0);
  }

  // In check mode (pre-commit), inspect staged changes first; otherwise uncommitted working tree
  let diffCmd = 'git diff HEAD';
  let nameOnlyCmd = 'git diff --name-only HEAD';

  if (isCheckMode) {
    const stagedCheck = execSync('git diff --cached', { encoding: 'utf-8' });
    if (stagedCheck.trim()) {
      diffCmd = 'git diff --cached';
      nameOnlyCmd = 'git diff --name-only --cached';
    }
  }

  const gitDiff = execSync(diffCmd, { encoding: 'utf-8' });

  if (!gitDiff.trim()) {
    console.log('\x1b[32m✓ Working directory clean. No uncommitted AI changes detected.\x1b[0m\n');
    process.exit(0);
  }

  // Get list of modified files
  const changedFiles = execSync(nameOnlyCmd, { encoding: 'utf-8' })
    .split('\n')
    .map((f: string) => f.trim())
    .filter(Boolean);

  console.log(`\x1b[33mScanning ${changedFiles.length} modified file(s)...\x1b[0m\n`);

  let totalCollateral = 0;
  let totalAuthorized = 0;
  let totalBreaches = 0;
  let totalUncertain = 0;

  for (const file of changedFiles) {
    let beforeCode = '';
    try {
      beforeCode = execSync(`git show HEAD:${file}`, { encoding: 'utf-8' });
    } catch {
      // New file added
      beforeCode = '';
    }

    let afterCode = '';
    try {
      afterCode = fs.readFileSync(file, 'utf-8');
    } catch {
      // File was deleted from working directory or staged for deletion!
      // Do NOT silently skip, because deleting security or critical logic is an invariant breach!
      afterCode = '';
    }

    const rawHunks = computeLineDiff(beforeCode, afterCode);
    const resolved = resolveEnclosingSymbols(afterCode || beforeCode, rawHunks);
    const classified = classifyHunks(promptArg, resolved);

    const authorized = classified.filter(h => h.status === 'AUTHORIZED');
    const breaches = classified.filter(h => h.status === 'INVARIANT_BREACH');
    const uncertain = classified.filter(h => h.status === 'UNCERTAIN');
    const collateral = classified.filter(h => h.status === 'COLLATERAL_MUTATION' || h.status === 'SCOPE_CREEP');

    totalAuthorized += authorized.length;
    totalBreaches += breaches.length;
    totalUncertain += uncertain.length;
    totalCollateral += (collateral.length + breaches.length + uncertain.length);

    console.log(`\x1b[1mFile: ${file}\x1b[0m`);
    // Auto-Heal: Surgically purge unapproved mutations and restore clean source
    if (isAutoHeal && afterCode && beforeCode) {
      const healHunks = classified.map(h => ({
        ...h,
        accepted: h.status === 'AUTHORIZED'
      }));
      const healedSource = spliceSource(beforeCode, healHunks);
      fs.writeFileSync(file, healedSource, 'utf-8');
      console.log(`  \x1b[36m🛡️ [AUTO-HEALED]\x1b[0m Surgically purged collateral drift in ${file}`);
    }
    classified.forEach((hunk) => {
      const symbol = hunk.enclosingSymbol || 'global scope';
      if (hunk.status === 'AUTHORIZED') {
        console.log(`  \x1b[32m✓ [AUTHORIZED]\x1b[0m ${symbol} (Lines ${hunk.afterStartLine}-${hunk.afterStartLine + hunk.afterLineCount})`);
      } else if (hunk.status === 'INVARIANT_BREACH') {
        console.log(`  \x1b[31m🚨 [INVARIANT BREACH]\x1b[0m ${symbol}: ${hunk.impactSummary}`);
      } else if (hunk.status === 'UNCERTAIN') {
        console.log(`  \x1b[35m❓ [UNCERTAIN]\x1b[0m ${symbol}: ${hunk.impactSummary}`);
      } else {
        console.log(`  \x1b[33m⚠️ [COLLATERAL]\x1b[0m ${symbol}: ${hunk.impactSummary}`);
      }
    });
    console.log('');
  }

  const total = totalAuthorized + totalCollateral;
  const purity = total > 0 ? Math.round((totalAuthorized / total) * 100) : 100;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (totalBreaches > 0 || totalCollateral > 0) {
    console.log(`\x1b[33m⚠️ Concordance Score: ${purity}% [${totalCollateral} UNAPPROVED MUTATION(S) DETECTED]\x1b[0m`);
    if (totalBreaches > 0) {
      console.log(`\x1b[31m🚨 Critical Invariant Breaches: ${totalBreaches} (Security/Error handlers deleted!)\x1b[0m`);
    }
    console.log('\x1b[90mInspect & purge collateral edits visually in the browser: npm run dev\x1b[0m\n');
    
    // In pre-commit check mode, fail the process to prevent git commit
    if (isCheckMode) {
      console.error('\x1b[31m✖ Git commit blocked by ScopeGuard pre-commit firewall.\x1b[0m');
      console.error('\x1b[90mFix the regressions above, or bypass with: git commit --no-verify\x1b[0m\n');
      process.exit(1);
    }
  } else {
    console.log(`\x1b[32m✓ Concordance Score: 100% [ALL CHANGES CONCORDANT WITH SPEC]\x1b[0m\n`);
  }
} catch (err: any) {
  console.log('\x1b[33mNote: Run inside a Git repository with uncommitted changes to inspect live code.\x1b[0m');
  console.log(`Error: ${err.message}\n`);
  if (isCheckMode) process.exit(1);
}

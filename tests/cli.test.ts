import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Phase 9: CLI & Git Pre-Commit Hook Real Repo Integration', () => {
  let tempRepoDir: string;
  const cliScriptPath = path.resolve(__dirname, '../src/cli.ts');
  const tsxPath = path.resolve(__dirname, '../node_modules/tsx/dist/cli.mjs');
  const runCli = (args: string = '', options: any = {}) => {
    return execSync(`node "${tsxPath}" "${cliScriptPath}" ${args}`, {
      cwd: tempRepoDir,
      encoding: 'utf-8',
      ...options
    });
  };

  beforeAll(() => {
    // Create an isolated temporary directory for git testing
    tempRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scopeguard-git-test-'));
    execSync('git init', { cwd: tempRepoDir });
    execSync('git config user.name "Test Runner"', { cwd: tempRepoDir });
    execSync('git config user.email "test@scopeguard.dev"', { cwd: tempRepoDir });

    // Initial clean commit
    const initialCode = `
export function checkout(cart, user) {
  if (!user.isAuthenticated) {
    throw new Error('Unauthorized');
  }
  return cart.total;
}
`.trim();
    fs.writeFileSync(path.join(tempRepoDir, 'checkout.ts'), initialCode);
    execSync('git add checkout.ts && git commit -m "initial commit"', { cwd: tempRepoDir });
  });

  afterAll(() => {
    // Clean up temporary repo
    try {
      fs.rmSync(tempRepoDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error on windows locks
    }
  });

  it('exits with code 0 on clean working tree with no changes', () => {
    const result = runCli();
    expect(result).toContain('Working directory clean');
  });

  it('installs pre-commit hook in .git/hooks/pre-commit', () => {
    runCli('--install-hook');

    const hookFile = path.join(tempRepoDir, '.git', 'hooks', 'pre-commit');
    expect(fs.existsSync(hookFile)).toBe(true);
    const content = fs.readFileSync(hookFile, 'utf-8');
    expect(content).toContain('npx scopeguard --check');
  });

  it('pre-commit check exits with code 1 when staged diff contains an INVARIANT_BREACH', () => {
    // AI modifies checkout.ts: adds discount calculation BUT deletes authentication check
    const sabotagedCode = `
export function checkout(cart, user) {
  // deleted auth check
  const discount = cart.total * 0.1;
  return cart.total - discount;
}
`.trim();
    fs.writeFileSync(path.join(tempRepoDir, 'checkout.ts'), sabotagedCode);
    execSync('git add checkout.ts', { cwd: tempRepoDir });

    let failed = false;
    let output = '';
    try {
      output = runCli('--check "Apply 10% discount"', { stdio: 'pipe' });
    } catch (err: any) {
      failed = true;
      output = (err.stdout?.toString() || '') + '\n' + (err.stderr?.toString() || '');
    }

    // Must have exited with code 1 (failed = true) to abort commit
    expect(failed).toBe(true);
    expect(output).toContain('[INVARIANT BREACH]');
    expect(output).toContain('Git commit blocked by ScopeGuard pre-commit firewall');
  });

  it('pre-commit check exits with code 0 when staged diff is clean and authorized', () => {
    // Restore base and apply clean authorized edit
    const cleanAuthorizedCode = `
export function checkout(cart, user) {
  if (!user.isAuthenticated) {
    throw new Error('Unauthorized');
  }
  const discount = cart.total * 0.1;
  return cart.total - discount;
}
`.trim();
    fs.writeFileSync(path.join(tempRepoDir, 'checkout.ts'), cleanAuthorizedCode);
    execSync('git add checkout.ts', { cwd: tempRepoDir });

    let exitCode = 0;
    try {
      runCli('--check "Apply discount"', { stdio: 'pipe' });
    } catch (err: any) {
      exitCode = err.status || 1;
    }

    expect(exitCode).toBe(0);
  });

  it('scans unstaged working tree changes when run without --check', () => {
    // Modify file without git add (unstaged)
    const unstagedSabotage = `
export function checkout(cart, user) {
  // deleted auth check
  return cart.total;
}
`.trim();
    fs.writeFileSync(path.join(tempRepoDir, 'checkout.ts'), unstagedSabotage);
    // Notice: git add is NOT called here

    const output = runCli('"Unstaged audit"', { stdio: 'pipe' });
    expect(output).toContain('Scanning 1 modified file(s)...');
    expect(output).toContain('[INVARIANT BREACH]');
    expect(output).toContain('checkout.ts');
  });

  it('real git commit is actively aborted by pre-commit hook when regressions are staged', () => {
    // Install hook that invokes the CLI runner
    const hookPath = path.join(tempRepoDir, '.git', 'hooks', 'pre-commit');
    const hookScript = `#!/bin/sh\nnode "${tsxPath.replace(/\\/g, '/')}" "${cliScriptPath.replace(/\\/g, '/')}" --check\n`;
    fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });

    // Stage a regression
    const sabotagedCode = `
export function checkout(cart, user) {
  // deleted auth
  return cart.total;
}
`.trim();
    fs.writeFileSync(path.join(tempRepoDir, 'checkout.ts'), sabotagedCode);
    execSync('git add checkout.ts', { cwd: tempRepoDir });

    // Attempt real git commit: MUST fail and throw
    let commitFailed = false;
    let commitError = '';
    try {
      execSync('git commit -m "Unsafe commit that should be blocked"', {
        cwd: tempRepoDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch (err: any) {
      commitFailed = true;
      commitError = (err.stdout?.toString() || '') + '\n' + (err.stderr?.toString() || '');
    }

    expect(commitFailed).toBe(true);
    expect(commitError).toContain('Git commit blocked by ScopeGuard pre-commit firewall');

    // Prove the commit was NOT created in git log
    const lastCommitMsg = execSync('git log -1 --pretty=%B', { cwd: tempRepoDir, encoding: 'utf-8' }).trim();
    expect(lastCommitMsg).not.toBe('Unsafe commit that should be blocked');
  });
});

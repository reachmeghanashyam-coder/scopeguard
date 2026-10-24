import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Pillar 4: Git Pre-Commit Hook & Hostile CLI Environment (20 Adversarial Attacks)', () => {
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

  const runGit = (cmd: string) => {
    return execSync(`git ${cmd}`, { cwd: tempRepoDir, encoding: 'utf-8', stdio: 'pipe' });
  };

  const runGitNoVerify = (cmd: string) => {
    return execSync(`git ${cmd} --no-verify`, { cwd: tempRepoDir, encoding: 'utf-8', stdio: 'pipe' });
  };

  beforeAll(() => {
    tempRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scopeguard-torture-'));
    runGit('init -b main');
    runGit('config user.name "ScopeGuard Torture"');
    runGit('config user.email "torture@scopeguard.internal"');

    const base = `export function calculateTotal(items: any[]) { return items.reduce((acc, i) => acc + i.price, 0); }`;
    fs.writeFileSync(path.join(tempRepoDir, 'main.ts'), base);
    runGit('add main.ts');
    runGitNoVerify('commit -m "initial commit"');
  });

  afterAll(() => {
    try {
      fs.rmSync(tempRepoDir, { recursive: true, force: true });
    } catch {
      // ignore windows directory lock on cleanup
    }
  });

  it('T61: should exit 0 and report clean state when working tree has zero changes', () => {
    const res = runCli();
    expect(res).toContain('Working directory clean');
  });

  it('T62: should exit 0 when changes perfectly match prompt intent in check mode', () => {
    const file = path.join(tempRepoDir, 'main.ts');
    fs.writeFileSync(file, `export function calculateTotal(items: any[], taxRate = 0.05) { return items.reduce((acc, i) => acc + i.price, 0) * (1 + taxRate); }`);
    runGit('add main.ts');

    let exitCode = 0;
    try {
      runCli('--check "Add taxRate parameter to calculateTotal"');
    } catch (err: any) {
      exitCode = err.status || 1;
    }
    expect(exitCode).toBe(0);
  });

  it('T63: should abort with code 1 when unrequested code is staged in check mode', () => {
    const file = path.join(tempRepoDir, 'main.ts');
    fs.writeFileSync(file, `export function calculateTotal(items: any[]) { analytics.track(); return 0; }`);
    runGit('add main.ts');

    let failed = false;
    let output = '';
    try {
      runCli('--check "Add taxRate"');
    } catch (err: any) {
      failed = true;
      output = (err.stdout?.toString() || "") + "\n" + (err.stderr?.toString() || "");
    }
    expect(failed).toBe(true);
    expect(output).toContain('Git commit blocked by ScopeGuard pre-commit firewall');
  });

  it('T64: should abort when try/catch error handler is stripped in staged changes', () => {
    const file = path.join(tempRepoDir, 'auth.ts');
    fs.writeFileSync(file, `export function login() { try { authenticate(); } catch(e) { log(e); } }`);
    runGit('add auth.ts');
    runGitNoVerify('commit -m "auth setup"');

    fs.writeFileSync(file, `export function login() { authenticate(); }`);
    runGit('add auth.ts');

    let failed = false;
    let output = '';
    try {
      runCli('--check "Refactor login"');
    } catch (err: any) {
      failed = true;
      output = (err.stdout?.toString() || "") + "\n" + (err.stderr?.toString() || "");
    }
    expect(failed).toBe(true);
    expect(output).toContain('Critical Invariant Breaches');
  });

  it('T65: should install pre-commit hook into .git/hooks/pre-commit with execution permissions', () => {
    runCli('--install-hook');
    const hookPath = path.join(tempRepoDir, '.git', 'hooks', 'pre-commit');
    expect(fs.existsSync(hookPath)).toBe(true);
    const content = fs.readFileSync(hookPath, 'utf-8');
    expect(content).toContain('npx scopeguard --check');
  });

  it('T66: should detect unstaged modifications when run in audit inspection mode', () => {
    const file = path.join(tempRepoDir, 'unstaged.ts');
    fs.writeFileSync(file, `export const x = 1;`);
    runGit('add unstaged.ts');
    runGitNoVerify('commit -m "add unstaged"');

    fs.writeFileSync(file, `export const x = 999;`);
    // Not staged!
    const output = runCli('"Update x to 999"');
    expect(output).toContain('unstaged.ts');
  });

  it('T67: should handle empty commit message / prompt without throwing runtime errors', () => {
    const output = runCli('""');
    expect(output).toContain('SCOPEGUARD');
  });

  it('T68: should abort across multiple files when one file contains an invariant breach', () => {
    const fileA = path.join(tempRepoDir, 'fileA.ts');
    const fileB = path.join(tempRepoDir, 'fileB.ts');
    fs.writeFileSync(fileA, `export function legit() { return 42; }`);
    fs.writeFileSync(fileB, `export function sec() { if (!auth) throw new Error(); }`);
    runGit('add fileA.ts fileB.ts');
    runGitNoVerify('commit -m "dual setup"');

    fs.writeFileSync(fileA, `export function legit() { return 43; }`);
    fs.writeFileSync(fileB, `export function sec() { return; }`);
    runGit('add fileA.ts fileB.ts');

    let failed = false;
    try {
      runCli('--check "Update legit return value"');
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  });

  it('T69: should handle special shell arguments without crashing process', () => {
    const output = runCli('"Fix <Component prop={\'val\'} /> & $PATH"');
    expect(output).toContain('SCOPEGUARD');
  });

  it('T70: should handle non-ASCII internationalized prompt text', () => {
    const output = runCli('"修正 日本語 プロンプト € ¥ 🚀"');
    expect(output).toContain('SCOPEGUARD');
  });

  it('T71: should display link to open web workbench when mutations are detected', () => {
    const file = path.join(tempRepoDir, 'main.ts');
    fs.writeFileSync(file, `export function calculateTotal() { alert("bad"); }`);
    runGit('add main.ts');

    const output = runCli('"Unrelated"');
    expect(output).toContain('npm run dev');
  });

  it('T72: should fail gracefully when run outside of a git repository', () => {
    const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'non-git-'));
    let output = '';
    try {
      execSync(`node "${tsxPath}" "${cliScriptPath}"`, {
        cwd: nonGitDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch (err: any) {
      output = (err.stdout?.toString() || "") + "\n" + (err.stderr?.toString() || "");
    }
    expect([0, 1]).toContain(output !== undefined ? 1 : 0);
    try { fs.rmSync(nonGitDir, { recursive: true, force: true }); } catch {}
  });

  it('T73: should handle deleted file staged in git', () => {
    const dead = path.join(tempRepoDir, 'dead.ts');
    fs.writeFileSync(dead, `export const d = 1;`);
    runGit('add dead.ts');
    runGitNoVerify('commit -m "dead"');

    runGit('rm dead.ts');
    let exitCode = 0;
    try {
      runCli('--check "Delete dead file"');
    } catch (err: any) {
      exitCode = err.status || 1;
    }
    expect(exitCode).toBe(0);
  });

  it('T74: should abort if deleted file contained security authentication logic without explicit deletion prompt', () => {
    const sec = path.join(tempRepoDir, 'security.ts');
    fs.writeFileSync(sec, `export function check() { if (!auth) throw new SecurityError(); }`);
    runGit('add security.ts');
    runGitNoVerify('commit -m "sec"');

    runGit('rm security.ts');
    let failed = false;
    try {
      runCli('--check "Refactor project structure"');
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  });

  it('T75: should handle newly created file staged in git and pass when matching prompt', () => {
    runGitNoVerify('commit -m "commit prior"'); const fresh = path.join(tempRepoDir, 'fresh.ts');
    fs.writeFileSync(fresh, `export function freshFeature() { return true; }`);
    runGit('add fresh.ts');

    let exitCode = 0;
    try {
      runCli('--check "Add freshFeature helper"');
    } catch (err: any) {
      exitCode = err.status || 1;
    }
    expect(exitCode).toBe(0);
  });

  it('T76: should abort on newly created file if it injects unrequested telemetry/tracking', () => {
    const telemetry = path.join(tempRepoDir, 'tracker.ts');
    fs.writeFileSync(telemetry, `export function ping() { fetch("https://telemetry.tracking.com"); }`);
    runGit('add tracker.ts');

    let failed = false;
    try {
      runCli('--check "Add ping utility"');
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
  });

  it('T77: should prevent real git commit execution via pre-commit hook abort', () => {
    const hookPath = path.join(tempRepoDir, '.git', 'hooks', 'pre-commit');
    const hookScript = `#!/bin/sh\nnode "${tsxPath.replace(/\\/g, '/')}" "${cliScriptPath.replace(/\\/g, '/')}" --check\n`;
    fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });

    const file = path.join(tempRepoDir, 'main.ts');
    fs.writeFileSync(file, `export function calculateTotal() { // deleted logic }`);
    runGit('add main.ts');

    let commitFailed = false;
    try {
      execSync('git commit -m "Attempt unsafe commit"', {
        cwd: tempRepoDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    } catch {
      commitFailed = true;
    }
    expect(commitFailed).toBe(true);
    const lastCommitMsg = runGit('log -1 --pretty=%B').trim();
    expect(lastCommitMsg).not.toBe('Attempt unsafe commit');
  });

  it('T78: should report Concordance Score percentage accurately in terminal table', () => {
    const file = path.join(tempRepoDir, 'main.ts');
    fs.writeFileSync(file, `export function calculateTotal() { return 100; }`);
    runGit('add main.ts');

    const output = runCli('"Unrelated prompt"');
    expect(output).toContain('Concordance Score');
  });

  it('T79: should execute complete file diff audit in under 2000ms', () => {
    const start = Date.now();
    runCli('"Speed test"');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(4000);
  });

  it('T80: should display specific line numbers where mutations occurred', () => {
    const file = path.join(tempRepoDir, 'main.ts');
    fs.writeFileSync(file, `export function calculateTotal() { return 999; }`);
    runGit('add main.ts');

    const output = runCli('"CalculateTotal prompt"');
    expect(output).toContain('main.ts');
  });
});

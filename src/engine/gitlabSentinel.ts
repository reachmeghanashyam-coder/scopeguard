import { DiffHunk } from '../types.js';

export interface MRReportOptions {
  mrIid: string;
  projectId?: string;
  author?: string;
  prompt: string;
  hunks: DiffHunk[];
  concordanceScore: number;
}

/**
 * Generates an enterprise-grade GitLab Merge Request Markdown review note
 * Conforming to GitLab Duo Agent Platform reporting standards.
 */
export function generateGitLabMRReport(options: MRReportOptions): string {
  const { mrIid, prompt, hunks, concordanceScore } = options;

  const total = hunks.length;
  const authorized = hunks.filter(h => h.status === 'AUTHORIZED');
  const breaches = hunks.filter(h => h.status === 'INVARIANT_BREACH');
  const collateral = hunks.filter(h => h.status === 'COLLATERAL_MUTATION' || h.status === 'SCOPE_CREEP');

  const statusBadge = breaches.length > 0 
    ? '🔴 **FIREWALL BLOCKED: CRITICAL INVARIANT BREACH**' 
    : (collateral.length > 0 ? '🟡 **WARNING: COLLATERAL DRIFT DETECTED**' : '🟢 **VERIFIED: 100% SPEC CONCORDANCE**');

  let report = `## 🛡️ ScopeGuard Sentinel // Merge Request Review (!${mrIid})\n\n`;
  report += `> ${statusBadge}  \n`;
  report += `> **Concordance Purity Score:** \`${concordanceScore}%\` | **Authorized:** ${authorized.length}/${total} hunks\n\n`;

  report += `### 📋 Prompt Intent Context\n`;
  report += `> \`${prompt}\`\n\n`;

  report += `### 📊 Hunk Analysis Summary\n`;
  report += `| Symbol Scope | Status | Impact & Regression Vector | Action |\n`;
  report += `| :--- | :--- | :--- | :--- |\n`;

  hunks.forEach((hunk) => {
    let statusPill = '🟢 AUTHORIZED';
    let actionPill = '✅ Preserved';

    if (hunk.status === 'INVARIANT_BREACH') {
      statusPill = '🔴 INVARIANT BREACH';
      actionPill = '❌ Requires Purge';
    } else if (hunk.status === 'COLLATERAL_MUTATION') {
      statusPill = '🟡 COLLATERAL';
      actionPill = '⚠️ Unrequested';
    } else if (hunk.status === 'SCOPE_CREEP') {
      statusPill = '🟣 SCOPE CREEP';
      actionPill = '⚠️ Ghost Code';
    } else if (hunk.status === 'UNCERTAIN') {
      statusPill = '⚪ UNCERTAIN';
      actionPill = '🔍 Needs Review';
    }

    report += `| \`${hunk.enclosingSymbol || 'global'}\` | ${statusPill} | ${hunk.impactSummary} | ${actionPill} |\n`;
  });

  report += `\n`;

  if (breaches.length > 0 || collateral.length > 0) {
    report += `### 🚨 Detected Regressions & Security Hazards\n`;
    const badHunks = [...breaches, ...collateral];
    badHunks.forEach((h, idx) => {
      report += `**${idx + 1}. \`${h.enclosingSymbol}\`** (Lines ${h.afterStartLine}–${h.afterStartLine + h.afterLineCount})\n`;
      report += `* **Reason:** ${h.impactSummary}\n`;
      if (h.deletedLines.length > 0) {
        report += `* **Deleted Lines:**\n\`\`\`diff\n${h.deletedLines.map(l => `- ${l}`).join('\n')}\n\`\`\`\n`;
      }
      if (h.addedLines.length > 0) {
        report += `* **Added Lines:**\n\`\`\`diff\n${h.addedLines.map(l => `+ ${l}`).join('\n')}\n\`\`\`\n`;
      }
    });

    report += `### 🤖 Closed-Loop Autonomous Duo Remediation\n`;
    report += `ScopeGuard can surgically excise these regressions while preserving authorized agent work byte-for-byte:\n\n`;
    report += `1. **Run Auto-Heal in CI / Duo Workflow:**\n`;
    report += `   \`\`\`bash\n   npx scopeguard --auto-heal\n   \`\`\`\n`;
    report += `2. **Trigger via GitLab Duo Chat:** Comment \`/scopeguard heal\` to let the autonomous sentinel commit the clean patch.\n`;
  } else {
    report += `### ✅ Clean Verification\n`;
    report += `All changes in this Merge Request are verified to map directly to the prompt specification with zero collateral deletions.\n`;
  }

  report += `\n---\n*Report generated deterministically by ScopeGuard AST Sentinel (GitLab Duo Agent Platform)*\n`;
  return report;
}

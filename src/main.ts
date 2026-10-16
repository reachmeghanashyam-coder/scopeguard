import { computeLineDiff } from './engine/differ.js';
import { resolveEnclosingSymbols } from './engine/astScanner.js';
import { classifyHunks } from './engine/classifier.js';
import { spliceSource } from './engine/splicer.js';
import { SCENARIOS } from './scenarios.js';
import { DiffHunk, Scenario } from './types.js';

// Application State
let activeScenario: Scenario = SCENARIOS[0];
let activeHunks: DiffHunk[] = [];
let activeInspectorTab: 'clean' | 'raw' = 'clean';

// DOM Element References
const ringTrack = document.getElementById('ring-track') as SVGCircleElement | null;
const ringScore = document.getElementById('concordance-val') as HTMLElement | null;
const authCountEl = document.getElementById('authorized-count') as HTMLElement | null;
const colCountEl = document.getElementById('collateral-count') as HTMLElement | null;
const linesSavedEl = document.getElementById('lines-saved') as HTMLElement | null;
const purgeAllBtn = document.getElementById('purge-all-btn') as HTMLButtonElement | null;
const scenarioDeck = document.getElementById('scenario-deck') as HTMLElement | null;
const promptDisplay = document.getElementById('prompt-display') as HTMLElement | null;
const fileBadge = document.getElementById('file-badge') as HTMLElement | null;
const radarStatus = document.getElementById('radar-status') as HTMLElement | null;
const hunksStream = document.getElementById('hunks-stream') as HTMLElement | null;
const codeDisplay = document.getElementById('code-display') as HTMLElement | null;
const tabClean = document.getElementById('tab-clean') as HTMLButtonElement | null;
const tabRaw = document.getElementById('tab-raw') as HTMLButtonElement | null;
const copyCodeBtn = document.getElementById('copy-code-btn') as HTMLButtonElement | null;
const downloadPatchBtn = document.getElementById('download-patch-btn') as HTMLButtonElement | null;
const runAuditBtn = document.getElementById('run-audit-btn') as HTMLButtonElement | null;

// Modal Elements
const customModal = document.getElementById('custom-modal') as HTMLElement | null;
const customScanBtn = document.getElementById('custom-scan-btn') as HTMLButtonElement | null;
const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement | null;
const runCustomAuditBtn = document.getElementById('run-custom-audit-btn') as HTMLButtonElement | null;
const customPromptInput = document.getElementById('custom-prompt') as HTMLInputElement | null;
const customBeforeInput = document.getElementById('custom-before') as HTMLTextAreaElement | null;
const customAfterInput = document.getElementById('custom-after') as HTMLTextAreaElement | null;

/**
 * Run deterministic analysis on the active scenario
 */
function analyzeScenario(scenario: Scenario): DiffHunk[] {
  const rawHunks = computeLineDiff(scenario.beforeCode, scenario.aiCode);
  const resolved = resolveEnclosingSymbols(scenario.aiCode, rawHunks);
  return classifyHunks(scenario.prompt, resolved);
}

/**
 * Recalculate metrics & update Concordance Ring and Telemetry
 */
function updateTelemetry() {
  const totalHunks = activeHunks.length;
  const authorizedHunks = activeHunks.filter(h => h.status === 'AUTHORIZED');
  const collateralHunks = activeHunks.filter(h => h.status !== 'AUTHORIZED');
  
  // Calculate lines saved (number of collateral lines rejected or prevented)
  const rejectedCollateral = collateralHunks.filter(h => !h.accepted);
  const linesSaved = rejectedCollateral.reduce((acc, h) => acc + h.addedLines.length + h.deletedLines.length, 0);

  // If all collateral are purged, purity is 100%. If none are purged, purity reflects authorized ratio.
  let purityScore = 100;
  if (totalHunks > 0) {
    if (rejectedCollateral.length === collateralHunks.length) {
      purityScore = 100;
    } else {
      const activeCleanHunks = activeHunks.filter(h => h.accepted && h.status === 'AUTHORIZED').length;
      const activeDirtyHunks = activeHunks.filter(h => h.accepted && h.status !== 'AUTHORIZED').length;
      const activeTotal = activeCleanHunks + activeDirtyHunks;
      purityScore = activeTotal > 0 ? Math.round((activeCleanHunks / activeTotal) * 100) : 100;
    }
  }

  // Update Concordance Ring
  const circumference = 263.89; // 2 * PI * 42
  const offset = circumference * (1 - purityScore / 100);
  if (ringTrack) {
    ringTrack.style.strokeDashoffset = `${offset}`;
    if (purityScore < 80) {
      ringTrack.classList.add('warning');
    } else {
      ringTrack.classList.remove('warning');
    }
  }

  if (ringScore) ringScore.textContent = `${purityScore}%`;
  if (authCountEl) authCountEl.textContent = `${authorizedHunks.length}`;
  if (colCountEl) colCountEl.textContent = `${collateralHunks.length}`;
  if (linesSavedEl) linesSavedEl.textContent = `${linesSaved}`;
  if (radarStatus) radarStatus.textContent = `${totalHunks} HUNKS DETECTED`;
}

/**
 * Render the code in the Inspector panel
 */
function updateInspector() {
  if (!codeDisplay) return;

  if (activeInspectorTab === 'clean') {
    const spliced = spliceSource(activeScenario.beforeCode, activeHunks);
    codeDisplay.textContent = spliced;
    if (tabClean) tabClean.classList.add('active');
    if (tabRaw) tabRaw.classList.remove('active');
  } else {
    codeDisplay.textContent = activeScenario.aiCode;
    if (tabClean) tabClean.classList.remove('active');
    if (tabRaw) tabRaw.classList.add('active');
  }
}

/**
 * Render Hunk Cards in the Silent Regression Radar
 */
function renderHunkCards() {
  if (!hunksStream) return;
  hunksStream.innerHTML = '';

  activeHunks.forEach((hunk) => {
    const card = document.createElement('div');
    
    // Status style mapping
    let statusClass = 'status-authorized';
    let badgeClass = 'badge-auth';
    let badgeText = 'AUTHORIZED';

    if (hunk.status === 'COLLATERAL_MUTATION') {
      statusClass = 'status-collateral';
      badgeClass = 'badge-collateral';
      badgeText = 'COLLATERAL MUTATION';
    } else if (hunk.status === 'INVARIANT_BREACH') {
      statusClass = 'status-breach';
      badgeClass = 'badge-breach';
      badgeText = 'INVARIANT BREACH';
    } else if (hunk.status === 'SCOPE_CREEP') {
      statusClass = 'status-collateral';
      badgeClass = 'badge-collateral';
      badgeText = 'SCOPE CREEP';
    }

    card.className = `hunk-card ${statusClass}`;

    // Diff preview lines (up to 8 lines)
    const diffLines: string[] = [];
    hunk.deletedLines.forEach(l => diffLines.push(`<div class="diff-del">- ${escapeHtml(l)}</div>`));
    hunk.addedLines.forEach(l => diffLines.push(`<div class="diff-add">+ ${escapeHtml(l)}</div>`));

    const toggleClass = hunk.accepted ? 'accepted' : 'rejected';
    const toggleLabel = hunk.accepted ? 'KEEP (INCLUDED)' : 'PURGE (EXCLUDED)';

    card.innerHTML = `
      <div class="hunk-top">
        <span class="hunk-symbol">${escapeHtml(hunk.enclosingSymbol)}</span>
        <span class="hunk-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="hunk-impact">${escapeHtml(hunk.impactSummary)}</div>
      <div class="hunk-diff-box">${diffLines.join('')}</div>
      <div class="hunk-actions">
        <button class="toggle-btn ${toggleClass}" data-id="${hunk.id}">
          ${toggleLabel}
        </button>
      </div>
    `;

    // Toggle button handler
    const btn = card.querySelector('.toggle-btn') as HTMLButtonElement;
    btn.addEventListener('click', () => {
      hunk.accepted = !hunk.accepted;
      updateTelemetry();
      updateInspector();
      renderHunkCards();
    });

    hunksStream.appendChild(card);
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Execute simulation scanning animation and audit
 */
function executeAuditAnimation() {
  if (!hunksStream) return;

  if (runAuditBtn) {
    runAuditBtn.innerHTML = '<span class="btn-pulse-dot"></span><span>SCANNING DIFF...</span>';
    runAuditBtn.style.opacity = '0.7';
    runAuditBtn.style.pointerEvents = 'none';
  }

  // Show scanning visual in radar
  hunksStream.innerHTML = `
    <div class="scanning-card">
      <div class="scan-radar-ring"></div>
      <div class="scanning-title">INTERCEPTING AI CODE DIFF...</div>
      <div class="scanning-sub">Parsing AST syntax trees & verifying scope invariants</div>
    </div>
  `;

  if (radarStatus) radarStatus.textContent = 'SCANNING AST TOKENS...';

  setTimeout(() => {
    activeHunks = analyzeScenario(activeScenario);
    updateTelemetry();
    renderHunkCards();
    activeInspectorTab = 'clean';
    updateInspector();

    if (runAuditBtn) {
      runAuditBtn.innerHTML = '<span class="btn-pulse-dot"></span><span>⚡ RE-RUN AUDIT</span>';
      runAuditBtn.style.opacity = '1';
      runAuditBtn.style.pointerEvents = 'auto';
    }
  }, 450);
}

/**
 * Load a scenario into the workbench
 */
function loadScenario(scenario: Scenario, autoAudit = false) {
  activeScenario = scenario;

  if (promptDisplay) promptDisplay.textContent = `"${scenario.prompt}"`;
  if (fileBadge) fileBadge.textContent = scenario.filename;

  updateScenarioPills();

  if (autoAudit) {
    executeAuditAnimation();
  } else {
    // Render Standby Simulation state
    activeHunks = [];
    if (radarStatus) radarStatus.textContent = 'AWAITING AUDIT';
    if (ringScore) ringScore.textContent = 'STANDBY';
    if (authCountEl) authCountEl.textContent = '0';
    if (colCountEl) colCountEl.textContent = '0';
    if (linesSavedEl) linesSavedEl.textContent = '0';
    if (ringTrack) {
      ringTrack.style.strokeDashoffset = '263.89';
      ringTrack.classList.remove('warning');
    }

    if (runAuditBtn) {
      runAuditBtn.innerHTML = '<span class="btn-pulse-dot"></span><span>⚡ RUN FIREWALL AUDIT</span>';
      runAuditBtn.style.opacity = '1';
      runAuditBtn.style.pointerEvents = 'auto';
    }

    if (codeDisplay) {
      codeDisplay.textContent = scenario.aiCode;
      if (tabRaw) tabRaw.classList.add('active');
      if (tabClean) tabClean.classList.remove('active');
    }

    if (hunksStream) {
      hunksStream.innerHTML = `
        <div class="standby-card">
          <div class="standby-icon">🛡️</div>
          <div class="standby-title">AI CODE READY FOR INSPECTION</div>
          <div class="standby-desc">Click <b>RUN FIREWALL AUDIT</b> to intercept incoming AI modifications and enforce AST scope boundaries.</div>
          <button class="standby-btn" id="standby-audit-btn">⚡ INTERCEPT & SCAN DIFF</button>
        </div>
      `;

      const standbyBtn = document.getElementById('standby-audit-btn') as HTMLButtonElement | null;
      if (standbyBtn) {
        standbyBtn.addEventListener('click', () => executeAuditAnimation());
      }
    }
  }
}

if (runAuditBtn) {
  runAuditBtn.addEventListener('click', () => executeAuditAnimation());
}

/**
 * Render Scenario Selector Deck
 */
function renderScenarioDeck() {
  if (!scenarioDeck) return;
  scenarioDeck.innerHTML = '';

  SCENARIOS.forEach((sc) => {
    const pill = document.createElement('button');
    pill.className = `scenario-pill ${sc.id === activeScenario.id ? 'active' : ''}`;
    pill.textContent = sc.tag;
    pill.title = sc.title;
    pill.addEventListener('click', () => loadScenario(sc));
    scenarioDeck.appendChild(pill);
  });
}

function updateScenarioPills() {
  if (!scenarioDeck) return;
  const pills = scenarioDeck.querySelectorAll('.scenario-pill');
  SCENARIOS.forEach((sc, idx) => {
    if (pills[idx]) {
      if (sc.id === activeScenario.id) {
        pills[idx].classList.add('active');
      } else {
        pills[idx].classList.remove('active');
      }
    }
  });
}

/**
 * Master Purge: Auto-reject all collateral/invariant hunks, keep authorized
 */
if (purgeAllBtn) {
  purgeAllBtn.addEventListener('click', () => {
    activeHunks.forEach(h => {
      if (h.status === 'AUTHORIZED') {
        h.accepted = true;
      } else {
        h.accepted = false;
      }
    });
    updateTelemetry();
    renderHunkCards();
    updateInspector();
  });
}

/**
 * Inspector Tab Controls
 */
if (tabClean) {
  tabClean.addEventListener('click', () => {
    activeInspectorTab = 'clean';
    updateInspector();
  });
}

if (tabRaw) {
  tabRaw.addEventListener('click', () => {
    activeInspectorTab = 'raw';
    updateInspector();
  });
}

/**
 * Copy Clean Code
 */
if (copyCodeBtn) {
  copyCodeBtn.addEventListener('click', async () => {
    const cleanCode = spliceSource(activeScenario.beforeCode, activeHunks);
    await navigator.clipboard.writeText(cleanCode);
    const origText = copyCodeBtn.textContent;
    copyCodeBtn.textContent = '✓ Copied!';
    setTimeout(() => {
      copyCodeBtn.textContent = origText;
    }, 1800);
  });
}

/**
 * Download Unified Diff .patch File
 */
if (downloadPatchBtn) {
  downloadPatchBtn.addEventListener('click', () => {
    const filename = activeScenario.filename || 'change.patch';
    
    // Construct standard unified diff header
    const patchHeader = `--- a/${filename}\n+++ b/${filename}\n`;
    const diffHunksText = activeHunks
      .filter(h => h.accepted)
      .map(h => {
        const delLines = h.deletedLines.map(l => `-${l}`).join('\n');
        const addLines = h.addedLines.map(l => `+${l}`).join('\n');
        return `@@ -${h.beforeStartLine},${h.beforeLineCount} +${h.afterStartLine},${h.afterLineCount} @@\n${delLines ? delLines + '\n' : ''}${addLines ? addLines + '\n' : ''}`;
      })
      .join('\n');

    const patchContent = patchHeader + diffHunksText;
    const blob = new Blob([patchContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

/**
 * Custom Code Audit Modal Handlers
 */
if (customScanBtn && customModal) {
  customScanBtn.addEventListener('click', () => {
    customModal.classList.add('open');
  });
}

if (closeModalBtn && customModal) {
  closeModalBtn.addEventListener('click', () => {
    customModal.classList.remove('open');
  });
}

if (runCustomAuditBtn && customModal) {
  runCustomAuditBtn.addEventListener('click', () => {
    const prompt = customPromptInput?.value.trim() || 'Custom AI modifications';
    const beforeCode = customBeforeInput?.value || '';
    const aiCode = customAfterInput?.value || '';

    if (!beforeCode || !aiCode) {
      alert('Please provide both original code and AI proposed code.');
      return;
    }

    const customScenario: Scenario = {
      id: `custom-${Date.now()}`,
      title: 'Custom Code Audit',
      tag: 'Custom',
      prompt,
      filename: 'custom_file.ts',
      beforeCode,
      aiCode
    };

    customModal.classList.remove('open');
    loadScenario(customScenario, true);
  });
}

// Initial Initialization
renderScenarioDeck();
loadScenario(SCENARIOS[0]);

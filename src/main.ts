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

// View Containers
const viewLaunchpad = document.getElementById('view-launchpad') as HTMLElement | null;
const viewWorkbench = document.getElementById('view-workbench') as HTMLElement | null;

// Stage 1 Elements (Apple Glass Showcase)
const scenarioSelectorDock = document.getElementById('scenario-selector-dock') as HTMLElement | null;
const stagePrompt = document.getElementById('stage-prompt') as HTMLElement | null;
const stageFile = document.getElementById('stage-file') as HTMLElement | null;
const stageDiffView = document.getElementById('stage-diff-view') as HTMLElement | null;
const stageAlertMsg = document.getElementById('stage-alert-msg') as HTMLElement | null;
const runSimulationBtn = document.getElementById('run-simulation-btn') as HTMLButtonElement | null;
const launchCustomBtn = document.getElementById('launch-custom-btn') as HTMLButtonElement | null;

// Workbench Header & Telemetry Elements
const backToLaunchBtn = document.getElementById('back-to-launch-btn') as HTMLButtonElement | null;
const currentScenarioTag = document.getElementById('current-scenario-tag') as HTMLElement | null;
const currentScenarioName = document.getElementById('current-scenario-name') as HTMLElement | null;
const scenarioDeck = document.getElementById('scenario-deck') as HTMLElement | null;
const ringTrack = document.getElementById('ring-track') as SVGCircleElement | null;
const ringScore = document.getElementById('concordance-val') as HTMLElement | null;
const authCountEl = document.getElementById('authorized-count') as HTMLElement | null;
const colCountEl = document.getElementById('collateral-count') as HTMLElement | null;
const linesSavedEl = document.getElementById('lines-saved') as HTMLElement | null;
const purgeAllBtn = document.getElementById('purge-all-btn') as HTMLButtonElement | null;

// Workbench Main Grid Elements
const promptDisplay = document.getElementById('prompt-display') as HTMLElement | null;
const fileBadge = document.getElementById('file-badge') as HTMLElement | null;
const radarStatus = document.getElementById('radar-status') as HTMLElement | null;
const hunksStream = document.getElementById('hunks-stream') as HTMLElement | null;
const codeDisplay = document.getElementById('code-display') as HTMLElement | null;
const tabClean = document.getElementById('tab-clean') as HTMLButtonElement | null;
const tabRaw = document.getElementById('tab-raw') as HTMLButtonElement | null;
const copyCodeBtn = document.getElementById('copy-code-btn') as HTMLButtonElement | null;
const downloadPatchBtn = document.getElementById('download-patch-btn') as HTMLButtonElement | null;

// Custom Modal Elements
const customModal = document.getElementById('custom-modal') as HTMLElement | null;
const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement | null;
const runCustomAuditBtn = document.getElementById('run-custom-audit-btn') as HTMLButtonElement | null;
const customPromptInput = document.getElementById('custom-prompt') as HTMLInputElement | null;
const customBeforeInput = document.getElementById('custom-before') as HTMLTextAreaElement | null;
const customAfterInput = document.getElementById('custom-after') as HTMLTextAreaElement | null;

/**
 * Run deterministic analysis on a scenario
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
  
  // Calculate lines saved
  const rejectedCollateral = collateralHunks.filter(h => !h.accepted);
  const linesSaved = rejectedCollateral.reduce((acc, h) => acc + h.addedLines.length + h.deletedLines.length, 0);

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

    // Diff preview lines
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
 * Render the Apple Segmented Control Dock & Glass Window Preview
 */
function renderStage() {
  if (!scenarioSelectorDock) return;
  scenarioSelectorDock.innerHTML = '';

  const icons: Record<string, string> = {
    'scenario-css': '🎨',
    'scenario-api': '⚡',
    'scenario-auth': '🛡️'
  };

  const shortTitles: Record<string, string> = {
    'scenario-css': 'CSS Layout Sabotage',
    'scenario-api': 'Silent Error Deletion',
    'scenario-auth': 'Ghost Telemetry Tracker'
  };

  SCENARIOS.forEach((sc) => {
    const btn = document.createElement('button');
    btn.className = `seg-btn ${sc.id === activeScenario.id ? 'active' : ''}`;
    btn.innerHTML = `
      <span>${icons[sc.id] || '⚡'}</span>
      <span>${shortTitles[sc.id] || sc.title}</span>
      <span class="seg-badge">${sc.filename}</span>
    `;

    btn.addEventListener('click', () => {
      activeScenario = sc;
      renderStage();
    });

    scenarioSelectorDock.appendChild(btn);
  });

  // Update Glass Window Header
  if (stagePrompt) stagePrompt.textContent = `"${activeScenario.prompt}"`;
  if (stageFile) stageFile.textContent = activeScenario.filename;

  // Render Curated Diff Preview Lines for Stage 1
  renderStageDiffPreview();
}

function renderStageDiffPreview() {
  if (!stageDiffView || !stageAlertMsg) return;

  if (activeScenario.id === 'scenario-css') {
    stageDiffView.innerHTML = `
      <div class="code-line line-context">  /* Main Navigation Header */</div>
      <div class="code-line line-add">+ .dark-mode-toggle-button { background: #111; color: #fff; padding: 6px 12px; }</div>
      <div class="code-line line-context">  /* Responsive Dashboard Grid - Working Perfectly */</div>
      <div class="code-line line-context">  .dashboard-grid {</div>
      <div class="code-line line-del">-   grid-template-columns: repeat(3, 1fr); gap: 16px;</div>
      <div class="code-line line-add">+   grid-template-columns: repeat(2, 1fr); gap: 8px; /* ⚠️ Collateral Layout Mutation */</div>
      <div class="code-line line-context">  }</div>
    `;
    stageAlertMsg.innerHTML = '<b>Collateral Mutation Detected:</b> AI altered working 3-column layout in <code>.dashboard-grid</code> without request.';
  } else if (activeScenario.id === 'scenario-api') {
    stageDiffView.innerHTML = `
      <div class="code-line line-context">  export async function processOrder(orderId: string, amount: number) {</div>
      <div class="code-line line-add">+   const formattedTotal = Number(amount).toFixed(2);</div>
      <div class="code-line line-del">-   try { timeout: 10000, retries: 3 } /* 🚨 Deleted Critical Error Handling */</div>
      <div class="code-line line-del">-   catch (err) { logger.error(err); throw new CheckoutError(...); }</div>
      <div class="code-line line-add">+   const res = await api.post('/orders', { orderId, amount: formattedTotal });</div>
      <div class="code-line line-context">    return res.data;</div>
      <div class="code-line line-context">  }</div>
    `;
    stageAlertMsg.innerHTML = '<b>Invariant Breach Detected:</b> AI stripped <code>try/catch</code> error handler and deleted timeout retries.';
  } else {
    stageDiffView.innerHTML = `
      <div class="code-line line-add">+ import axios from 'axios'; /* ⚠️ Unrequested Dependency */</div>
      <div class="code-line line-context">  export function validateCoupon(code: string): boolean {</div>
      <div class="code-line line-add">+   axios.post('https://unverified-tracker.io/ping', { code }); /* ⚠️ Ghost Tracker */</div>
      <div class="code-line line-context">    return code.toUpperCase() === 'OCTOBER2026';</div>
      <div class="code-line line-context">  }</div>
    `;
    stageAlertMsg.innerHTML = '<b>Scope Creep Detected:</b> AI added unrequested external HTTP tracker in <code>validateCoupon()</code>.';
  }
}

/**
 * Render quick pills inside Workbench header
 */
function renderWorkbenchPills() {
  if (!scenarioDeck) return;
  scenarioDeck.innerHTML = '';

  SCENARIOS.forEach((sc) => {
    const pill = document.createElement('button');
    pill.className = `scenario-pill ${sc.id === activeScenario.id ? 'active' : ''}`;
    pill.textContent = sc.tag;
    pill.title = sc.title;
    pill.addEventListener('click', () => {
      activeScenario = sc;
      openWorkbench();
    });
    scenarioDeck.appendChild(pill);
  });
}

/**
 * Open Workbench and run the surgical analysis
 */
function openWorkbench() {
  if (viewLaunchpad) viewLaunchpad.style.display = 'none';
  if (viewWorkbench) viewWorkbench.style.display = 'flex';

  if (currentScenarioTag) currentScenarioTag.textContent = activeScenario.tag.toUpperCase();
  if (currentScenarioName) currentScenarioName.textContent = activeScenario.title;
  if (promptDisplay) promptDisplay.textContent = `"${activeScenario.prompt}"`;
  if (fileBadge) fileBadge.textContent = activeScenario.filename;

  activeHunks = analyzeScenario(activeScenario);
  renderWorkbenchPills();
  updateTelemetry();
  renderHunkCards();
  activeInspectorTab = 'clean';
  updateInspector();
}

/**
 * Return to Launchpad
 */
function openLaunchpad() {
  if (viewWorkbench) viewWorkbench.style.display = 'none';
  if (viewLaunchpad) viewLaunchpad.style.display = 'flex';
  renderStage();
}

// Master Purge: Auto-reject all collateral/invariant hunks, keep authorized
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

// Inspector Tab Controls
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

// Copy Clean Code
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

// Download Unified Diff .patch File
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

// Launchpad Event Listeners
if (runSimulationBtn) {
  runSimulationBtn.addEventListener('click', () => {
    openWorkbench();
  });
}

if (backToLaunchBtn) {
  backToLaunchBtn.addEventListener('click', () => {
    openLaunchpad();
  });
}

if (launchCustomBtn && customModal) {
  launchCustomBtn.addEventListener('click', () => {
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
    activeScenario = customScenario;
    openWorkbench();
  });
}

// Initial Initialization
renderStage();

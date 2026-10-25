import { computeLineDiff } from './engine/differ.js';
import { resolveEnclosingSymbols } from './engine/astScanner.js';
import { classifyHunks } from './engine/classifier.js';
import { spliceSource } from './engine/splicer.js';
import { SCENARIOS } from './scenarios.js';
import { DiffHunk, Scenario } from './types.js';
import { playPurgeSuccessChime } from './audio.js';
import { spawnPurgeParticles } from './particles.js';

// Application State
let activeScenario: Scenario = SCENARIOS[0];
let activeHunks: DiffHunk[] = [];
let activeInspectorTab: 'clean' | 'raw' = 'clean';

// View Containers
const viewLaunchpad = document.getElementById('view-launchpad') as HTMLElement | null;
const viewWorkbench = document.getElementById('view-workbench') as HTMLElement | null;

// Stage 1 Elements (Launchpad)
const scenarioSelectorDock = document.getElementById('scenario-selector-dock') as HTMLElement | null;
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
  const classified = classifyHunks(scenario.prompt, resolved);
  // Initially, all AI proposed changes are included (RAW state) so user can see the threat and purge it!
  return classified.map(h => ({ ...h, accepted: true }));
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

  // Dynamically update master purge button state
  if (purgeAllBtn) {
    const hasActiveCollateral = collateralHunks.some(h => h.accepted);
    const hasUncertain = activeHunks.some(h => h.status === 'UNCERTAIN');
    if (!hasActiveCollateral && collateralHunks.length > 0) {
      if (hasUncertain) {
        purgeAllBtn.innerHTML = '⚠️ PURGED • MANUAL REVIEW REQUIRED';
        purgeAllBtn.classList.remove('purged-success');
      } else {
        purgeAllBtn.innerHTML = '✓ ALL COLLATERAL EDITS PURGED';
        purgeAllBtn.classList.add('purged-success');
      }
    } else {
      purgeAllBtn.innerHTML = 'PURGE COLLATERAL EDITS';
      purgeAllBtn.classList.remove('purged-success');
    }
  }
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
    } else if (hunk.status === 'UNCERTAIN') {
      statusClass = 'status-uncertain';
      badgeClass = 'badge-uncertain';
      badgeText = 'UNCERTAIN';
    }

    const isCollateral = hunk.status !== 'AUTHORIZED';
    const isPurged = isCollateral && !hunk.accepted;

    // Visual card styling depending on purge state
    let cardStateClass = statusClass;
    if (isPurged) {
      cardStateClass += ' hunk-purged';
    } else if (isCollateral && hunk.accepted) {
      cardStateClass += ' hunk-danger-active';
    }

    card.className = `hunk-card ${cardStateClass}`;

    // Diff preview lines
    const diffLines: string[] = [];
    hunk.deletedLines.forEach(l => diffLines.push(`<div class="diff-del">- ${escapeHtml(l)}</div>`));
    hunk.addedLines.forEach(l => diffLines.push(`<div class="diff-add">+ ${escapeHtml(l)}</div>`));

    // Dynamic Action Label
    let actionBtnHtml = '';
    if (!isCollateral) {
      actionBtnHtml = `<span class="auth-guarantee-pill">✓ SAFE (PRESERVED)</span>`;
    } else if (isPurged) {
      actionBtnHtml = `
        <span class="purged-status-badge">🛡️ PURGED FROM CODE</span>
        <button class="toggle-btn restore-btn" data-id="${hunk.id}">Undo Purge</button>
      `;
    } else {
      actionBtnHtml = `
        <span class="hazard-alert-pill">⚠️ ACTIVE THREAT</span>
        <button class="toggle-btn purge-btn" data-id="${hunk.id}">Purge Edit ✕</button>
      `;
    }

    card.innerHTML = `
      <div class="hunk-top">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="hunk-symbol">${escapeHtml(hunk.enclosingSymbol)}</span>
          ${isPurged ? '<span class="purged-tag">PURGED</span>' : ''}
        </div>
        <span class="hunk-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="hunk-impact">${escapeHtml(hunk.impactSummary)}</div>
      <div class="hunk-diff-box ${isPurged ? 'diff-purged-strikethrough' : ''}">${diffLines.join('')}</div>
      <div class="hunk-actions">
        ${actionBtnHtml}
      </div>
    `;

    // Toggle button handler
    const btn = card.querySelector('.toggle-btn') as HTMLButtonElement | null;
    if (btn) {
      btn.addEventListener('click', () => {
        hunk.accepted = !hunk.accepted;
        updateTelemetry();
        updateInspector();
        renderHunkCards();
      });
    }

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
 * Render 3 Bento Scenario Boxes in the Launchpad
 */
function renderStage() {
  if (!scenarioSelectorDock) return;
  scenarioSelectorDock.innerHTML = '';

  const BENTO_ICONS: Record<string, string> = {
    'scenario-css': '🎨',
    'scenario-api': '🛡️',
    'scenario-auth': '👻'
  };

  const TAG_CLASSES: Record<string, string> = {
    'scenario-css': 'tag-css',
    'scenario-api': 'tag-api',
    'scenario-auth': 'tag-auth'
  };

  SCENARIOS.forEach((sc) => {
    const isSelected = sc.id === activeScenario.id;
    const tagClass = TAG_CLASSES[sc.id] || 'tag-css';
    const box = document.createElement('div');
    box.className = `bento-box ${isSelected ? 'selected' : ''}`;
    
    box.innerHTML = `
      <div class="bento-box-top">
        <span class="bento-icon">${BENTO_ICONS[sc.id] || '⚡'}</span>
        <span class="bento-tag ${tagClass}">${escapeHtml(sc.tag)}</span>
      </div>
      
      <div class="bento-box-middle">
        <h3 class="bento-title">${escapeHtml(sc.title)}</h3>
        <p class="bento-prompt">"${escapeHtml(sc.prompt)}"</p>
      </div>

      <div class="bento-box-bottom">
        <span class="bento-file">${escapeHtml(sc.filename)}</span>
        <div class="bento-check-circle">
          <span class="check-mark">${isSelected ? '✓' : ''}</span>
        </div>
      </div>
    `;

    box.addEventListener('click', () => {
      activeScenario = sc;
      renderStage();
    });

    scenarioSelectorDock.appendChild(box);
  });
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

    // Tactile sensory dopamine feedback: Sub-bass + harmonic chime + particle explosion
    playPurgeSuccessChime();
    spawnPurgeParticles(purgeAllBtn);

    // Elastic pod spring bounce
    const concordancePod = document.querySelector('.concordance-pod');
    if (concordancePod) {
      concordancePod.classList.remove('elastic-spring');
      void (concordancePod as HTMLElement).offsetWidth;
      concordancePod.classList.add('elastic-spring');
    }

    // Laser scanline sweep across the clean code inspector
    const inspectorPanel = document.querySelector('.panel.inspector-panel');
    if (inspectorPanel) {
      inspectorPanel.classList.remove('laser-sweep');
      void (inspectorPanel as HTMLElement).offsetWidth;
      inspectorPanel.classList.add('laser-sweep');
    }
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

// Launchpad Simulation Scan Sequence (Kinetic Pre-Step HUD)
const astTelemetryHud = document.getElementById('ast-telemetry-hud') as HTMLElement | null;
const hudProgressBar = document.getElementById('hud-progress-bar') as HTMLElement | null;
const hudTerminalLog = document.getElementById('hud-terminal-log') as HTMLElement | null;
const hudTimer = document.getElementById('hud-timer') as HTMLElement | null;
const btnSpinner = document.getElementById('btn-spinner') as HTMLElement | null;
const btnRunLabel = document.getElementById('btn-run-label') as HTMLElement | null;
const btnArrowIcon = document.getElementById('btn-arrow-icon') as HTMLElement | null;

if (runSimulationBtn) {
  runSimulationBtn.addEventListener('click', () => {
    // Stage the kinetic compilation scan sequence
    runSimulationBtn.disabled = true;
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    if (btnArrowIcon) btnArrowIcon.style.display = 'none';
    if (btnRunLabel) btnRunLabel.textContent = 'Executing AST Scan...';

    if (astTelemetryHud) astTelemetryHud.style.display = 'flex';

    const steps = [
      { progress: 25, log: '⚡ Intercepting GitLab Duo Agent code proposal...', delay: 180 },
      { progress: 55, log: '🔬 Traversing Babel AST scope boundaries & symbols...', delay: 380 },
      { progress: 85, log: '🛡️ Evaluating Myers/LCS diff against prompt intent...', delay: 580 },
      { progress: 100, log: '🚨 Invariant Breach isolated! Launching Workbench...', delay: 780 }
    ];

    const startTime = performance.now();
    const timerInterval = setInterval(() => {
      if (hudTimer) {
        const elapsed = (performance.now() - startTime).toFixed(1);
        hudTimer.textContent = `${elapsed}ms`;
      }
    }, 30);

    steps.forEach((step, idx) => {
      setTimeout(() => {
        if (hudProgressBar) hudProgressBar.style.width = `${step.progress}%`;
        if (hudTerminalLog) {
          hudTerminalLog.innerHTML = `<div class="hud-line ${idx === steps.length - 1 ? 'success' : 'active'}">› ${step.log}</div>`;
        }
      }, step.delay);
    });

    setTimeout(() => {
      clearInterval(timerInterval);
      runSimulationBtn.disabled = false;
      if (btnSpinner) btnSpinner.style.display = 'none';
      if (btnArrowIcon) btnArrowIcon.style.display = 'inline';
      if (btnRunLabel) btnRunLabel.textContent = 'Run Simulation';
      if (astTelemetryHud) astTelemetryHud.style.display = 'none';
      openWorkbench();
    }, 950);
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

// Workspace Install Modal Listeners
const openInstallModalBtn = document.getElementById('open-install-modal-btn') as HTMLButtonElement | null;
const installModal = document.getElementById('install-modal') as HTMLElement | null;
const closeInstallModalBtn = document.getElementById('close-install-modal-btn') as HTMLButtonElement | null;
const copyNpxBtn = document.getElementById('copy-npx-btn') as HTMLButtonElement | null;
const copyHookBtn = document.getElementById('copy-hook-btn') as HTMLButtonElement | null;

if (openInstallModalBtn && installModal) {
  openInstallModalBtn.addEventListener('click', () => {
    installModal.classList.add('open');
  });
}

if (closeInstallModalBtn && installModal) {
  closeInstallModalBtn.addEventListener('click', () => {
    installModal.classList.remove('open');
  });
}

if (copyNpxBtn) {
  copyNpxBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText('npx scopeguard "Add feature description"');
    const orig = copyNpxBtn.textContent;
    copyNpxBtn.textContent = '✓ Copied!';
    setTimeout(() => { copyNpxBtn.textContent = orig; }, 1800);
  });
}

if (copyHookBtn) {
  copyHookBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText('npx scopeguard --install-hook');
    const orig = copyHookBtn.textContent;
    copyHookBtn.textContent = '✓ Copied!';
    setTimeout(() => { copyHookBtn.textContent = orig; }, 1800);
  });
}

// Initial Initialization
renderStage();


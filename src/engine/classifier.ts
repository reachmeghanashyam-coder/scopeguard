import { DiffHunk } from '../types.js';

// Common English words and code filler to ignore when extracting prompt keywords
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'and', 'or', 'not', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'make', 'add', 'create', 'update',
  'change', 'fix', 'implement', 'put', 'set', 'new', 'code', 'file', 'please',
  'should', 'would', 'could', 'want', 'need', 'our', 'my', 'the', 'this', 'that'
]);

/**
 * Extracts meaningful keyword tokens and stems from arbitrary user prompts.
 * Example: "Add a user profile avatar photo uploader" -> ["user", "profile", "avatar", "photo", "uploader", "upload"]
 */
function extractPromptTokens(prompt: string): string[] {
  const cleaned = prompt
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, ' ');

  const tokens = cleaned
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));

  // Add stems or simple singulars (e.g. "buttons" -> "button", "uploading" -> "upload")
  const expanded = new Set<string>(tokens);
  for (const t of tokens) {
    if (t.endsWith('ies')) expanded.add(t.slice(0, -3) + 'y');
    else if (t.endsWith('es')) expanded.add(t.slice(0, -2));
    else if (t.endsWith('s') && !t.endsWith('ss')) expanded.add(t.slice(0, -1));
    else if (t.endsWith('ing')) expanded.add(t.slice(0, -3));
    else if (t.endsWith('ed')) expanded.add(t.slice(0, -2));
    else if (t.endsWith('er')) expanded.add(t.slice(0, -2));
  }

  return Array.from(expanded);
}

/**
 * Deterministically classifies code diff hunks against ANY prompt.
 * Evaluates token overlap, safety invariants, and structural collateral drift.
 */
export function classifyHunks(prompt: string, hunks: DiffHunk[]): DiffHunk[] {
  const promptTrimmed = prompt.trim();
  const promptTokens = extractPromptTokens(promptTrimmed);
  const pLower = promptTrimmed.toLowerCase();

  // Negative case: Empty or unguided prompt defaults to UNCERTAIN for manual inspection
  const isEmptyPrompt = promptTokens.length === 0;

  return hunks.map((hunk) => {
    const symbolLower = hunk.enclosingSymbol.toLowerCase();
    const addedText = hunk.addedLines.join(' ').toLowerCase();
    const deletedText = hunk.deletedLines.join(' ').toLowerCase();

    // 1. STRICT INVARIANT CHECK (CRITICAL SAFETY)
    // Deletion of safety, auth, errors, or timeouts MUST ALWAYS take precedence
    // Even if prompt shares words (e.g. "Update header" while deleting header auth check)
    const hasExplicitDeletionIntent =
      pLower.includes('remove') ||
      pLower.includes('delete') ||
      pLower.includes('disable') ||
      pLower.includes('drop') ||
      pLower.includes('strip');

    const symbolWords = symbolLower.split(/[^a-z0-9_-]+/).filter(Boolean);
    const addedWords = addedText.split(/[^a-z0-9_-]+/).filter(Boolean);
    const deletedWords = deletedText.split(/[^a-z0-9_-]+/).filter(Boolean);

    // Check if the prompt explicitly asked to delete/modify THIS specific item (target matching)
    const hasTargetedDeletionIntent = promptTokens.some(t => deletedWords.includes(t) || symbolWords.includes(t));

    // Check if the change is a value replacement/upgrade rather than a pure stripping
    const isValueReplacement = addedText.includes('timeout') && deletedText.includes('timeout');
    const isStorageMigration = addedText.includes('localstorage') && deletedText.includes('sessionstorage');

    const deletedCriticalSafety =
      deletedText.includes('try {') ||
      deletedText.includes('catch') ||
      (deletedText.includes('timeout') && !isValueReplacement) ||
      deletedText.includes('retries') ||
      (deletedText.includes('if (!') && !addedText.includes('if (!') && (!hasExplicitDeletionIntent || !hasTargetedDeletionIntent)) ||
      ((deletedText.includes('auth') || (deletedText.includes('session') && !isStorageMigration) || deletedText.includes('guard')) && (!hasExplicitDeletionIntent || !hasTargetedDeletionIntent)) ||
      (deletedText.includes('throw new') && !addedText.includes('throw new')) ||
      (deletedText.includes('security') && (!hasExplicitDeletionIntent || !hasTargetedDeletionIntent)) ||
      (deletedText.includes('validate') && !addedText.includes('validate') && (!hasExplicitDeletionIntent || !hasTargetedDeletionIntent));

    if (deletedCriticalSafety) {
      return {
        ...hunk,
        status: 'INVARIANT_BREACH',
        impactSummary: `Deleted critical error handling, security, or validation logic in ${hunk.enclosingSymbol || 'code'}. High regression risk!`,
        accepted: false
      };
    }

    if (isEmptyPrompt) {
      return {
        ...hunk,
        status: 'UNCERTAIN',
        impactSummary: `Empty or unguided prompt: Cannot mathematically verify intent. Manual review required.`,
        accepted: false
      };
    }

    // Ghost injection guard: If lines contain tracking/analytics and prompt did not request analytics/tracking
    const isUnrequestedTracking = (addedText.includes('analytics') || addedText.includes('track') || addedText.includes('beacon') || addedText.includes('telemetry')) &&
      !promptTokens.some(t => t.includes('analytic') || t.includes('track') || t.includes('telemetry') || t.includes('metric'));

    if (isUnrequestedTracking) {
      return {
        ...hunk,
        status: 'COLLATERAL_MUTATION',
        impactSummary: `Injected unrequested tracking or telemetry script in ${hunk.enclosingSymbol || 'code'}. Unrelated to prompt.`,
        accepted: false
      };
    }

    // 2. CHECK TOKEN OVERLAP: Does this hunk implement what the user asked for?
    const matchesEnclosingSymbol = promptTokens.some(token => symbolWords.some(w => w === token || w.startsWith(token) || token.startsWith(w)));
    const matchesAddedContent = promptTokens.some(token => addedWords.some(w => w === token || (token.length > 3 && w.includes(token))));
    const matchesDeletedContent = hasExplicitDeletionIntent && promptTokens.some(token => deletedWords.some(w => w === token || (token.length > 3 && w.includes(token))));

    // Distraction guard: If hunk only DELETED lines and prompt did not request deletion,
    // do not mark as AUTHORIZED just because of symbol name overlap!
    const isPureDeletion = hunk.addedLines.length === 0 && hunk.deletedLines.length > 0;
    const isDirectMatch = matchesAddedContent || matchesDeletedContent || (matchesEnclosingSymbol && !(isPureDeletion && !hasExplicitDeletionIntent));

    if (isDirectMatch) {
      const matchedTokens = promptTokens.filter(token => symbolWords.includes(token) || addedWords.includes(token) || deletedWords.includes(token));
      return {
        ...hunk,
        status: 'AUTHORIZED',
        impactSummary: `Directly matches prompt intent ("${matchedTokens.slice(0, 3).join(', ') || 'requested change'}") in ${hunk.enclosingSymbol || 'target'}.`,
        accepted: true
      };
    }

    // 3. COLLATERAL MUTATION CHECK: Did the AI alter or delete unrelated existing code?
    if (hunk.beforeLineCount > 0) {
      // Unrelated layout alteration
      if (symbolLower.includes('grid') || symbolLower.includes('layout') || symbolLower.includes('padding') || symbolLower.includes('margin') || symbolLower.includes('flex')) {
        return {
          ...hunk,
          status: 'COLLATERAL_MUTATION',
          impactSummary: `Silently altered layout properties in ${hunk.enclosingSymbol || 'styles'}. Unrelated to prompt.`,
          accepted: false
        };
      }

      // Unrelated function/logic alteration
      return {
        ...hunk,
        status: 'COLLATERAL_MUTATION',
        impactSummary: `Modified existing working code in ${hunk.enclosingSymbol || 'unrelated block'} with 0 prompt correlation.`,
        accepted: false
      };
    }

    // 4. SCOPE CREEP: Unrequested additions (e.g. unrequested libraries, tracking scripts, extra functions)
    return {
      ...hunk,
      status: 'SCOPE_CREEP',
      impactSummary: `Injected unrequested code or external symbol in ${hunk.enclosingSymbol || 'global scope'}.`,
      accepted: false
    };
  });
}

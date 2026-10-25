/**
 * Web Audio Feedback Synthesizer for ScopeGuard
 * Provides tactile, micro-sensory audio confirmation without external assets.
 * Zero bundle weight, 100% client-side Web Audio API.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Muted, low-frequency radar warning ping (Threat detected)
 */
export function playThreatTone(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime); // Low A
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {}
}

/**
 * Satisfying Apple Pay-style ascending dual-tone chime (Collateral Purged / 100% Clean)
 * Enhanced with subtle 60Hz mechanical sub-thud for tactile physical feedback
 */
export function playPurgeSuccessChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Sub-bass tactile thud (60Hz mechanical actuation feel)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(65, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.09);
    subGain.gain.setValueAtTime(0.18, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.09);

    // Tone 1: E5 (659 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(659.25, now + 0.02);
    gain1.gain.setValueAtTime(0.09, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now + 0.02);
    osc1.stop(now + 0.14);

    // Tone 2: A5 (880 Hz - pure fifth harmonic)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.09);
    gain2.gain.setValueAtTime(0.14, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.32);
  } catch {}
}

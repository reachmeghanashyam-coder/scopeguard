/**
 * Micro-Particle Celebration Canvas System for ScopeGuard
 * Zero external libraries. 100% Canvas API.
 * Provides tactile sensory explosion upon purging collateral code drift.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let animFrameId: number | null = null;

function ensureCanvas(): void {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'scopeguard-particle-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }
}

function resizeCanvas(): void {
  if (canvas) {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }
}

function loop(): void {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (particles.length > 0) {
    animFrameId = requestAnimationFrame(loop);
  } else {
    animFrameId = null;
  }
}

/**
 * Fires a burst of glowing cyber particles from a source element or coordinates
 */
export function spawnPurgeParticles(targetEl?: HTMLElement | null): void {
  ensureCanvas();
  if (!ctx) return;

  let originX = window.innerWidth / 2;
  let originY = window.innerHeight / 2;

  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
  }

  const COLORS = ['#00E5FF', '#00F5A0', '#30D158', '#FFFFFF', '#64D2FF'];
  const count = 45;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 7 + 2.5;

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size: Math.random() * 3 + 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 1.0,
      decay: Math.random() * 0.02 + 0.015,
      gravity: 0.12
    });
  }

  if (!animFrameId) {
    animFrameId = requestAnimationFrame(loop);
  }
}

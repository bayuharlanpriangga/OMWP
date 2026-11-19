'use client';

import React from 'react';
import {
  createDinoWorld,
  resizeDinoWorld,
  stepDinoWorld,
  type DinoActor,
  type DinoCactus,
  type DinoCloud,
  type DinoWorld,
} from '@/lib/theme/theme-types/theme-types-dino-simulation';

const DINO_RUN_A = [
  '.......DDDDDD.',
  '......DDWDDDDD',
  '......DDDDDDDD',
  '......DDDD....',
  '......DDDDDDD.',
  'D....DDDDD....',
  'D...DDDDDDD...',
  'DD.DDDDDD.D...',
  '.DDDDDDDD.....',
  '..DDDDDDD.....',
  '...DDDDD......',
  '....DD.DD.....',
  '....DD..D.....',
  '....DD........',
  '....DDD.......',
];

const DINO_RUN_B = [
  '.......DDDDDD.',
  '......DDWDDDDD',
  '......DDDDDDDD',
  '......DDDD....',
  '......DDDDDDD.',
  'D....DDDDD....',
  'D...DDDDDDD...',
  'DD.DDDDDD.D...',
  '.DDDDDDDD.....',
  '..DDDDDDD.....',
  '...DDDDD......',
  '....DD.DD.....',
  '.....D..DD....',
  '........DD....',
  '........DDD...',
];

const DINO_JUMP = [
  '.......DDDDDD.',
  '......DDWDDDDD',
  '......DDDDDDDD',
  '......DDDD....',
  '......DDDDDDD.',
  'D....DDDDD....',
  'D...DDDDDDD...',
  'DD.DDDDDD.D...',
  '.DDDDDDDD.....',
  '..DDDDDDD.....',
  '...DDDDD......',
  '....DD.DD.....',
  '....DD..DD....',
  '....D....D....',
  '..............',
];

const DINO_SHOCKED = [
  '.......DDDDDD.',
  '......DWWDDDDD',
  '......DWKDDDDD',
  '......DDDD....',
  '......DDDDDDD.',
  'D....DDDDD....',
  'D...DDDDDDD...',
  'DD.DDDDDD.D...',
  '.DDDDDDDD.....',
  '..DDDDDDD.....',
  '...DDDDD......',
  '....DD..DD....',
  '...DD....DD...',
  '..............',
  '..............',
];

const DINO_FALLEN = [
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
  '..............',
  '..DD........DD',
  'DDDDDD.DDDDDDD',
  '.DDDDDDDDDDWWD',
  '..DDDDDDDDDWKD',
  '....DD.DD.DDDD',
  '....DD..DD....',
  '..............',
  '..............',
];

const DINO_RECOVER = [
  '..............',
  '..............',
  '..............',
  '..............',
  '.......DDDDDD.',
  '......DDWDDDDD',
  '......DDDDDDDD',
  'D....DDDDDDD..',
  'DD..DDDDDD.D..',
  '.DDDDDDDD.....',
  '..DDDDDDD.....',
  '...DD..DD.....',
  '..DDD..DDD....',
  '..............',
  '..............',
];

const WING_UP = [
  '..LLL..',
  '.LLLL..',
  'LLLL...',
  '.LL....',
];

const WING_DOWN = [
  '.......',
  '.LL....',
  'LLLL...',
  '..LLL..',
];

const CLOUD_PIXELS = [
  '......OOOOOO......',
  '....OOFFFFFFOO....',
  '..OOFFFFFFFFFFO...',
  '.OFFFFFFFFFFFFFOO.',
  'OFFFFFFFFFFFFFFFFO',
  'OOOOOOOOOOOOOOOMMO',
];

const CACTUS_SMALL = [
  '...GG...',
  '.G.GG...',
  '.G.GG.G.',
  '.GGGG.G.',
  '...GGGG.',
  '...GG...',
  '...GG...',
  '...GG...',
];

const CACTUS_TALL = [
  '....GG....',
  '.G..GG....',
  '.G..GG..G.',
  '.G..GG..G.',
  '.GGGGG..G.',
  '....GGGGG.',
  '....GG....',
  '....GG....',
  '....GG....',
  '....GG....',
  '....GG....',
];

const CACTUS_CLUSTER = [
  '...GG......GG...',
  '.G.GG.G..G.GG.G.',
  '.GGGG.G..GGGG.G.',
  '...GGGG....GGGG.',
  '...GG......GG...',
  '...GG......GG...',
  '...GG......GG...',
  '...GG......GG...',
  '...GG......GG...',
];

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  cx: number,
  topY: number,
  u: number,
  flipX = false
) {
  const cols = rows[0]?.length || 0;
  const x0 = Math.round((cx - (cols * u) / 2) / u) * u;
  const y0 = Math.round(topY / u) * u;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < cols; c++) {
      const ch = row[flipX ? cols - 1 - c : c];
      const col = palette[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x0 + c * u, y0 + r * u, u, u);
    }
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, cl: DinoCloud, u: number, elapsed: number) {
  const cu = Math.max(2, Math.round(u * cl.scale));
  const shakeX =
    cl.shakeTimer > 0 ? Math.round(Math.sin(elapsed * 48) * u * 1.5) : 0;
  const shakeY =
    cl.shakeTimer > 0 ? Math.round(Math.cos(elapsed * 36) * u) : 0;
  drawMatrix(
    ctx,
    CLOUD_PIXELS,
    {
      O: '#9ca3af',
      F: '#f9fafb',
      M: '#d1d5db',
    },
    cl.x + shakeX,
    cl.y - (CLOUD_PIXELS.length * cu) / 2 + shakeY,
    cu
  );
}

function drawCactus(
  ctx: CanvasRenderingContext2D,
  cactus: DinoCactus,
  groundY: number,
  u: number,
  elapsed: number
) {
  const rows =
    cactus.variant === 'tall'
      ? CACTUS_TALL
      : cactus.variant === 'cluster'
        ? CACTUS_CLUSTER
        : CACTUS_SMALL;
  const shakeX =
    cactus.shakeTimer > 0 ? Math.round(Math.sin(elapsed * 54) * u) : 0;
  drawMatrix(
    ctx,
    rows,
    { G: '#4b5563' },
    cactus.x + shakeX,
    groundY - rows.length * u,
    u
  );
}

function drawDino(
  ctx: CanvasRenderingContext2D,
  d: DinoActor,
  u: number,
  elapsed: number
) {
  const flipX = d.dir < 0;
  const isAirborne = d.state === 'fly-launch' || d.state === 'fly-soar';
  const stepAlt = Math.floor(d.stridePhase) % 2 === 0;

  let rows = DINO_RUN_A;
  if (d.state === 'fallen') {
    rows = DINO_FALLEN;
  } else if (d.state === 'recover') {
    rows = DINO_RECOVER;
  } else if (
    d.state === 'fly-bonk' ||
    d.state === 'fly-fall' ||
    d.state === 'ground-trip'
  ) {
    rows = DINO_SHOCKED;
  } else if (d.state === 'ground-jump') {
    rows = DINO_JUMP;
  } else {
    rows = stepAlt ? DINO_RUN_A : DINO_RUN_B;
  }

  const topY = d.y - rows.length * u;
  const palette = {
    D: d.shade,
    W: d.bellyShade,
    K: '#18181b',
  };

  // Draw pixel wings when flying or launching into the sky
  if (isAirborne) {
    const wingRows = Math.floor(elapsed * 10 + d.id) % 2 === 0 ? WING_UP : WING_DOWN;
    const wingOffsetX = flipX ? u * 3 : -u * 3;
    drawMatrix(
      ctx,
      wingRows,
      { L: '#9ca3af' },
      d.x + wingOffsetX,
      topY + u * 3,
      u,
      flipX
    );
  }

  // Subtle tumble flip while falling
  const tumbleFlip =
    d.state === 'fly-fall' || d.state === 'ground-trip'
      ? Math.floor(d.rotTurns) % 2 === 0
        ? flipX
        : !flipX
      : flipX;

  drawMatrix(ctx, rows, palette, d.x, topY, u, tumbleFlip);

  // Dizzy pixel stars when fallen or recovering
  if (d.state === 'fallen' || d.state === 'recover' || d.state === 'fly-bonk') {
    const orbitY = Math.round((topY + (d.state === 'fallen' ? u * 4 : -u * 2)) / u) * u;
    const starOffset = Math.round(Math.sin(elapsed * 9 + d.id) * u * 3);
    ctx.fillStyle = '#52525b';
    ctx.fillRect(Math.round((d.x + starOffset) / u) * u, orbitY, u, u);
    ctx.fillStyle = '#71717a';
    ctx.fillRect(Math.round((d.x - starOffset) / u) * u, orbitY - u * 1.5, u, u);
  }
}

export function ThemeTypesDino() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const bgCanvas = document.createElement('canvas');
    const bgCtx = bgCanvas.getContext('2d');

    let world: DinoWorld = createDinoWorld(
      Math.max(320, window.innerWidth),
      Math.max(240, window.innerHeight)
    );
    let elapsed = 0;

    const buildStaticBackdrop = () => {
      if (!bgCtx || world.width <= 0 || world.height <= 0) return;
      bgCanvas.width = world.width;
      bgCanvas.height = world.height;
      bgCtx.imageSmoothingEnabled = false;

      const u = world.unit;
      const gY = world.groundY;

      // Stepped pixel gray sky bands (Chrome Dino monochrome atmosphere)
      const skyBands = ['#f1f3f5', '#eceef1', '#e5e7eb', '#dfe2e6'];
      const bandH = Math.ceil(gY / skyBands.length);
      skyBands.forEach((col, i) => {
        bgCtx.fillStyle = col;
        bgCtx.fillRect(0, i * bandH, world.width, bandH + 2);
      });

      // Distant stepped pixel desert mesas
      bgCtx.fillStyle = '#d4d4d8';
      const stepW = u * 6;
      for (let mx = 0; mx < world.width; mx += stepW) {
        const wave = Math.sin(mx * 0.007) * 5 + Math.cos(mx * 0.019) * 3;
        const mh = Math.max(u * 4, Math.round((world.height * 0.07 + wave * u) / u) * u);
        bgCtx.fillRect(mx, gY - mh, stepW, mh);
      }

      // Crisp sand floor below ground horizon
      bgCtx.fillStyle = '#dcdedf';
      bgCtx.fillRect(0, gY, world.width, world.height - gY);

      // Chrome Dino horizon line
      bgCtx.fillStyle = '#535353';
      bgCtx.fillRect(0, gY, world.width, u);
    };

    const handleResize = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingEnabled = false;
      resizeDinoWorld(world, w, h);
      buildStaticBackdrop();
    };

    const drawFrame = (dt: number) => {
      elapsed += dt;
      if (!prefersReducedMotion && dt > 0) {
        stepDinoWorld(world, dt);
      }

      const u = world.unit;
      const gY = world.groundY;
      ctx.imageSmoothingEnabled = false;

      if (bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0);
      }

      // Scrolling pixel horizon bumps & desert pebbles
      const bumpStep = u * 16;
      const shift = Math.round(world.scrollOffset / u) * u;
      ctx.fillStyle = '#71717a';
      for (let gx = -shift; gx < world.width + bumpStep; gx += bumpStep) {
        const bx = Math.round(gx / u) * u;
        ctx.fillRect(bx, gY - u, u * 3, u);
        ctx.fillRect(bx + u * 6, gY + u * 3, u * 2, u);
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(bx + u * 11, gY + u * 5, u * 3, u);
        ctx.fillRect(bx + u * 2, gY + u * 8, u * 2, u);
        ctx.fillStyle = '#71717a';
      }

      // Clouds
      for (const cl of world.clouds) {
        drawCloud(ctx, cl, u, elapsed);
      }

      // Cacti
      for (const cactus of world.cacti) {
        drawCactus(ctx, cactus, gY, u, elapsed);
      }

      // 4 Pixel Dinos
      for (const dino of world.dinos) {
        drawDino(ctx, dino, u, elapsed);
      }

      // Pixel dust puffs
      for (const p of world.dust) {
        ctx.fillStyle = p.shade;
        const px = Math.round(p.x / u) * u;
        const py = Math.round(p.y / u) * u;
        const ps = Math.max(u, Math.round(p.size / u) * u);
        ctx.fillRect(px, py, ps, ps);
      }
    };

    handleResize();
    drawFrame(0);
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let lastTime = 0;
    if (!prefersReducedMotion) {
      const tick = (now: number) => {
        if (now - lastTime >= 33) {
          const dt = lastTime ? Math.min(0.08, (now - lastTime) / 1000) : 0.033;
          lastTime = now;
          drawFrame(dt);
        }
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="dino-bg-canvas"
      className="tb-dino-canvas"
      aria-hidden="true"
    />
  );
}

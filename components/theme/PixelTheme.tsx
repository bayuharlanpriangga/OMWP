'use client';

import React from 'react';

interface PixelStar {
  x: number;
  y: number;
  kind: 'dot' | 'cross';
  phase: number;
  speed: number;
  yellow: boolean;
}

interface PixelCloud {
  x: number;
  y: number;
  vx: number;
  scale: number;
}

interface ScorePopup {
  x: number;
  y: number;
  life: number;
  text: string;
}

const HERO_FRAME_A = [
  '..YYYYYY..',
  '.YYYYYYYY.',
  '.YYBBBBYY.',
  '..BBBBBB..',
  '..BWWWWB..',
  '.YBBBBBBY.',
  'YYBBBBBBYY',
  '.Y.BBBB.Y.',
  '...YY.YY..',
  '..YY..YY..',
];

const HERO_FRAME_B = [
  '..YYYYYY..',
  '.YYYYYYYY.',
  '.YYBBBBYY.',
  '..BBBBBB..',
  '..BWWWWB..',
  '.YBBBBBBY.',
  '.YBBBBBBY.',
  '...BBBB...',
  '..YY..YY..',
  '.YY....YY.',
];

const SLIME_FRAME_A = [
  '...YYYY...',
  '..YYYYYY..',
  '.YYKYYKYY.',
  'YYYYYYYYYY',
  'YYYYYYYYYY',
  'BBBBBBBBBB',
];

const SLIME_FRAME_B = [
  '..........',
  '..YYYYYY..',
  '.YYKYYKYY.',
  'YYYYYYYYYY',
  'YYYYYYYYYY',
  'BBBBBBBBBB',
];

const SHIP_SPRITE = [
  '...BB.......',
  '...BBB......',
  '..BBBBYYY...',
  'YYBBBBBBBBYY',
  '..BBBBBBB...',
  '...BBB......',
];

const STAR_POWERUP = [
  '...YY...',
  '...YY...',
  '.YYYYYY.',
  'YYYYYYYY',
  '.YYKKYY.',
  '..YYYY..',
  '.YY..YY.',
  'YY....YY',
];

function drawPixelMatrix(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  palette: Record<string, string>,
  cx: number,
  topY: number,
  u: number,
  flipX = false
) {
  const cols = rows[0]?.length || 0;
  const startX = Math.round((cx - (cols * u) / 2) / u) * u;
  const startY = Math.round(topY / u) * u;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < cols; c++) {
      const ch = row[flipX ? cols - 1 - c : c];
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(startX + c * u, startY + r * u, u, u);
    }
  }
}

export function PixelTheme() {
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

    let width = 0;
    let height = 0;
    let elapsed = 0;
    let stars: PixelStar[] = [];
    let clouds: PixelCloud[] = [];
    let popups: ScorePopup[] = [];

    const hero = {
      x: 160,
      vx: 76,
      jumpOffset: 0,
      jumpTimer: 1.8,
    };

    const slime = {
      x: 680,
      vx: -46,
    };

    const ship = {
      x: -100,
      vx: 88,
    };

    const coinStates = [
      { ratioX: 0.085, ratioY: 0.36, cooldown: 0 },
      { ratioX: 0.905, ratioY: 0.31, cooldown: 0 },
      { ratioX: 0.875, ratioY: 0.56, cooldown: 0 },
      { ratioX: 0.28, ratioY: 0.77, cooldown: 0 },
      { ratioX: 0.52, ratioY: 0.77, cooldown: 0 },
      { ratioX: 0.74, ratioY: 0.77, cooldown: 0 },
    ];

    const getMetrics = (w: number, h: number) => {
      const narrow = w < 640;
      const u = narrow ? 3 : 4;
      const groundY = Math.round((h * (narrow ? 0.86 : 0.85)) / u) * u;
      return {
        narrow,
        u,
        groundY,
        moonX: Math.round((w * (narrow ? 0.14 : 0.095)) / u) * u,
        moonY: Math.round((h * (narrow ? 0.14 : 0.16)) / u) * u,
        shipY: Math.round((h * (narrow ? 0.19 : 0.13)) / u) * u,
        leftPlatX: Math.round((w * (narrow ? 0.12 : 0.085)) / u) * u,
        leftPlatY: Math.round((h * 0.45) / u) * u,
        rightPlatX: Math.round((w * (narrow ? 0.88 : 0.905)) / u) * u,
        rightPlatY: Math.round((h * 0.4) / u) * u,
        rightLowX: Math.round((w * (narrow ? 0.84 : 0.875)) / u) * u,
        rightLowY: Math.round((h * 0.64) / u) * u,
        flagX: Math.round((w * (narrow ? 0.9 : 0.93)) / u) * u,
        torchLeftX: Math.round((w * (narrow ? 0.08 : 0.055)) / u) * u,
      };
    };

    const drawBlockTile = (
      target: CanvasRenderingContext2D,
      bx: number,
      by: number,
      size: number,
      kind: 'brick' | 'question',
      u: number
    ) => {
      if (kind === 'question') {
        target.fillStyle = '#eab308';
        target.fillRect(bx, by, size, size);
        target.fillStyle = '#fde047';
        target.fillRect(bx, by, size - u, u);
        target.fillRect(bx, by, u, size - u);
        target.fillStyle = '#854d0e';
        target.fillRect(bx, by + size - u, size, u);
        target.fillRect(bx + size - u, by, u, size);
        // Pixel "?" mark
        target.fillStyle = '#08122e';
        target.fillRect(bx + u * 2, by + u * 1.5, u * 3, u);
        target.fillRect(bx + u * 4, by + u * 2.5, u, u);
        target.fillRect(bx + u * 3, by + u * 3.5, u, u);
        target.fillRect(bx + u * 3, by + u * 5, u, u);
      } else {
        target.fillStyle = '#1d4ed8';
        target.fillRect(bx, by, size, size);
        target.fillStyle = '#3b82f6';
        target.fillRect(bx, by, size - u, u);
        target.fillStyle = '#0f235c';
        target.fillRect(bx, by + size - u, size, u);
        target.fillRect(bx, by + Math.floor(size / 2), size, u);
        target.fillRect(bx + Math.floor(size / 2), by, u, Math.floor(size / 2));
        target.fillRect(bx + u, by + Math.floor(size / 2), u, Math.floor(size / 2));
      }
    };

    const buildStaticLayer = () => {
      if (!bgCtx || width <= 0 || height <= 0) return;
      bgCanvas.width = width;
      bgCanvas.height = height;
      bgCtx.imageSmoothingEnabled = false;

      const m = getMetrics(width, height);
      const u = m.u;

      // Stepped 8-bit dark blue sky gradient bands
      const skyBands = ['#060d24', '#081333', '#0b1a44', '#0f2257', '#132b6b'];
      const skyH = m.groundY;
      const bandH = Math.ceil(skyH / skyBands.length);
      skyBands.forEach((col, i) => {
        bgCtx.fillStyle = col;
        bgCtx.fillRect(0, i * bandH, width, bandH + 2);
      });

      // Pixel stars backdrop subtle dither dots
      bgCtx.fillStyle = 'rgba(250, 204, 21, 0.08)';
      for (let sy = u * 4; sy < m.groundY - u * 16; sy += u * 14) {
        for (let sx = (sy % (u * 28) === 0 ? u * 6 : u * 16); sx < width; sx += u * 28) {
          bgCtx.fillRect(sx, sy, u, u);
        }
      }

      // 8-bit Pixel Moon (yellow crescent + craters)
      const mr = (m.narrow ? 7 : 9) * u;
      for (let dy = -mr; dy <= mr; dy += u) {
        for (let dx = -mr; dx <= mr; dx += u) {
          if (dx * dx + dy * dy <= mr * mr) {
            const inner = (dx - u * 3) * (dx - u * 3) + (dy + u * 2) * (dy + u * 2) < (mr * 0.65) * (mr * 0.65);
            bgCtx.fillStyle = inner ? '#fde047' : '#eab308';
            bgCtx.fillRect(m.moonX + dx, m.moonY + dy, u, u);
          }
        }
      }

      // Stepped 8-bit mountain silhouette layer
      const mtBase = m.groundY;
      bgCtx.fillStyle = '#091538';
      const stepW = u * 6;
      for (let mx = 0; mx < width; mx += stepW) {
        const wave = Math.sin(mx * 0.008) * 10 + Math.cos(mx * 0.021) * 6;
        const mh = Math.max(u * 6, Math.round((height * 0.14 + wave * u) / u) * u);
        bgCtx.fillRect(mx, mtBase - mh, stepW, mh);
      }

      // Left & right pixel castle silhouettes with yellow windows
      const drawCastle = (cx: number, chScale: number) => {
        const cw = u * 18 * chScale;
        const ch = u * 24 * chScale;
        const top = m.groundY - ch;
        const left = Math.round((cx - cw / 2) / u) * u;
        bgCtx.fillStyle = '#0c1b44';
        bgCtx.fillRect(left, top + u * 4, cw, ch - u * 4);
        // Battlements
        for (let bx = 0; bx < cw; bx += u * 4) {
          bgCtx.fillRect(left + bx, top, u * 2, u * 4);
        }
        // Highlight blue rim
        bgCtx.fillStyle = '#1e3a8a';
        bgCtx.fillRect(left, top + u * 4, u, ch - u * 4);
        // Glowing yellow pixel windows
        bgCtx.fillStyle = '#facc15';
        bgCtx.fillRect(left + u * 4, top + u * 8, u * 2, u * 3);
        bgCtx.fillRect(left + cw - u * 6, top + u * 8, u * 2, u * 3);
        bgCtx.fillRect(left + Math.floor(cw / 2) - u, top + u * 14, u * 2, u * 4);
      };

      drawCastle(width * 0.14, 1);
      drawCastle(width * 0.86, 1);

      // Left & Right Floating Game Platforms (visible beside centered cards)
      const tile = u * 7;
      drawBlockTile(bgCtx, m.leftPlatX - tile, m.leftPlatY, tile, 'brick', u);
      drawBlockTile(bgCtx, m.leftPlatX, m.leftPlatY, tile, 'question', u);
      drawBlockTile(bgCtx, m.leftPlatX + tile, m.leftPlatY, tile, 'brick', u);

      drawBlockTile(bgCtx, m.rightPlatX - tile, m.rightPlatY, tile, 'brick', u);
      drawBlockTile(bgCtx, m.rightPlatX, m.rightPlatY, tile, 'question', u);
      drawBlockTile(bgCtx, m.rightPlatX + tile, m.rightPlatY, tile, 'brick', u);

      drawBlockTile(bgCtx, m.rightLowX - tile * 0.5, m.rightLowY, tile, 'brick', u);
      drawBlockTile(bgCtx, m.rightLowX + tile * 0.5, m.rightLowY, tile, 'brick', u);

      // 8-bit Yellow-trimmed & Dark-Blue Brick Ground Floor
      bgCtx.fillStyle = '#071029';
      bgCtx.fillRect(0, m.groundY, width, height - m.groundY);

      // Top golden-yellow turf pixel lip
      bgCtx.fillStyle = '#eab308';
      bgCtx.fillRect(0, m.groundY, width, u * 2);
      bgCtx.fillStyle = '#fde047';
      bgCtx.fillRect(0, m.groundY, width, u);
      for (let gx = 0; gx < width; gx += u * 5) {
        bgCtx.fillStyle = '#facc15';
        bgCtx.fillRect(gx, m.groundY + u * 2, u * 2, u);
      }

      // Brick pattern below turf
      const bw = u * 8;
      const bh = u * 5;
      for (let row = 0, gy = m.groundY + u * 3; gy < height; row++, gy += bh) {
        const offset = (row % 2) * (bw / 2);
        for (let gx = -bw + offset; gx < width; gx += bw) {
          bgCtx.fillStyle = '#132d73';
          bgCtx.fillRect(gx + u * 0.5, gy + u * 0.5, bw - u, bh - u);
          bgCtx.fillStyle = '#1d4ed8';
          bgCtx.fillRect(gx + u * 0.5, gy + u * 0.5, bw - u, u);
        }
      }

      // Checkpoint flagpole on right ground
      bgCtx.fillStyle = '#93c5fd';
      bgCtx.fillRect(m.flagX, m.groundY - u * 22, u, u * 22);
      bgCtx.fillStyle = '#fde047';
      bgCtx.fillRect(m.flagX - u, m.groundY - u * 24, u * 3, u * 3);

      // Left torch post
      bgCtx.fillStyle = '#92400e';
      bgCtx.fillRect(m.torchLeftX, m.groundY - u * 10, u * 2, u * 10);
      bgCtx.fillStyle = '#facc15';
      bgCtx.fillRect(m.torchLeftX - u, m.groundY - u * 11, u * 4, u * 2);
    };

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = false;

      stars = Array.from({ length: width < 640 ? 28 : 48 }, (_, i) => ({
        x: Math.random() * width,
        y: height * (0.04 + Math.random() * 0.62),
        kind: i % 4 === 0 ? 'cross' : 'dot',
        phase: Math.random() * Math.PI * 2,
        speed: 1.8 + Math.random() * 2.5,
        yellow: i % 3 !== 0,
      }));

      clouds = [
        { x: width * 0.24, y: height * 0.14, vx: 14, scale: 1 },
        { x: width * 0.58, y: height * 0.19, vx: 10, scale: 0.85 },
        { x: width * 0.82, y: height * 0.11, vx: 16, scale: 1.1 },
      ];

      hero.x = Math.max(40, width * 0.18);
      slime.x = Math.max(120, width * 0.72);
      ship.x = width * 0.35;

      buildStaticLayer();
    };

    const drawCoin = (cx: number, cy: number, u: number, tm: number, phase: number) => {
      const spin = Math.abs(Math.cos(tm * 3.8 + phase));
      const wScale = spin > 0.6 ? 4 : spin > 0.25 ? 2 : 1;
      const cw = wScale * u;
      const ch = 6 * u;
      const x0 = Math.round((cx - cw / 2) / u) * u;
      const y0 = Math.round((cy - ch / 2 + Math.sin(tm * 3 + phase) * u) / u) * u;

      ctx.fillStyle = '#b45309';
      ctx.fillRect(x0 - u * 0.5, y0, cw + u, ch);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x0, y0, cw, ch);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x0, y0, Math.max(u, cw * 0.5), ch - u);
      if (wScale >= 4) {
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(x0 + u * 1.5, y0 + u * 1.5, u, u * 3);
      }
    };

    const drawTorchFlame = (tx: number, ty: number, u: number, tm: number) => {
      const f = Math.floor(tm * 9) % 3;
      const heights = [4, 6, 5];
      const hOuter = heights[f] * u;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(tx - u, ty - hOuter, u * 4, hOuter);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(tx, ty - (hOuter - u), u * 2, Math.max(u, hOuter - u));
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(tx, ty - u * 2, u * 2, u);
    };

    const drawFrame = (dt: number) => {
      elapsed += dt;
      const tm = prefersReducedMotion ? 1.2 : elapsed;
      const m = getMetrics(width, height);
      const u = m.u;

      ctx.imageSmoothingEnabled = false;
      if (bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0);
      }

      // 1. Twinkling 8-bit pixel stars
      for (const s of stars) {
        const pulse = Math.sin(tm * s.speed + s.phase);
        if (pulse < -0.45) continue;
        const sx = Math.round(s.x / u) * u;
        const sy = Math.round(s.y / u) * u;
        ctx.fillStyle = s.yellow ? '#fde047' : '#93c5fd';
        if (s.kind === 'cross' && pulse > 0.25) {
          ctx.fillRect(sx - u, sy, u * 3, u);
          ctx.fillRect(sx, sy - u, u, u * 3);
        } else {
          ctx.fillRect(sx, sy, u, u);
        }
      }

      // 2. Drifting 8-bit pixel clouds
      for (const cl of clouds) {
        if (dt > 0 && !prefersReducedMotion) {
          cl.x += cl.vx * dt;
          if (cl.x > width + 120) cl.x = -120;
        }
        const cx = Math.round(cl.x / u) * u;
        const cy = Math.round(cl.y / u) * u;
        const cu = Math.max(2, Math.round(u * cl.scale));
        ctx.fillStyle = '#17337a';
        ctx.fillRect(cx - cu * 5, cy, cu * 12, cu * 3);
        ctx.fillRect(cx - cu * 3, cy - cu * 2, cu * 8, cu * 2);
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(cx - cu * 4, cy, cu * 10, cu);
      }

      // 3. Retro 8-bit starfighter flying across upper sky with yellow exhaust
      if (dt > 0 && !prefersReducedMotion) {
        ship.x += ship.vx * dt;
        if (ship.x > width + 100) ship.x = -100;
      }
      const shipYPos = m.shipY + Math.round(Math.sin(tm * 2.2) * 2) * u;
      drawPixelMatrix(
        ctx,
        SHIP_SPRITE,
        { B: '#3b82f6', Y: '#fde047' },
        ship.x,
        shipYPos,
        u
      );
      // Pixel exhaust sparks behind ship
      if (Math.floor(tm * 12) % 2 === 0) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(Math.round((ship.x - u * 9) / u) * u, shipYPos + u * 3, u * 2, u);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(Math.round((ship.x - u * 12) / u) * u, shipYPos + u * 3, u, u);
      }

      // 4. Fluttering yellow pixel flag on checkpoint pole
      const flagStep = Math.floor(tm * 5) % 2;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(m.flagX - u * 7, m.groundY - u * 20, u * 7, u * 5);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(m.flagX - u * (6 + flagStep), m.groundY - u * 19, u * 5, u * 3);

      // 5. Left flickering pixel torch flame
      drawTorchFlame(m.torchLeftX, m.groundY - u * 11, u, tm);

      // 6. Floating Powerup Star above right upper platform
      drawPixelMatrix(
        ctx,
        STAR_POWERUP,
        { Y: Math.floor(tm * 4) % 2 === 0 ? '#fde047' : '#facc15', K: '#08122e' },
        m.rightPlatX + u * 3.5,
        m.rightPlatY - u * 11 + Math.round(Math.sin(tm * 3.2) * 1.5) * u,
        u
      );

      // 7. Spinning golden 8-bit coins (both platform coins & ground coins)
      for (let i = 0; i < coinStates.length; i++) {
        const cs = coinStates[i];
        if (cs.cooldown > 0 && dt > 0) {
          cs.cooldown = Math.max(0, cs.cooldown - dt);
        }
        if (cs.cooldown <= 0) {
          drawCoin(width * cs.ratioX, height * cs.ratioY, u, tm, i * 1.3);
        }
      }

      // 8. Hero & Slime movement + coin collection along bottom brick ground
      if (dt > 0 && !prefersReducedMotion) {
        hero.x += hero.vx * dt;
        if (hero.x > width - 36) {
          hero.x = width - 36;
          hero.vx = -Math.abs(hero.vx);
        } else if (hero.x < 36) {
          hero.x = 36;
          hero.vx = Math.abs(hero.vx);
        }

        hero.jumpTimer -= dt;
        if (hero.jumpTimer <= 0) {
          hero.jumpTimer = 2.4 + (Math.abs(Math.sin(tm)) * 1.1);
        }
        const jumpWindow = 0.65;
        if (hero.jumpTimer > 2.4 - jumpWindow) {
          const p = (hero.jumpTimer - (2.4 - jumpWindow)) / jumpWindow;
          hero.jumpOffset = Math.sin(p * Math.PI) * (u * 11);
        } else {
          hero.jumpOffset = 0;
        }

        slime.x += slime.vx * dt;
        if (slime.x > width * 0.86) {
          slime.vx = -Math.abs(slime.vx);
        } else if (slime.x < width * 0.16) {
          slime.vx = Math.abs(slime.vx);
        }

        // Check foreground coin pickup
        for (let i = 3; i < coinStates.length; i++) {
          const cs = coinStates[i];
          if (cs.cooldown <= 0 && Math.abs(hero.x - width * cs.ratioX) < u * 6) {
            cs.cooldown = 4.2;
            popups.push({
              x: width * cs.ratioX,
              y: height * cs.ratioY - u * 4,
              life: 0.9,
              text: '+100',
            });
          }
        }
      }

      // Draw hopping yellow-blue Slime
      const slimeFrame = Math.floor(tm * 5) % 2 === 0 ? SLIME_FRAME_A : SLIME_FRAME_B;
      drawPixelMatrix(
        ctx,
        slimeFrame,
        { Y: '#facc15', B: '#1d4ed8', K: '#08122e' },
        slime.x,
        m.groundY - slimeFrame.length * u,
        u
      );

      // Draw walking/jumping Hero Knight
      const walkFrame = Math.floor(tm * 8) % 2 === 0 ? HERO_FRAME_A : HERO_FRAME_B;
      drawPixelMatrix(
        ctx,
        walkFrame,
        { Y: '#fde047', B: '#2563eb', W: '#fefce8' },
        hero.x,
        m.groundY - walkFrame.length * u - hero.jumpOffset,
        u,
        hero.vx < 0
      );

      // 9. Floating pixel "+100" popups
      for (let i = popups.length - 1; i >= 0; i--) {
        const pop = popups[i];
        if (dt > 0) {
          pop.y -= 34 * dt;
          pop.life -= dt;
        }
        if (pop.life <= 0) {
          popups.splice(i, 1);
          continue;
        }
        ctx.fillStyle = '#fef08a';
        ctx.font = `bold ${u * 3}px "Silkscreen", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(pop.text, Math.round(pop.x), Math.round(pop.y));
      }
    };

    resize();
    drawFrame(0);
    window.addEventListener('resize', resize);

    let rafId = 0;
    let lastTime = 0;
    if (!prefersReducedMotion) {
      const tick = (now: number) => {
        if (now - lastTime >= 33) {
          const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 0.033;
          lastTime = now;
          drawFrame(dt);
        }
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className="tb-pixel-canvas" aria-hidden="true" />;
}

'use client';

import React from 'react';

interface Bat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  flapSpeed: number;
  phase: number;
}

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

interface MistBand {
  x: number;
  yFrac: number;
  w: number;
  h: number;
  speed: number;
  alpha: number;
}

export function HalloweenTheme() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const sceneCanvas = document.createElement('canvas');
    const sceneCtx = sceneCanvas.getContext('2d');

    // Pre-rendered lightweight glow & mist sprites for fast software Canvas2D compositing
    const glowSprite = document.createElement('canvas');
    glowSprite.width = 96;
    glowSprite.height = 96;
    const gsCtx = glowSprite.getContext('2d');
    if (gsCtx) {
      const gg = gsCtx.createRadialGradient(48, 48, 4, 48, 48, 48);
      gg.addColorStop(0, 'rgba(251, 146, 60, 0.36)');
      gg.addColorStop(0.5, 'rgba(234, 88, 12, 0.12)');
      gg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      gsCtx.fillStyle = gg;
      gsCtx.fillRect(0, 0, 96, 96);
    }

    const mistSprite = document.createElement('canvas');
    mistSprite.width = 160;
    mistSprite.height = 40;
    const msCtx = mistSprite.getContext('2d');
    if (msCtx) {
      msCtx.save();
      msCtx.translate(80, 20);
      msCtx.scale(1, 0.25);
      const mg = msCtx.createRadialGradient(0, 0, 4, 0, 0, 80);
      mg.addColorStop(0, 'rgba(216, 180, 254, 1)');
      mg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      msCtx.fillStyle = mg;
      msCtx.beginPath();
      msCtx.arc(0, 0, 80, 0, Math.PI * 2);
      msCtx.fill();
      msCtx.restore();
    }

    let width = 0;
    let height = 0;
    let elapsed = 0;
    let bats: Bat[] = [];
    let embers: Ember[] = [];
    let mistBands: MistBand[] = [];

    const getLayout = (w: number, h: number) => {
      const narrow = w < 640;
      const moonX = w * (narrow ? 0.23 : 0.22);
      const moonY = h * (narrow ? 0.16 : 0.22);
      const moonR = Math.max(40, Math.min(82, Math.min(w, h) * 0.088));

      // Black castle perched slightly right of center on a high hill
      const castleX = w * (narrow ? 0.68 : 0.72);
      const castleBaseY = h * (narrow ? 0.72 : 0.74);
      const castleScale = Math.max(0.62, Math.min(1.18, Math.min(w, h) / 760));

      // Ground horizon line for graveyard & wrought-iron fence
      const fenceY = h * (narrow ? 0.8 : 0.79);

      // Spooky gnarled tree on the left with a prominent branch for the owl
      const leftTreeX = w * (narrow ? 0.05 : 0.08);
      const leftTreeY = fenceY + 14;
      const owlX = leftTreeX + (narrow ? 72 : 112);
      const owlY = h * (narrow ? 0.43 : 0.41);

      // Right framing gnarled tree
      const rightTreeX = w * (narrow ? 0.96 : 0.94);
      const rightTreeY = fenceY + 18;

      // Carved orange jack-o'-lanterns placed across fence pillars & graveyard foreground
      const pumpkins = [
        { x: w * (narrow ? 0.15 : 0.14), y: h * 0.85, r: narrow ? 15 : 21, phase: 0.4 },
        { x: w * (narrow ? 0.31 : 0.27), y: fenceY - 6, r: narrow ? 11 : 14, phase: 1.7 },
        { x: w * (narrow ? 0.56 : 0.53), y: h * 0.86, r: narrow ? 14 : 18, phase: 2.9 },
        { x: w * (narrow ? 0.84 : 0.85), y: h * 0.84, r: narrow ? 17 : 24, phase: 4.1 },
      ];

      // Castle windows that flicker with warm Halloween orange candlelight
      const castleWindows = [
        { x: castleX - 58 * castleScale, y: castleBaseY - 96 * castleScale, w: 10 * castleScale, h: 18 * castleScale },
        { x: castleX - 24 * castleScale, y: castleBaseY - 146 * castleScale, w: 12 * castleScale, h: 22 * castleScale },
        { x: castleX, y: castleBaseY - 196 * castleScale, w: 12 * castleScale, h: 24 * castleScale },
        { x: castleX + 26 * castleScale, y: castleBaseY - 146 * castleScale, w: 12 * castleScale, h: 22 * castleScale },
        { x: castleX + 60 * castleScale, y: castleBaseY - 98 * castleScale, w: 10 * castleScale, h: 18 * castleScale },
        { x: castleX, y: castleBaseY - 82 * castleScale, w: 22 * castleScale, h: 36 * castleScale, arch: true },
      ];

      return {
        narrow,
        moonX,
        moonY,
        moonR,
        castleX,
        castleBaseY,
        castleScale,
        fenceY,
        leftTreeX,
        leftTreeY,
        owlX,
        owlY,
        rightTreeX,
        rightTreeY,
        pumpkins,
        castleWindows,
      };
    };

    const drawGnarledTree = (
      c: CanvasRenderingContext2D,
      baseX: number,
      baseY: number,
      h: number,
      mirror: number,
      owlTarget?: { x: number; y: number }
    ) => {
      c.save();
      c.strokeStyle = '#07040a';
      c.fillStyle = '#07040a';
      c.lineCap = 'round';
      c.lineJoin = 'round';

      // Main crooked trunk
      c.beginPath();
      c.moveTo(baseX - 20 * mirror, baseY + 34);
      c.quadraticCurveTo(baseX + 8 * mirror, baseY - h * 0.16, baseX + 24 * mirror, baseY - h * 0.38);
      c.quadraticCurveTo(baseX + 46 * mirror, baseY - h * 0.52, baseX + 18 * mirror, baseY - h * 0.62);
      c.lineTo(baseX + 8 * mirror, baseY - h * 0.6);
      c.quadraticCurveTo(baseX + 26 * mirror, baseY - h * 0.48, baseX + 4 * mirror, baseY - h * 0.34);
      c.quadraticCurveTo(baseX - 10 * mirror, baseY - h * 0.14, baseX + 16 * mirror, baseY + 34);
      c.closePath();
      c.fill();

      // Reaching crooked branches
      const drawBranch = (
        x1: number,
        y1: number,
        cx1: number,
        cy1: number,
        x2: number,
        y2: number,
        lw: number
      ) => {
        c.lineWidth = lw;
        c.beginPath();
        c.moveTo(x1, y1);
        c.quadraticCurveTo(cx1, cy1, x2, y2);
        c.stroke();
      };

      // Owl perch branch (strong horizontal limb)
      if (owlTarget) {
        drawBranch(
          baseX + 16 * mirror,
          baseY - h * 0.36,
          (baseX + owlTarget.x) * 0.5,
          owlTarget.y + 12,
          owlTarget.x + 28,
          owlTarget.y + 4,
          9
        );
        drawBranch(
          owlTarget.x + 12,
          owlTarget.y + 5,
          owlTarget.x + 36,
          owlTarget.y - 12,
          owlTarget.x + 54,
          owlTarget.y - 24,
          3.5
        );
      }

      drawBranch(
        baseX + 22 * mirror,
        baseY - h * 0.42,
        baseX + 82 * mirror,
        baseY - h * 0.54,
        baseX + 138 * mirror,
        baseY - h * 0.58,
        6
      );
      drawBranch(
        baseX + 84 * mirror,
        baseY - h * 0.52,
        baseX + 115 * mirror,
        baseY - h * 0.64,
        baseX + 148 * mirror,
        baseY - h * 0.72,
        3
      );
      drawBranch(
        baseX + 14 * mirror,
        baseY - h * 0.52,
        baseX - 38 * mirror,
        baseY - h * 0.63,
        baseX - 75 * mirror,
        baseY - h * 0.7,
        5
      );
      drawBranch(
        baseX + 18 * mirror,
        baseY - h * 0.58,
        baseX + 35 * mirror,
        baseY - h * 0.7,
        baseX + 64 * mirror,
        baseY - h * 0.76,
        3.5
      );

      // Subtle cobweb between trunk & upper branch
      const wx = baseX + 32 * mirror;
      const wy = baseY - h * 0.46;
      c.strokeStyle = 'rgba(255, 224, 194, 0.14)';
      c.lineWidth = 0.8;
      for (let r = 10; r <= 34; r += 8) {
        c.beginPath();
        c.arc(wx, wy, r, mirror > 0 ? -0.3 : Math.PI - 0.9, mirror > 0 ? 1.1 : Math.PI + 0.5);
        c.stroke();
      }
      c.restore();
    };

    const drawTombstone = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      tilt: number,
      kind: 'round' | 'cross' | 'obelisk'
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(tilt);
      c.fillStyle = '#120b18';
      c.strokeStyle = 'rgba(249, 115, 22, 0.16)';
      c.lineWidth = 1;

      if (kind === 'cross') {
        c.fillRect(-w * 0.16, -h, w * 0.32, h);
        c.fillRect(-w * 0.48, -h * 0.72, w * 0.96, h * 0.18);
        c.fillRect(-w * 0.32, -8, w * 0.64, 10);
      } else if (kind === 'obelisk') {
        c.beginPath();
        c.moveTo(-w * 0.36, 0);
        c.lineTo(-w * 0.22, -h * 0.85);
        c.lineTo(0, -h * 1.05);
        c.lineTo(w * 0.22, -h * 0.85);
        c.lineTo(w * 0.36, 0);
        c.closePath();
        c.fill();
        c.stroke();
      } else {
        c.beginPath();
        c.moveTo(-w * 0.5, 0);
        c.lineTo(-w * 0.5, -h * 0.65);
        c.arc(0, -h * 0.65, w * 0.5, Math.PI, 0);
        c.lineTo(w * 0.5, 0);
        c.closePath();
        c.fill();
        c.stroke();
        // Faint carved epitaph dashes
        c.fillStyle = 'rgba(255, 215, 175, 0.14)';
        c.fillRect(-w * 0.26, -h * 0.56, w * 0.52, 2);
        c.fillRect(-w * 0.18, -h * 0.42, w * 0.36, 2);
      }
      c.restore();
    };

    const buildOffscreenScene = (w: number, h: number) => {
      if (!sceneCtx) return;
      sceneCanvas.width = w;
      sceneCanvas.height = h;
      const L = getLayout(w, h);

      // 1. Deep twilight midnight sky gradient with faint orange horizon haze
      const sky = sceneCtx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#07040b');
      sky.addColorStop(0.5, '#13091a');
      sky.addColorStop(0.82, '#220f17');
      sky.addColorStop(1, '#09050b');
      sceneCtx.fillStyle = sky;
      sceneCtx.fillRect(0, 0, w, h);

      // Faint night stars in upper sky
      for (let i = 0; i < 85; i++) {
        const sx = (i * 197.3) % w;
        const sy = (i * 89.7) % (h * 0.58);
        const sr = i % 7 === 0 ? 1.5 : 0.9;
        sceneCtx.fillStyle = i % 4 === 0 ? 'rgba(255, 224, 178, 0.48)' : 'rgba(255, 245, 235, 0.32)';
        sceneCtx.fillRect(sx, sy, sr, sr);
      }

      // 2. Luminous Full Moon & Moonlight Halo
      const halo = sceneCtx.createRadialGradient(
        L.moonX,
        L.moonY,
        L.moonR * 0.5,
        L.moonX,
        L.moonY,
        L.moonR * 4.4
      );
      halo.addColorStop(0, 'rgba(254, 243, 199, 0.44)');
      halo.addColorStop(0.32, 'rgba(251, 191, 36, 0.16)');
      halo.addColorStop(0.68, 'rgba(249, 115, 22, 0.06)');
      halo.addColorStop(1, 'rgba(9, 5, 12, 0)');
      sceneCtx.fillStyle = halo;
      sceneCtx.fillRect(
        L.moonX - L.moonR * 4.5,
        L.moonY - L.moonR * 4.5,
        L.moonR * 9,
        L.moonR * 9
      );

      // Moon disc & craters
      sceneCtx.save();
      sceneCtx.beginPath();
      sceneCtx.arc(L.moonX, L.moonY, L.moonR, 0, Math.PI * 2);
      sceneCtx.clip();

      const moonDisc = sceneCtx.createRadialGradient(
        L.moonX - L.moonR * 0.25,
        L.moonY - L.moonR * 0.25,
        L.moonR * 0.1,
        L.moonX,
        L.moonY,
        L.moonR
      );
      moonDisc.addColorStop(0, '#fffbeb');
      moonDisc.addColorStop(0.7, '#fde68a');
      moonDisc.addColorStop(1, '#f59e0b');
      sceneCtx.fillStyle = moonDisc;
      sceneCtx.fillRect(
        L.moonX - L.moonR,
        L.moonY - L.moonR,
        L.moonR * 2,
        L.moonR * 2
      );

      const craters: Array<[number, number, number]> = [
        [-0.32, -0.18, 0.19],
        [0.24, -0.28, 0.14],
        [0.18, 0.26, 0.22],
        [-0.2, 0.34, 0.12],
      ];
      sceneCtx.fillStyle = 'rgba(180, 120, 48, 0.22)';
      for (const [ox, oy, or] of craters) {
        sceneCtx.beginPath();
        sceneCtx.arc(
          L.moonX + ox * L.moonR,
          L.moonY + oy * L.moonR,
          or * L.moonR,
          0,
          Math.PI * 2
        );
        sceneCtx.fill();
      }
      sceneCtx.restore();

      // Soft feathered midnight cloud wisps (no hard geometric ellipses cutting the moon)
      const cloudSpots: Array<[number, number, number, number]> = [
        [w * 0.14, h * 0.13, w * 0.18, 36],
        [w * 0.42, h * 0.18, w * 0.22, 42],
        [w * 0.66, h * 0.14, w * 0.2, 34],
        [w * 0.86, h * 0.25, w * 0.18, 38],
        [w * 0.34, h * 0.33, w * 0.19, 34],
      ];
      for (const [cx, cy, cw, ch] of cloudSpots) {
        sceneCtx.save();
        sceneCtx.translate(cx, cy);
        sceneCtx.scale(1, ch / cw);
        const cg = sceneCtx.createRadialGradient(0, 0, cw * 0.1, 0, 0, cw);
        cg.addColorStop(0, 'rgba(22, 12, 34, 0.34)');
        cg.addColorStop(0.55, 'rgba(18, 10, 28, 0.16)');
        cg.addColorStop(1, 'rgba(12, 6, 20, 0)');
        sceneCtx.fillStyle = cg;
        sceneCtx.beginPath();
        sceneCtx.arc(0, 0, cw, 0, Math.PI * 2);
        sceneCtx.fill();
        sceneCtx.restore();
      }

      // 3. Distant Hills behind the castle
      sceneCtx.fillStyle = '#0e0713';
      sceneCtx.beginPath();
      sceneCtx.moveTo(0, h);
      sceneCtx.lineTo(0, h * 0.72);
      sceneCtx.quadraticCurveTo(w * 0.25, h * 0.65, w * 0.48, h * 0.74);
      sceneCtx.quadraticCurveTo(w * 0.72, h * 0.62, w, h * 0.71);
      sceneCtx.lineTo(w, h);
      sceneCtx.closePath();
      sceneCtx.fill();

      // 4. Black Gothic Castle ("Istana Hitam") silhouette with pointed spires & battlements
      sceneCtx.save();
      sceneCtx.translate(L.castleX, L.castleBaseY);
      sceneCtx.scale(L.castleScale, L.castleScale);

      sceneCtx.fillStyle = '#07040a';
      sceneCtx.strokeStyle = 'rgba(251, 146, 60, 0.2)';
      sceneCtx.lineWidth = 1.4;

      // Main castle body + wings + towers
      sceneCtx.beginPath();
      sceneCtx.moveTo(-108, 40);
      sceneCtx.lineTo(-108, -72);
      // Left turret roof
      sceneCtx.lineTo(-116, -72);
      sceneCtx.lineTo(-92, -138);
      sceneCtx.lineTo(-68, -72);
      sceneCtx.lineTo(-76, -72);
      // Left curtain battlement
      sceneCtx.lineTo(-46, -72);
      sceneCtx.lineTo(-46, -152);
      // Left tall spire
      sceneCtx.lineTo(-54, -152);
      sceneCtx.lineTo(-32, -238);
      sceneCtx.lineTo(-12, -152);
      sceneCtx.lineTo(-20, -152);
      // Central grand spire
      sceneCtx.lineTo(-20, -214);
      sceneCtx.lineTo(-28, -214);
      sceneCtx.lineTo(0, -310);
      sceneCtx.lineTo(28, -214);
      sceneCtx.lineTo(20, -214);
      // Right tall spire
      sceneCtx.lineTo(20, -152);
      sceneCtx.lineTo(12, -152);
      sceneCtx.lineTo(34, -236);
      sceneCtx.lineTo(54, -152);
      sceneCtx.lineTo(46, -152);
      sceneCtx.lineTo(46, -72);
      // Right turret roof
      sceneCtx.lineTo(76, -72);
      sceneCtx.lineTo(68, -72);
      sceneCtx.lineTo(94, -142);
      sceneCtx.lineTo(118, -72);
      sceneCtx.lineTo(110, -72);
      sceneCtx.lineTo(110, 40);
      sceneCtx.closePath();
      sceneCtx.fill();
      sceneCtx.stroke();

      // Spire iron crosses / finials
      sceneCtx.strokeStyle = '#07040a';
      sceneCtx.lineWidth = 2.4;
      for (const [fx, fy] of [
        [0, -310],
        [-32, -238],
        [34, -236],
        [-92, -138],
        [94, -142],
      ]) {
        sceneCtx.beginPath();
        sceneCtx.moveTo(fx, fy);
        sceneCtx.lineTo(fx, fy - 18);
        sceneCtx.moveTo(fx - 5, fy - 12);
        sceneCtx.lineTo(fx + 5, fy - 12);
        sceneCtx.stroke();
      }
      sceneCtx.restore();

      // 5. Midground Cemetery Hill & Graveyard Tombstones ("Kuburan")
      sceneCtx.fillStyle = '#0a050d';
      sceneCtx.beginPath();
      sceneCtx.moveTo(0, h);
      sceneCtx.lineTo(0, L.fenceY + 10);
      sceneCtx.quadraticCurveTo(w * 0.3, L.fenceY - 14, w * 0.58, L.fenceY + 4);
      sceneCtx.quadraticCurveTo(w * 0.82, L.fenceY - 10, w, L.fenceY + 12);
      sceneCtx.lineTo(w, h);
      sceneCtx.closePath();
      sceneCtx.fill();

      // Wrought-iron fence ("Pagar") spanning across the grounds with subtle moonlight rim & gate arch
      const fenceTop = L.fenceY - 42;
      const fenceBottom = L.fenceY + 14;
      const gateX = w * 0.62;
      sceneCtx.fillStyle = '#07040b';
      sceneCtx.fillRect(0, fenceTop + 10, w, 3);
      sceneCtx.fillRect(0, fenceBottom - 8, w, 3);
      sceneCtx.fillStyle = 'rgba(251, 146, 60, 0.14)';
      sceneCtx.fillRect(0, fenceTop + 10, w, 1);

      const postSpacing = L.narrow ? 16 : 20;
      for (let fx = 6; fx < w; fx += postSpacing) {
        // Leave an open gateway gap toward center-right path
        if (Math.abs(fx - gateX) < 26) continue;
        // Stone pillars every 7 bars
        if (Math.floor(fx / postSpacing) % 7 === 0) {
          sceneCtx.fillStyle = '#170d20';
          sceneCtx.fillRect(fx - 6, fenceTop - 8, 12, fenceBottom - fenceTop + 18);
          sceneCtx.fillRect(fx - 8, fenceTop - 11, 16, 5);
          sceneCtx.strokeStyle = 'rgba(253, 186, 116, 0.18)';
          sceneCtx.lineWidth = 1;
          sceneCtx.strokeRect(fx - 6, fenceTop - 8, 12, fenceBottom - fenceTop + 18);
        } else {
          sceneCtx.fillStyle = '#090510';
          sceneCtx.fillRect(fx - 1.5, fenceTop, 3, fenceBottom - fenceTop);
          // Pointed spear finial catching faint moonlight
          sceneCtx.fillStyle = '#140b1d';
          sceneCtx.beginPath();
          sceneCtx.moveTo(fx - 4, fenceTop + 2);
          sceneCtx.lineTo(fx, fenceTop - 8);
          sceneCtx.lineTo(fx + 4, fenceTop + 2);
          sceneCtx.closePath();
          sceneCtx.fill();
        }
      }

      // Wrought-iron gate arch + warm lantern accent
      sceneCtx.strokeStyle = '#120919';
      sceneCtx.lineWidth = 2.5;
      sceneCtx.beginPath();
      sceneCtx.arc(gateX, fenceTop + 4, 28, Math.PI, 0);
      sceneCtx.stroke();
      sceneCtx.fillStyle = '#fb923c';
      sceneCtx.beginPath();
      sceneCtx.arc(gateX, fenceTop - 20, 3, 0, Math.PI * 2);
      sceneCtx.fill();

      // Tombstones & stone crosses in foreground/midground graveyard
      const graves: Array<[number, number, number, number, number, 'round' | 'cross' | 'obelisk']> = [
        [w * 0.09, h * 0.89, 28, 46, -0.09, 'round'],
        [w * 0.21, h * 0.86, 24, 52, 0.08, 'cross'],
        [w * 0.36, h * 0.88, 22, 40, -0.06, 'round'],
        [w * 0.45, h * 0.84, 20, 48, 0.05, 'obelisk'],
        [w * 0.68, h * 0.89, 26, 54, -0.07, 'cross'],
        [w * 0.77, h * 0.85, 28, 44, 0.09, 'round'],
        [w * 0.91, h * 0.88, 24, 50, -0.05, 'cross'],
      ];
      for (const [gx, gy, gw, gh, tilt, kind] of graves) {
        drawTombstone(sceneCtx, gx, gy, gw, gh, tilt, kind);
      }

      // Foreground darker grass silhouette at very bottom
      sceneCtx.fillStyle = '#050207';
      sceneCtx.beginPath();
      sceneCtx.moveTo(0, h);
      sceneCtx.lineTo(0, h * 0.89);
      sceneCtx.quadraticCurveTo(w * 0.26, h * 0.85, w * 0.54, h * 0.9);
      sceneCtx.quadraticCurveTo(w * 0.78, h * 0.86, w, h * 0.91);
      sceneCtx.lineTo(w, h);
      sceneCtx.closePath();
      sceneCtx.fill();

      // 6. Gnarled Spooky Trees ("Pohon") framing left (with Owl branch) and right
      drawGnarledTree(sceneCtx, L.leftTreeX, L.leftTreeY, h, 1, {
        x: L.owlX,
        y: L.owlY,
      });
      drawGnarledTree(sceneCtx, L.rightTreeX, L.rightTreeY, h * 0.94, -1);

      // 7. Pumpkin silhouettes (outer shell; glowing faces & candle halos animate per frame)
      for (const p of L.pumpkins) {
        sceneCtx.save();
        sceneCtx.translate(p.x, p.y);
        // Stem
        sceneCtx.fillStyle = '#3f2e18';
        sceneCtx.fillRect(-p.r * 0.14, -p.r * 1.12, p.r * 0.28, p.r * 0.34);
        // Ribbed pumpkin orange body
        sceneCtx.fillStyle = '#ea580c';
        sceneCtx.beginPath();
        sceneCtx.ellipse(-p.r * 0.38, 0, p.r * 0.68, p.r * 0.84, 0, 0, Math.PI * 2);
        sceneCtx.ellipse(p.r * 0.38, 0, p.r * 0.68, p.r * 0.84, 0, 0, Math.PI * 2);
        sceneCtx.fill();
        sceneCtx.fillStyle = '#f97316';
        sceneCtx.beginPath();
        sceneCtx.ellipse(0, 0, p.r * 0.72, p.r * 0.9, 0, 0, Math.PI * 2);
        sceneCtx.fill();
        sceneCtx.restore();
      }
    };

    const initScene = () => {
      const parent = canvas.parentElement;
      const w = Math.max(1, parent ? parent.clientWidth : window.innerWidth);
      const h = Math.max(1, parent ? parent.clientHeight : window.innerHeight);

      width = w;
      height = h;
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      buildOffscreenScene(w, h);

      const batCount = w < 640 ? 5 : 8;
      bats = Array.from({ length: batCount }, (_, i) => ({
        x: ((i + 0.5) / batCount) * w,
        y: h * (0.12 + ((i * 37) % 34) / 100),
        vx: (i % 2 === 0 ? 1 : -1) * (32 + (i % 4) * 14),
        vy: ((i % 3) - 1) * 7,
        scale: 0.58 + (i % 4) * 0.19,
        flapSpeed: 6.5 + (i % 3) * 1.9,
        phase: i * 1.15,
      }));

      embers = Array.from({ length: w < 640 ? 22 : 38 }, (_, i) => ({
        x: Math.random() * w,
        y: h * (0.45 + Math.random() * 0.55),
        vx: -10 + Math.random() * 20,
        vy: -14 - Math.random() * 22,
        size: 1.4 + (i % 3) * 0.7,
        alpha: 0.35 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }));

      mistBands = [
        { x: 0, yFrac: 0.81, w: w * 0.48, h: 36, speed: 12, alpha: 0.08 },
        { x: w * 0.45, yFrac: 0.85, w: w * 0.52, h: 42, speed: -9, alpha: 0.07 },
        { x: w * 0.2, yFrac: 0.77, w: w * 0.4, h: 30, speed: 7, alpha: 0.06 },
      ];
    };

    const drawBat = (b: Bat, t: number) => {
      const wing = Math.sin(t * b.flapSpeed + b.phase);
      const dir = b.vx >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(b.scale * dir * 1.15, b.scale * 1.15);

      // Rich solid dusk-plum silhouette so wings remain solid against dark sky & black in front of moon
      ctx.fillStyle = '#140a1e';

      // Body & pointed ears
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.2, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(1.5, -2);
      ctx.lineTo(3.5, -6.8);
      ctx.lineTo(4.8, -2);
      ctx.moveTo(-1, -2);
      ctx.lineTo(0.8, -6.2);
      ctx.lineTo(2.2, -2);
      ctx.fill();

      // Articulated scalloped bat wings (solid fill + subtle upper moonlight rim only)
      const wy = -wing * 11;
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.quadraticCurveTo(-11, wy - 8, -23, wy);
      ctx.quadraticCurveTo(-16, wy + 5, -12, 3);
      ctx.quadraticCurveTo(-7, 6, -2, 1.5);
      ctx.moveTo(2, 0);
      ctx.quadraticCurveTo(11, wy - 8, 23, wy);
      ctx.quadraticCurveTo(16, wy + 5, 12, 3);
      ctx.quadraticCurveTo(7, 6, 2, 1.5);
      ctx.fill();

      ctx.strokeStyle = 'rgba(251, 146, 60, 0.38)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-22, wy);
      ctx.quadraticCurveTo(-11, wy - 8, -2, 0);
      ctx.moveTo(2, 0);
      ctx.quadraticCurveTo(11, wy - 8, 22, wy);
      ctx.stroke();

      ctx.restore();
    };

    const drawOwl = (ox: number, oy: number, t: number) => {
      const scale = Math.max(0.75, Math.min(1.15, Math.min(width, height) / 760));
      // Subtle head tilt & periodic blink
      const headTilt = Math.sin(t * 0.85) * 0.09;
      const blinkCycle = t % 4.6;
      const eyeOpen = blinkCycle > 4.42 && blinkCycle < 4.56 ? 0.15 : 1;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(scale, scale);

      // Torso & folded wings silhouetted on branch
      ctx.fillStyle = '#09050d';
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, -14, 13, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tail feathers hanging below branch
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(-10, 14);
      ctx.lineTo(-2, 11);
      ctx.lineTo(2, 15);
      ctx.lineTo(7, -2);
      ctx.closePath();
      ctx.fill();

      // Talons gripping the gnarled branch
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-5, 1);
      ctx.lineTo(-5, 6);
      ctx.moveTo(5, 1);
      ctx.lineTo(5, 6);
      ctx.stroke();

      // Head with horned ear tufts
      ctx.save();
      ctx.translate(0, -32);
      ctx.rotate(headTilt);

      ctx.fillStyle = '#0a0610';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Ear tufts
      ctx.beginPath();
      ctx.moveTo(-9, -4);
      ctx.lineTo(-13, -14);
      ctx.lineTo(-4, -8);
      ctx.moveTo(9, -4);
      ctx.lineTo(13, -14);
      ctx.lineTo(4, -8);
      ctx.fill();

      // Glowing amber-orange owl eyes
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.ellipse(-4.3, -1, 2.7, 2.7 * eyeOpen, 0, 0, Math.PI * 2);
      ctx.ellipse(4.3, -1, 2.7, 2.7 * eyeOpen, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(-4.3, -1, 1.1, 1.1 * eyeOpen, 0, 0, Math.PI * 2);
      ctx.ellipse(4.3, -1, 1.1, 1.1 * eyeOpen, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tiny beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-2, 2);
      ctx.lineTo(2, 2);
      ctx.lineTo(0, 5.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.restore();
    };

    const drawFrame = (dt: number) => {
      if (width <= 0 || height <= 0) return;
      elapsed += dt;
      const L = getLayout(width, height);
      const t = prefersReducedMotion ? 1.2 : elapsed;

      // 1. Blit pre-rendered moonlit castle, fence, trees, graveyard, pumpkin bodies
      if (sceneCtx) {
        ctx.drawImage(sceneCanvas, 0, 0);
      } else {
        ctx.fillStyle = '#09050d';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Flickering orange castle windows
      const winFlicker = 0.72 + 0.28 * Math.sin(t * 7.3) * Math.cos(t * 3.1);
      ctx.fillStyle = `rgba(251, 146, 60, ${0.78 * winFlicker})`;
      for (const cw of L.castleWindows) {
        if (cw.arch) {
          ctx.beginPath();
          ctx.moveTo(cw.x - cw.w * 0.5, cw.y + cw.h * 0.5);
          ctx.lineTo(cw.x - cw.w * 0.5, cw.y - cw.h * 0.15);
          ctx.arc(cw.x, cw.y - cw.h * 0.15, cw.w * 0.5, Math.PI, 0);
          ctx.lineTo(cw.x + cw.w * 0.5, cw.y + cw.h * 0.5);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(cw.x - cw.w * 0.5, cw.y - cw.h * 0.5, cw.w, cw.h);
        }
      }

      // 3. Drifting cemetery mist wisps near the fence & tombstones (fast cached sprite blit)
      for (const m of mistBands) {
        if (dt > 0) {
          m.x += m.speed * dt;
          if (m.x > width + m.w * 0.4) m.x = -m.w;
          if (m.x < -m.w) m.x = width + m.w * 0.3;
        }
        const my = height * m.yFrac;
        ctx.globalAlpha = m.alpha;
        ctx.drawImage(mistSprite, m.x, my - m.h, m.w, m.h * 2);
      }
      ctx.globalAlpha = 1;

      // 4. Perched Owl ("Burung Hantu") with blinking amber eyes
      drawOwl(L.owlX, L.owlY, t);

      // 5. Carved Jack-o'-Lantern glowing faces & warm orange candlelight spill
      for (const p of L.pumpkins) {
        const flicker = 0.78 + 0.22 * Math.sin(t * 9.5 + p.phase);
        const glowR = p.r * 3.1;
        ctx.globalAlpha = flicker;
        ctx.drawImage(glowSprite, p.x - glowR, p.y - glowR, glowR * 2, glowR * 2);
        ctx.globalAlpha = 1;

        // Glowing triangular eyes & jagged smile
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = `rgba(254, 240, 138, ${0.95 * flicker})`;
        // Left & right triangle eyes
        ctx.beginPath();
        ctx.moveTo(-p.r * 0.42, -p.r * 0.08);
        ctx.lineTo(-p.r * 0.24, -p.r * 0.34);
        ctx.lineTo(-p.r * 0.08, -p.r * 0.08);
        ctx.closePath();
        ctx.moveTo(p.r * 0.08, -p.r * 0.08);
        ctx.lineTo(p.r * 0.24, -p.r * 0.34);
        ctx.lineTo(p.r * 0.42, -p.r * 0.08);
        ctx.closePath();
        // Jagged jack-o'-lantern grin
        ctx.moveTo(-p.r * 0.44, p.r * 0.2);
        ctx.lineTo(-p.r * 0.24, p.r * 0.44);
        ctx.lineTo(-p.r * 0.08, p.r * 0.28);
        ctx.lineTo(p.r * 0.08, p.r * 0.44);
        ctx.lineTo(p.r * 0.24, p.r * 0.28);
        ctx.lineTo(p.r * 0.44, p.r * 0.2);
        ctx.quadraticCurveTo(0, p.r * 0.62, -p.r * 0.44, p.r * 0.2);
        ctx.fill();
        ctx.restore();
      }

      // 6. Flying Bats ("Kelelawar") gliding across the moonlit sky
      for (const b of bats) {
        if (dt > 0) {
          b.x += b.vx * dt;
          b.y += b.vy * dt + Math.sin(t * 2.1 + b.phase) * 0.35;
          if (b.x > width + 50) b.x = -50;
          if (b.x < -50) b.x = width + 50;
          if (b.y < height * 0.06) b.y = height * 0.06;
          if (b.y > height * 0.56) b.y = height * 0.56;
        }
        drawBat(b, t);
      }

      // 7. Floating warm orange Halloween embers
      for (const em of embers) {
        if (dt > 0) {
          em.x += em.vx * dt + Math.sin(t * 1.8 + em.phase) * 0.25;
          em.y += em.vy * dt;
          if (em.y < -10) {
            em.y = height + 10;
            em.x = Math.random() * width;
          }
          if (em.x < -10) em.x = width + 10;
          if (em.x > width + 10) em.x = -10;
        }
        const a = em.alpha * (0.65 + 0.35 * Math.sin(t * 3.1 + em.phase));
        ctx.fillStyle = `rgba(251, 146, 60, ${a})`;
        ctx.fillRect(em.x, em.y, em.size, em.size);
      }
    };

    initScene();
    drawFrame(0);

    let resizeTimer: number | null = null;
    const handleResize = () => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        initScene();
        drawFrame(0);
      }, 120);
    };
    window.addEventListener('resize', handleResize);

    if (prefersReducedMotion) {
      return () => {
        if (resizeTimer !== null) window.clearTimeout(resizeTimer);
        window.removeEventListener('resize', handleResize);
      };
    }

    let rafId = 0;
    let timerId = 0;
    let lastTick = 0;
    let disposed = false;
    const tick = (now: number) => {
      if (disposed) return;
      const dt = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 0.04;
      lastTick = now;
      drawFrame(dt);
      timerId = window.setTimeout(() => {
        if (!disposed) {
          rafId = window.requestAnimationFrame(tick);
        }
      }, 50);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      if (timerId) window.clearTimeout(timerId);
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="halloween-scene-canvas"
      aria-hidden="true"
      className="tb-halloween-canvas"
    />
  );
}

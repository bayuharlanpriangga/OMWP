'use client';

import React from 'react';

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  phase: number;
}

interface NoiseGrain {
  rx: number;
  ry: number;
  rw: number;
  rh: number;
  bright: boolean;
}

export function GhostTheme() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const roomCanvas = document.createElement('canvas');
    const roomCtx = roomCanvas.getContext('2d');

    let width = 0;
    let height = 0;
    let elapsed = 0;
    let motes: DustMote[] = [];
    const tvNoisePool: NoiseGrain[] = Array.from({ length: 70 }, () => ({
      rx: Math.random(),
      ry: Math.random(),
      rw: 0.04 + Math.random() * 0.14,
      rh: 0.025 + Math.random() * 0.06,
      bright: Math.random() > 0.38,
    }));

    // Room perspective coordinates calculated from viewport dimensions
    const getLayout = (w: number, h: number) => {
      const narrow = w < 640;
      const backLeft = w * (narrow ? 0.08 : 0.19);
      const backRight = w * (narrow ? 0.92 : 0.81);
      const backTop = h * 0.14;
      const backBottom = h * 0.72;

      const doorX = narrow ? w * 0.12 : w * 0.215;
      const doorW = Math.max(58, (backRight - backLeft) * (narrow ? 0.2 : 0.135));
      const doorTop = backTop + (backBottom - backTop) * 0.14;
      const doorH = backBottom - doorTop;

      const winX = narrow ? w * 0.72 : w * 0.67;
      const winW = Math.max(56, (backRight - backLeft) * (narrow ? 0.2 : 0.145));
      const winTop = backTop + (backBottom - backTop) * 0.13;
      const winH = (backBottom - winTop) * 0.56;

      const tvW = Math.max(66, Math.min(132, w * (narrow ? 0.2 : 0.105)));
      const tvH = tvW * 0.78;
      const tvX = narrow ? w * 0.05 : w * 0.065;
      const tvY = h * 0.65;

      const chairX = narrow ? w * 0.8 : w * 0.835;
      const chairY = h * 0.745;
      const chairScale = Math.max(0.68, Math.min(1.22, Math.min(w, h) / 760));

      return {
        narrow,
        backLeft,
        backRight,
        backTop,
        backBottom,
        doorX,
        doorW,
        doorTop,
        doorH,
        winX,
        winW,
        winTop,
        winH,
        tvX,
        tvY,
        tvW,
        tvH,
        chairX,
        chairY,
        chairScale,
      };
    };

    const drawCrack = (
      c: CanvasRenderingContext2D,
      startX: number,
      startY: number,
      segments: Array<[number, number]>,
      lineW: number,
      alpha: number
    ) => {
      c.save();
      c.strokeStyle = `rgba(6, 2, 3, ${alpha})`;
      c.lineWidth = lineW;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(startX, startY);
      let cx = startX;
      let cy = startY;
      for (const [dx, dy] of segments) {
        cx += dx;
        cy += dy;
        c.lineTo(cx, cy);
      }
      c.stroke();
      c.restore();
    };

    const buildOffscreenRoom = (w: number, h: number) => {
      if (!roomCtx) return;
      roomCanvas.width = w;
      roomCanvas.height = h;
      const L = getLayout(w, h);

      // 1. Base darkness
      roomCtx.fillStyle = '#070304';
      roomCtx.fillRect(0, 0, w, h);

      // 2. Back wall (grimy decayed plaster)
      const backGrad = roomCtx.createLinearGradient(0, L.backTop, 0, L.backBottom);
      backGrad.addColorStop(0, '#140a0c');
      backGrad.addColorStop(0.5, '#1d1012');
      backGrad.addColorStop(1, '#100709');
      roomCtx.fillStyle = backGrad;
      roomCtx.fillRect(
        L.backLeft,
        L.backTop,
        L.backRight - L.backLeft,
        L.backBottom - L.backTop
      );

      // 3. Side walls (perspective trapezoids)
      const leftWallGrad = roomCtx.createLinearGradient(0, 0, L.backLeft, 0);
      leftWallGrad.addColorStop(0, '#0a0405');
      leftWallGrad.addColorStop(1, '#180c0e');
      roomCtx.fillStyle = leftWallGrad;
      roomCtx.beginPath();
      roomCtx.moveTo(0, 0);
      roomCtx.lineTo(L.backLeft, L.backTop);
      roomCtx.lineTo(L.backLeft, L.backBottom);
      roomCtx.lineTo(0, h);
      roomCtx.closePath();
      roomCtx.fill();

      const rightWallGrad = roomCtx.createLinearGradient(L.backRight, 0, w, 0);
      rightWallGrad.addColorStop(0, '#170b0d');
      rightWallGrad.addColorStop(1, '#090304');
      roomCtx.fillStyle = rightWallGrad;
      roomCtx.beginPath();
      roomCtx.moveTo(L.backRight, L.backTop);
      roomCtx.lineTo(w, 0);
      roomCtx.lineTo(w, h);
      roomCtx.lineTo(L.backRight, L.backBottom);
      roomCtx.closePath();
      roomCtx.fill();

      // 4. Ceiling
      const ceilGrad = roomCtx.createLinearGradient(0, 0, 0, L.backTop);
      ceilGrad.addColorStop(0, '#050203');
      ceilGrad.addColorStop(1, '#110709');
      roomCtx.fillStyle = ceilGrad;
      roomCtx.beginPath();
      roomCtx.moveTo(0, 0);
      roomCtx.lineTo(w, 0);
      roomCtx.lineTo(L.backRight, L.backTop);
      roomCtx.lineTo(L.backLeft, L.backTop);
      roomCtx.closePath();
      roomCtx.fill();

      // 5. Dilapidated wooden floorboards
      const floorGrad = roomCtx.createLinearGradient(0, L.backBottom, 0, h);
      floorGrad.addColorStop(0, '#14090b');
      floorGrad.addColorStop(0.55, '#0c0506');
      floorGrad.addColorStop(1, '#050202');
      roomCtx.fillStyle = floorGrad;
      roomCtx.beginPath();
      roomCtx.moveTo(L.backLeft, L.backBottom);
      roomCtx.lineTo(L.backRight, L.backBottom);
      roomCtx.lineTo(w, h);
      roomCtx.lineTo(0, h);
      roomCtx.closePath();
      roomCtx.fill();

      // Floorboard perspective seams
      roomCtx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      roomCtx.lineWidth = 1.2;
      const plankCount = 12;
      for (let i = 0; i <= plankCount; i++) {
        const t = i / plankCount;
        const bx = L.backLeft + (L.backRight - L.backLeft) * t;
        const fx = w * (t * 1.36 - 0.18);
        roomCtx.beginPath();
        roomCtx.moveTo(bx, L.backBottom);
        roomCtx.lineTo(fx, h);
        roomCtx.stroke();
      }
      // Horizontal floorboard joints
      for (let r = 1; r <= 5; r++) {
        const p = Math.pow(r / 6, 1.35);
        const y = L.backBottom + (h - L.backBottom) * p;
        const lx = L.backLeft * (1 - p);
        const rx = L.backRight + (w - L.backRight) * p;
        roomCtx.strokeStyle = 'rgba(0, 0, 0, 0.42)';
        roomCtx.beginPath();
        roomCtx.moveTo(lx, y);
        roomCtx.lineTo(rx, y);
        roomCtx.stroke();
      }

      // 6. Grime, water stains, peeling wallpaper & cracks on walls
      const stains: Array<[number, number, number, string]> = [
        [L.backLeft + (L.backRight - L.backLeft) * 0.36, L.backTop + 40, 110, 'rgba(38, 8, 10, 0.42)'],
        [L.backLeft + (L.backRight - L.backLeft) * 0.54, L.backBottom - 30, 145, 'rgba(12, 4, 5, 0.65)'],
        [L.backLeft * 0.5, h * 0.44, 130, 'rgba(42, 7, 10, 0.35)'],
        [L.backRight + (w - L.backRight) * 0.5, h * 0.46, 125, 'rgba(34, 6, 9, 0.34)'],
      ];
      for (const [sx, sy, sr, col] of stains) {
        const g = roomCtx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        roomCtx.fillStyle = g;
        roomCtx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
      }

      // Vertical peeling wallpaper strips
      const strips = [0.1, 0.44, 0.58, 0.88];
      for (const s of strips) {
        const sx = L.backLeft + (L.backRight - L.backLeft) * s;
        const sw = 12 + (s * 17) % 14;
        const sh = 65 + (s * 95) % 85;
        roomCtx.fillStyle = 'rgba(44, 22, 24, 0.46)';
        roomCtx.beginPath();
        roomCtx.moveTo(sx, L.backTop);
        roomCtx.lineTo(sx + sw, L.backTop);
        roomCtx.lineTo(sx + sw * 0.72, L.backTop + sh);
        roomCtx.lineTo(sx + sw * 0.15, L.backTop + sh * 0.84);
        roomCtx.closePath();
        roomCtx.fill();
      }

      // Exposed brick patches on back & side walls
      roomCtx.fillStyle = 'rgba(56, 18, 20, 0.45)';
      const brickOriginX = L.backLeft + (L.backRight - L.backLeft) * 0.43;
      const brickOriginY = L.backTop + (L.backBottom - L.backTop) * 0.28;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
          if ((row + col) % 2 === 0) {
            roomCtx.fillRect(
              brickOriginX + col * 18 + (row % 2) * 8,
              brickOriginY + row * 9,
              15,
              6
            );
          }
        }
      }

      // Wall cracks
      drawCrack(
        roomCtx,
        L.backLeft + (L.backRight - L.backLeft) * 0.48,
        L.backTop + 26,
        [[12, 34], [-8, 28], [16, 44], [-5, 36], [9, 24]],
        1.6,
        0.72
      );
      drawCrack(
        roomCtx,
        L.backLeft * 0.55,
        h * 0.28,
        [[18, 26], [-10, 32], [14, 38], [6, 28]],
        1.4,
        0.65
      );
      drawCrack(
        roomCtx,
        L.backRight + (w - L.backRight) * 0.42,
        h * 0.34,
        [[-16, 30], [8, 26], [-18, 42], [-4, 24]],
        1.4,
        0.65
      );

      // Room corner structural lines & decayed baseboard
      roomCtx.strokeStyle = 'rgba(0, 0, 0, 0.72)';
      roomCtx.lineWidth = 2;
      roomCtx.strokeRect(
        L.backLeft,
        L.backTop,
        L.backRight - L.backLeft,
        L.backBottom - L.backTop
      );
      roomCtx.beginPath();
      roomCtx.moveTo(0, 0);
      roomCtx.lineTo(L.backLeft, L.backTop);
      roomCtx.moveTo(w, 0);
      roomCtx.lineTo(L.backRight, L.backTop);
      roomCtx.moveTo(0, h);
      roomCtx.lineTo(L.backLeft, L.backBottom);
      roomCtx.moveTo(w, h);
      roomCtx.lineTo(L.backRight, L.backBottom);
      roomCtx.stroke();

      // Baseboard trim
      roomCtx.fillStyle = '#0c0506';
      roomCtx.fillRect(L.backLeft, L.backBottom - 10, L.backRight - L.backLeft, 10);

      // 7. Boarded-up haunted window on the back-right wall
      roomCtx.fillStyle = '#050307';
      roomCtx.fillRect(L.winX, L.winTop, L.winW, L.winH);
      const moonWin = roomCtx.createLinearGradient(L.winX, L.winTop, L.winX, L.winTop + L.winH);
      moonWin.addColorStop(0, 'rgba(138, 32, 42, 0.32)');
      moonWin.addColorStop(0.6, 'rgba(65, 22, 32, 0.2)');
      moonWin.addColorStop(1, 'rgba(12, 4, 8, 0.1)');
      roomCtx.fillStyle = moonWin;
      roomCtx.fillRect(L.winX + 3, L.winTop + 3, L.winW - 6, L.winH - 6);

      // Window frame & mullions
      roomCtx.strokeStyle = '#1b0d0e';
      roomCtx.lineWidth = 3;
      roomCtx.strokeRect(L.winX, L.winTop, L.winW, L.winH);
      roomCtx.beginPath();
      roomCtx.moveTo(L.winX + L.winW * 0.5, L.winTop);
      roomCtx.lineTo(L.winX + L.winW * 0.5, L.winTop + L.winH);
      roomCtx.moveTo(L.winX, L.winTop + L.winH * 0.48);
      roomCtx.lineTo(L.winX + L.winW, L.winTop + L.winH * 0.48);
      roomCtx.stroke();

      // Crooked nailed wooden planks across the broken window
      const boards: Array<[number, number, number]> = [
        [0.24, -0.07, 9],
        [0.54, 0.06, 8],
        [0.82, -0.04, 9],
      ];
      for (const [ratioY, rot, bh] of boards) {
        roomCtx.save();
        roomCtx.translate(L.winX + L.winW * 0.5, L.winTop + L.winH * ratioY);
        roomCtx.rotate(rot);
        roomCtx.fillStyle = '#1d0f0d';
        roomCtx.fillRect(-L.winW * 0.62, -bh * 0.5, L.winW * 1.24, bh);
        roomCtx.strokeStyle = '#070303';
        roomCtx.lineWidth = 1;
        roomCtx.strokeRect(-L.winW * 0.62, -bh * 0.5, L.winW * 1.24, bh);
        roomCtx.restore();
      }

      // Faint eerie crimson moonlight shaft falling across floor toward rocking chair
      const shaftGrad = roomCtx.createLinearGradient(
        L.winX + L.winW * 0.4,
        L.winTop + L.winH,
        L.chairX,
        L.chairY + 55
      );
      shaftGrad.addColorStop(0, 'rgba(160, 26, 38, 0.14)');
      shaftGrad.addColorStop(0.55, 'rgba(110, 16, 26, 0.07)');
      shaftGrad.addColorStop(1, 'rgba(20, 4, 6, 0)');
      roomCtx.fillStyle = shaftGrad;
      roomCtx.beginPath();
      roomCtx.moveTo(L.winX, L.winTop + L.winH * 0.35);
      roomCtx.lineTo(L.winX + L.winW, L.winTop + L.winH * 0.35);
      roomCtx.lineTo(w * 0.94, h * 0.88);
      roomCtx.lineTo(L.winX - L.winW * 0.25, h * 0.88);
      roomCtx.closePath();
      roomCtx.fill();

      // 8. Pitch-black doorway opening on the back-left wall
      roomCtx.fillStyle = '#020102';
      roomCtx.fillRect(L.doorX, L.doorTop, L.doorW, L.doorH);

      // Doorway frame
      roomCtx.strokeStyle = '#1e0e10';
      roomCtx.lineWidth = 4;
      roomCtx.strokeRect(L.doorX, L.doorTop, L.doorW, L.doorH);

      // Half-open crooked wooden door swung inward to the left, creating a dark peeking corner on the right jamb
      roomCtx.fillStyle = '#180b0d';
      roomCtx.beginPath();
      roomCtx.moveTo(L.doorX, L.doorTop);
      roomCtx.lineTo(L.doorX + L.doorW * 0.34, L.doorTop + 10);
      roomCtx.lineTo(L.doorX + L.doorW * 0.34, L.doorTop + L.doorH - 8);
      roomCtx.lineTo(L.doorX, L.doorTop + L.doorH);
      roomCtx.closePath();
      roomCtx.fill();
      roomCtx.strokeStyle = '#2d1417';
      roomCtx.lineWidth = 1.5;
      roomCtx.stroke();
      // Recessed door panel & rusty doorknob
      roomCtx.strokeStyle = '#090304';
      roomCtx.lineWidth = 1.2;
      roomCtx.strokeRect(L.doorX + 5, L.doorTop + 20, L.doorW * 0.22, L.doorH * 0.34);
      roomCtx.strokeRect(L.doorX + 5, L.doorTop + L.doorH * 0.56, L.doorW * 0.22, L.doorH * 0.32);
      roomCtx.fillStyle = '#4a2326';
      roomCtx.beginPath();
      roomCtx.arc(L.doorX + L.doorW * 0.28, L.doorTop + L.doorH * 0.52, 2.5, 0, Math.PI * 2);
      roomCtx.fill();

      // 9. Wooden crate stand under the broken TV + trailing frayed power cord
      const crateX = L.tvX - 4;
      const crateY = L.tvY + L.tvH - 2;
      const crateW = L.tvW + 10;
      const crateH = Math.max(38, h - crateY);
      roomCtx.fillStyle = '#190c0e';
      roomCtx.fillRect(crateX, crateY, crateW, crateH);
      roomCtx.strokeStyle = '#070203';
      roomCtx.lineWidth = 1.5;
      roomCtx.strokeRect(crateX, crateY, crateW, crateH);
      roomCtx.beginPath();
      roomCtx.moveTo(crateX, crateY);
      roomCtx.lineTo(crateX + crateW, crateY + Math.min(crateH, 54));
      roomCtx.moveTo(crateX + crateW, crateY);
      roomCtx.lineTo(crateX, crateY + Math.min(crateH, 54));
      roomCtx.stroke();

      // Snaking TV cord along floor
      roomCtx.strokeStyle = '#050203';
      roomCtx.lineWidth = 2;
      roomCtx.beginPath();
      roomCtx.moveTo(L.tvX + L.tvW * 0.85, crateY + 18);
      roomCtx.bezierCurveTo(
        L.tvX + L.tvW * 1.3,
        crateY + 42,
        L.tvX + L.tvW * 1.45,
        h * 0.86,
        L.tvX + L.tvW * 1.9,
        h * 0.88
      );
      roomCtx.stroke();

      // 10. Cobweb strands in upper corners
      roomCtx.strokeStyle = 'rgba(215, 195, 195, 0.1)';
      roomCtx.lineWidth = 0.8;
      for (let i = 0; i < 6; i++) {
        roomCtx.beginPath();
        roomCtx.moveTo(0, 0);
        roomCtx.lineTo(18 + i * 24, 96 - i * 12);
        roomCtx.stroke();
      }
    };

    const drawBrokenTv = (
      L: ReturnType<typeof getLayout>,
      t: number,
      surge: number
    ) => {
      const { tvX, tvY, tvW, tvH } = L;
      const flicker =
        0.72 +
        0.2 * Math.sin(t * 19.3) +
        0.14 * Math.sin(t * 47.1) +
        surge * 0.35;
      const clampedFlicker = Math.max(0.35, Math.min(1.25, flicker));

      // Ambient static spill on floor & wall around TV
      const glowX = tvX + tvW * 0.45;
      const glowY = tvY + tvH * 0.45;
      const spillR = tvW * (1.85 + surge * 0.6);
      const spill = ctx.createRadialGradient(glowX, glowY, tvW * 0.15, glowX, glowY, spillR);
      spill.addColorStop(0, `rgba(220, 48, 56, ${0.22 * clampedFlicker})`);
      spill.addColorStop(0.42, `rgba(185, 220, 232, ${0.14 * clampedFlicker})`);
      spill.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spill;
      ctx.fillRect(glowX - spillR, glowY - spillR, spillR * 2, spillR * 2);

      ctx.save();
      // Slightly crooked busted CRT cabinet
      ctx.translate(tvX + tvW * 0.5, tvY + tvH * 0.5);
      ctx.rotate(-0.045);

      const hw = tvW * 0.5;
      const hh = tvH * 0.5;

      // Bent rabbit-ear antennas
      ctx.strokeStyle = '#3c292b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.15, -hh);
      ctx.lineTo(-hw * 0.55, -hh - tvH * 0.36);
      ctx.moveTo(hw * 0.1, -hh);
      ctx.lineTo(hw * 0.45, -hh - tvH * 0.25);
      ctx.lineTo(hw * 0.62, -hh - tvH * 0.14);
      ctx.stroke();

      // CRT Outer Casing
      ctx.fillStyle = '#1b1113';
      ctx.strokeStyle = '#080304';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-hw, -hh, tvW, tvH, 6);
      ctx.fill();
      ctx.stroke();

      // Side speaker grille + rotary dials
      const scrX = -hw + tvW * 0.08;
      const scrY = -hh + tvH * 0.12;
      const scrW = tvW * 0.68;
      const scrH = tvH * 0.76;

      // Dials on right side
      const dialX = scrX + scrW + tvW * 0.12;
      ctx.fillStyle = '#2d1c1e';
      ctx.beginPath();
      ctx.arc(dialX, -hh + tvH * 0.28, tvW * 0.055, 0, Math.PI * 2);
      ctx.arc(dialX, -hh + tvH * 0.46, tvW * 0.048, 0, Math.PI * 2);
      ctx.fill();

      // CRT Screen interior
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(scrX, scrY, scrW, scrH, 5);
      ctx.clip();

      // Screen phosphor glow base
      const scrGrad = ctx.createRadialGradient(
        scrX + scrW * 0.5,
        scrY + scrH * 0.5,
        2,
        scrX + scrW * 0.5,
        scrY + scrH * 0.5,
        scrW * 0.75
      );
      const isRedGlitch = surge > 0.35 || Math.sin(t * 23) > 0.88;
      scrGrad.addColorStop(
        0,
        isRedGlitch
          ? `rgba(255, 92, 92, ${0.86 * clampedFlicker})`
          : `rgba(225, 232, 238, ${0.78 * clampedFlicker})`
      );
      scrGrad.addColorStop(
        0.75,
        isRedGlitch
          ? `rgba(140, 18, 26, ${0.88 * clampedFlicker})`
          : `rgba(74, 88, 96, ${0.82 * clampedFlicker})`
      );
      scrGrad.addColorStop(1, 'rgba(12, 8, 10, 0.96)');
      ctx.fillStyle = scrGrad;
      ctx.fillRect(scrX, scrY, scrW, scrH);

      // Animated static snow grains
      const shift = Math.floor(t * 36);
      for (let i = 0; i < tvNoisePool.length; i++) {
        const g = tvNoisePool[(i + shift) % tvNoisePool.length];
        const gx = scrX + ((g.rx + Math.sin(t * 17 + i) * 0.35 + 1) % 1) * scrW;
        const gy = scrY + ((g.ry + Math.cos(t * 29 + i) * 0.35 + 1) % 1) * scrH;
        ctx.fillStyle = g.bright
          ? isRedGlitch
            ? 'rgba(255, 210, 210, 0.68)'
            : 'rgba(255, 255, 255, 0.62)'
          : 'rgba(12, 8, 10, 0.72)';
        ctx.fillRect(gx, gy, g.rw * scrW, Math.max(1.5, g.rh * scrH));
      }

      // Rolling horizontal VHS tear bar
      const tearY = scrY + ((t * 42) % (scrH + 14)) - 7;
      ctx.fillStyle = isRedGlitch
        ? 'rgba(220, 38, 38, 0.55)'
        : 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(scrX, tearY, scrW, 4);

      // Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      for (let sy = scrY; sy < scrY + scrH; sy += 3) {
        ctx.fillRect(scrX, sy, scrW, 1);
      }

      // Cracked glass fracture lines on top of CRT screen
      ctx.strokeStyle = 'rgba(12, 4, 6, 0.88)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(scrX + scrW * 0.76, scrY + scrH * 0.18);
      ctx.lineTo(scrX + scrW * 0.56, scrY + scrH * 0.44);
      ctx.lineTo(scrX + scrW * 0.42, scrY + scrH * 0.78);
      ctx.moveTo(scrX + scrW * 0.56, scrY + scrH * 0.44);
      ctx.lineTo(scrX + scrW * 0.86, scrY + scrH * 0.58);
      ctx.moveTo(scrX + scrW * 0.56, scrY + scrH * 0.44);
      ctx.lineTo(scrX + scrW * 0.26, scrY + scrH * 0.36);
      ctx.stroke();

      ctx.restore();
      ctx.restore();
    };

    const drawRockingChair = (L: ReturnType<typeof getLayout>, t: number) => {
      const { chairX, chairY, chairScale } = L;
      // Smooth eerie rocking motion with subtle pause at extremes
      const rockAngle =
        Math.sin(t * 1.45) * 0.115 + Math.sin(t * 2.9 + 0.6) * 0.014;

      ctx.save();
      ctx.translate(chairX, chairY);
      ctx.scale(chairScale, chairScale);

      // Ground contact shadow shifting slightly as chair rocks
      ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
      ctx.beginPath();
      ctx.ellipse(rockAngle * 42, 4, 46, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pivot around rocker contact point
      ctx.rotate(rockAngle);

      // Curved bottom rocker runners
      ctx.strokeStyle = '#421e21';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-42, -6);
      ctx.quadraticCurveTo(0, 11, 44, -5);
      ctx.stroke();

      // Rear & front legs
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-18, -38);
      ctx.moveTo(20, 0);
      ctx.lineTo(18, -36);
      ctx.stroke();

      // Seat frame catching dim crimson moonlight edge
      ctx.fillStyle = '#2d1416';
      ctx.strokeStyle = '#4e2428';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-25, -38);
      ctx.lineTo(25, -36);
      ctx.lineTo(21, -31);
      ctx.lineTo(-23, -33);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tall slatted backrest tilted slightly backward
      ctx.strokeStyle = '#462023';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(-20, -38);
      ctx.lineTo(-30, -108);
      ctx.moveTo(-3, -37);
      ctx.lineTo(-11, -106);
      ctx.stroke();

      // Inner spindles
      ctx.strokeStyle = '#38181b';
      ctx.lineWidth = 2.2;
      for (const frac of [0.3, 0.52, 0.74]) {
        const bx = -20 + 17 * frac;
        const tx = -30 + 19 * frac;
        ctx.beginPath();
        ctx.moveTo(bx, -38);
        ctx.lineTo(tx, -106);
        ctx.stroke();
      }

      // Top curved crest rail
      ctx.strokeStyle = '#53262a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-34, -107);
      ctx.quadraticCurveTo(-20, -115, -7, -105);
      ctx.stroke();

      // Armrest
      ctx.strokeStyle = '#462023';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-25, -67);
      ctx.lineTo(15, -63);
      ctx.lineTo(18, -36);
      ctx.stroke();

      ctx.restore();
    };

    const drawGhost = (
      L: ReturnType<typeof getLayout>,
      t: number
    ): number => {
      // 9.5s deterministic haunted cycle:
      // 0.0 - 3.6s : Peeking out slowly from the right corner of the doorway
      // 3.6 - 4.4s : Slips back into shadow
      // 4.4 - 5.15s: Suddenly darts rapidly across the room!
      // 5.8 - 8.4s : Second eerie low peek at doorway edge
      const cycle = t % 9.5;
      let surge = 0;

      // Helper to render eerie gaunt spectral figure & wispy shroud
      const drawSpectralFigure = (
        gx: number,
        gy: number,
        scale: number,
        alpha: number,
        lean: number,
        trailDir: number
      ) => {
        if (alpha <= 0.01) return;
        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(lean);
        ctx.scale(scale, scale);

        // Motion-blur spectral streaks when darting rapidly
        if (trailDir !== 0) {
          for (let k = 1; k <= 5; k++) {
            ctx.fillStyle = `rgba(218, 202, 206, ${alpha * (0.24 / k)})`;
            ctx.beginPath();
            ctx.ellipse(
              -trailDir * k * 28,
              10 + k * 1.5,
              28 + k * 10,
              48 - k * 3,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }

        // Outer translucent spectral mist aura
        const aura = ctx.createRadialGradient(0, 8, 4, 0, 14, 68);
        aura.addColorStop(0, `rgba(225, 210, 214, ${alpha * 0.28})`);
        aura.addColorStop(0.55, `rgba(175, 24, 34, ${alpha * 0.14})`);
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 14, 68, 0, Math.PI * 2);
        ctx.fill();

        // Tattered shroud / elongated floating cloak
        const shroud = ctx.createLinearGradient(0, -18, 0, 92);
        shroud.addColorStop(0, `rgba(195, 182, 188, ${alpha * 0.72})`);
        shroud.addColorStop(0.45, `rgba(98, 78, 84, ${alpha * 0.45})`);
        shroud.addColorStop(1, 'rgba(20, 8, 10, 0)');
        ctx.fillStyle = shroud;
        ctx.beginPath();
        ctx.moveTo(-15, -6);
        ctx.quadraticCurveTo(0, -18, 15, -6);
        ctx.lineTo(25, 84);
        ctx.lineTo(13, 66);
        ctx.lineTo(4, 90);
        ctx.lineTo(-6, 68);
        ctx.lineTo(-17, 88);
        ctx.lineTo(-24, 62);
        ctx.closePath();
        ctx.fill();

        // Tall gaunt spectral face fading softly at chin
        const faceGrad = ctx.createRadialGradient(0, -24, 2, 0, -22, 18);
        faceGrad.addColorStop(0, `rgba(232, 220, 224, ${alpha * 0.86})`);
        faceGrad.addColorStop(0.68, `rgba(182, 165, 170, ${alpha * 0.65})`);
        faceGrad.addColorStop(1, `rgba(60, 42, 46, ${alpha * 0.12})`);
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.moveTo(-11, -34);
        ctx.quadraticCurveTo(0, -42, 11, -34);
        ctx.quadraticCurveTo(13, -18, 7, -7);
        ctx.quadraticCurveTo(0, -3, -7, -7);
        ctx.quadraticCurveTo(-13, -18, -11, -34);
        ctx.closePath();
        ctx.fill();

        // Long unkempt shadowy hair strands framing face asymmetrically & draping down shoulders
        ctx.fillStyle = `rgba(10, 4, 6, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.moveTo(-14, -28);
        ctx.quadraticCurveTo(0, -45, 14, -28);
        ctx.lineTo(19, 12);
        ctx.lineTo(14, 20);
        ctx.lineTo(11, -21);
        ctx.lineTo(5, -28);
        ctx.lineTo(-1, -16);
        ctx.lineTo(-4, -28);
        ctx.lineTo(-11, -22);
        ctx.lineTo(-14, 18);
        ctx.lineTo(-19, 8);
        ctx.closePath();
        ctx.fill();

        // Deep hollow sunken eye sockets
        ctx.fillStyle = `rgba(4, 1, 2, ${alpha * 0.96})`;
        ctx.beginPath();
        ctx.ellipse(-4.6, -21, 3.1, 4.2, -0.16, 0, Math.PI * 2);
        ctx.ellipse(4.6, -21, 3.1, 4.2, 0.16, 0, Math.PI * 2);
        ctx.fill();

        // Faint eerie blood-red eye pinpoints staring out from the hollows
        ctx.fillStyle = `rgba(255, 78, 78, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(-4.6, -21, 1.0, 0, Math.PI * 2);
        ctx.arc(4.6, -21, 1.0, 0, Math.PI * 2);
        ctx.fill();

        // Faint sunken jaw shadow
        ctx.fillStyle = `rgba(16, 6, 8, ${alpha * 0.42})`;
        ctx.fillRect(-1.5, -12, 3, 2);

        ctx.restore();
      };

      const jambX = L.doorX + L.doorW;
      const peekBaseY = L.doorTop + L.doorH * 0.44;
      const gScale = Math.max(0.76, Math.min(1.3, L.doorH / 250));

      if (cycle < 3.6) {
        // Behavior 1: Peeking at doorway corner (clips cleanly against wall outside doorway!)
        const p =
          cycle < 0.75
            ? cycle / 0.75
            : cycle > 3.0
              ? (3.6 - cycle) / 0.6
              : 1;
        const ease = Math.sin(Math.max(0, Math.min(1, p)) * Math.PI * 0.5);
        const shiver = Math.sin(t * 14) * 1.1;

        ctx.save();
        ctx.beginPath();
        ctx.rect(L.doorX, L.doorTop, L.doorW, L.doorH);
        ctx.clip();

        drawSpectralFigure(
          jambX + 12 - ease * 24 + shiver,
          peekBaseY,
          gScale,
          0.9 * ease,
          -0.22 * ease,
          0
        );
        ctx.restore();

        // Slender pale clawed fingers wrapping onto the outer right doorway jamb
        if (ease > 0.25) {
          ctx.save();
          ctx.strokeStyle = `rgba(205, 188, 192, ${0.78 * ease})`;
          ctx.lineWidth = 2.1;
          ctx.lineCap = 'round';
          for (let f = 0; f < 4; f++) {
            const fy = peekBaseY + 14 + f * 5.2;
            ctx.beginPath();
            ctx.moveTo(jambX - 2, fy);
            ctx.quadraticCurveTo(jambX + 5 * ease, fy - 1, jambX + 8 * ease, fy + 2);
            ctx.stroke();
          }
          ctx.restore();
        }
      } else if (cycle >= 4.4 && cycle < 5.15) {
        // Behavior 2: Suddenly darts rapidly across the room!
        const dashP = (cycle - 4.4) / 0.75;
        const dartEase = 1 - Math.pow(1 - dashP, 2.2);
        const startX = jambX - 10;
        const endX = L.backRight + (width - L.backRight) * 0.35;
        const gx = startX + (endX - startX) * dartEase;
        const gy = L.doorTop + L.doorH * 0.5 + Math.sin(dashP * Math.PI * 3) * 8;
        const alpha = Math.sin(dashP * Math.PI) * 0.94;
        surge = Math.sin(dashP * Math.PI) * 0.85;

        drawSpectralFigure(gx, gy, gScale * 1.12, alpha, 0.3, 1);
      } else if (cycle >= 5.9 && cycle < 8.6) {
        // Behavior 3: Low creepy doorway peek
        const p =
          cycle < 6.5
            ? (cycle - 5.9) / 0.6
            : cycle > 8.0
              ? (8.6 - cycle) / 0.6
              : 1;
        const ease = Math.sin(Math.max(0, Math.min(1, p)) * Math.PI * 0.5);

        ctx.save();
        ctx.beginPath();
        ctx.rect(L.doorX, L.doorTop, L.doorW, L.doorH);
        ctx.clip();

        drawSpectralFigure(
          jambX + 14 - ease * 21,
          L.doorTop + L.doorH * 0.64,
          gScale * 0.94,
          0.78 * ease,
          -0.3 * ease,
          0
        );
        ctx.restore();
      }

      return surge;
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

      buildOffscreenRoom(w, h);

      const moteCount = w < 640 ? 28 : 54;
      motes = Array.from({ length: moteCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 6,
        vy: -3 - Math.random() * 6,
        r: 0.7 + Math.random() * 1.4,
        alpha: 0.14 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const drawFrame = (dt: number) => {
      if (width <= 0 || height <= 0) return;
      elapsed += dt;
      const L = getLayout(width, height);

      // 1. Blit pre-rendered dilapidated abandoned room
      if (roomCtx) {
        ctx.drawImage(roomCanvas, 0, 0);
      } else {
        ctx.fillStyle = '#080405';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Rocking chair moving in the background
      drawRockingChair(L, prefersReducedMotion ? 0.8 : elapsed);

      // 3. Ghost peeking at doorway corner / suddenly darting across
      const ghostSurge = drawGhost(L, prefersReducedMotion ? 1.8 : elapsed);

      // 4. Broken CRT TV turned on with static flicker
      drawBrokenTv(L, elapsed, ghostSurge);

      // 5. Hanging ceiling bulb cord + eerie blood-dim flicker
      const sway = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.9) * 0.04;
      const bulbFlicker =
        ghostSurge > 0.2
          ? Math.abs(Math.sin(elapsed * 52)) * 0.45
          : Math.sin(elapsed * 7.3) > 0.82
            ? 0.65
            : 0.28;
      ctx.save();
      ctx.translate(width * 0.52, 0);
      ctx.rotate(sway);
      ctx.strokeStyle = '#1b0d0e';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, height * 0.085);
      ctx.stroke();
      ctx.fillStyle = `rgba(220, 46, 46, ${0.4 + bulbFlicker * 0.5})`;
      ctx.beginPath();
      ctx.arc(0, height * 0.085 + 4, 3.5, 0, Math.PI * 2);
      ctx.fill();
      const bulbGlow = ctx.createRadialGradient(
        0,
        height * 0.085 + 4,
        2,
        0,
        height * 0.085 + 4,
        140
      );
      bulbGlow.addColorStop(0, `rgba(185, 28, 28, ${0.14 * bulbFlicker})`);
      bulbGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bulbGlow;
      ctx.fillRect(-140, height * 0.085 - 136, 280, 280);
      ctx.restore();

      // 6. Floating dust motes in dilapidated air
      for (const m of motes) {
        if (dt > 0) {
          m.x += m.vx * dt + Math.sin(elapsed + m.phase) * 0.15;
          m.y += m.vy * dt;
          if (m.y < -8) {
            m.y = height + 8;
            m.x = Math.random() * width;
          }
          if (m.x < -8) m.x = width + 8;
          if (m.x > width + 8) m.x = -8;
        }
        const a = m.alpha * (0.65 + 0.35 * Math.sin(elapsed * 1.4 + m.phase));
        ctx.fillStyle = `rgba(235, 200, 200, ${a})`;
        const sz = m.r * 1.8;
        ctx.fillRect(m.x, m.y, sz, sz);
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
      }, 36);
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
      data-testid="ghost-haunted-canvas"
      aria-hidden="true"
      className="tb-ghost-canvas"
    />
  );
}

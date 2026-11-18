'use client';

import React from 'react';
import {
  createCyberpunkWorld,
  getCyberpunkRailY,
  resizeCyberpunkWorld,
  stepCyberpunkWorld,
  type CyberpunkBillboard,
  type CyberpunkBuilding,
  type CyberpunkSpinner,
  type CyberpunkWorld,
} from '@/lib/theme/theme-types/theme-types-cyberpunk-simulation';

export function ThemeTypesCyberpunk() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const skyCanvas = document.createElement('canvas');
    const skyCtx = skyCanvas.getContext('2d');

    const getSize = () => {
      const parent = canvas.parentElement;
      return {
        w: Math.max(1, parent ? parent.clientWidth : window.innerWidth),
        h: Math.max(1, parent ? parent.clientHeight : window.innerHeight),
      };
    };

    const buildSkyCache = (w: number, h: number) => {
      if (!skyCtx) return;
      skyCanvas.width = w;
      skyCanvas.height = h;

      // 1. Deep night-violet metropolis sky
      const sky = skyCtx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#04020a');
      sky.addColorStop(0.42, '#0b0519');
      sky.addColorStop(0.76, '#180931');
      sky.addColorStop(1, '#090414');
      skyCtx.fillStyle = sky;
      skyCtx.fillRect(0, 0, w, h);

      // 2. Faint upper night stars
      for (let i = 0; i < 64; i++) {
        const sx = ((i * 211.7) % w);
        const sy = ((i * 73.3) % (h * 0.45));
        const sz = i % 6 === 0 ? 1.5 : 0.9;
        skyCtx.fillStyle =
          i % 4 === 0
            ? 'rgba(232, 121, 249, 0.36)'
            : 'rgba(243, 232, 255, 0.28)';
        skyCtx.fillRect(sx, sy, sz, sz);
      }

      // 3. Soft neon smog & synth-moon halo behind skyline
      const orbX = w * 0.72;
      const orbY = h * 0.36;
      const orbR = Math.max(46, Math.min(96, Math.min(w, h) * 0.11));

      const halo = skyCtx.createRadialGradient(
        orbX,
        orbY,
        orbR * 0.2,
        orbX,
        orbY,
        orbR * 3.8
      );
      halo.addColorStop(0, 'rgba(255, 42, 133, 0.22)');
      halo.addColorStop(0.4, 'rgba(168, 85, 247, 0.12)');
      halo.addColorStop(1, 'rgba(9, 4, 20, 0)');
      skyCtx.fillStyle = halo;
      skyCtx.fillRect(0, 0, w, h);

      skyCtx.save();
      skyCtx.beginPath();
      skyCtx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
      skyCtx.clip();
      const orbGrad = skyCtx.createLinearGradient(0, orbY - orbR, 0, orbY + orbR);
      orbGrad.addColorStop(0, 'rgba(252, 238, 10, 0.22)');
      orbGrad.addColorStop(0.45, 'rgba(255, 42, 133, 0.26)');
      orbGrad.addColorStop(1, 'rgba(168, 85, 247, 0.14)');
      skyCtx.fillStyle = orbGrad;
      skyCtx.fillRect(orbX - orbR, orbY - orbR, orbR * 2, orbR * 2);

      // Horizontal synthwave scan slices across lower half of orb
      skyCtx.fillStyle = '#0e061e';
      for (let sy = orbY + orbR * 0.08; sy < orbY + orbR; sy += 9) {
        const sliceH = Math.max(1.5, ((sy - orbY) / orbR) * 4.5);
        skyCtx.fillRect(orbX - orbR, sy, orbR * 2, sliceH);
      }
      skyCtx.restore();

      // 4. Lower city neon mist glow (purple left, magenta right)
      const leftGlow = skyCtx.createRadialGradient(
        w * 0.22,
        h * 0.8,
        10,
        w * 0.22,
        h * 0.8,
        w * 0.48
      );
      leftGlow.addColorStop(0, 'rgba(168, 85, 247, 0.24)');
      leftGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
      skyCtx.fillStyle = leftGlow;
      skyCtx.fillRect(0, 0, w, h);

      const rightGlow = skyCtx.createRadialGradient(
        w * 0.8,
        h * 0.78,
        10,
        w * 0.8,
        h * 0.78,
        w * 0.46
      );
      rightGlow.addColorStop(0, 'rgba(255, 42, 133, 0.2)');
      rightGlow.addColorStop(1, 'rgba(255, 42, 133, 0)');
      skyCtx.fillStyle = rightGlow;
      skyCtx.fillRect(0, 0, w, h);
    };

    const initialSize = getSize();
    const world: CyberpunkWorld = createCyberpunkWorld(
      initialSize.w,
      initialSize.h
    );

    const syncCanvasSize = () => {
      const { w, h } = getSize();
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      buildSkyCache(w, h);
      resizeCyberpunkWorld(world, w, h);
    };

    const drawBillboard = (
      bx: number,
      by: number,
      bw: number,
      bh: number,
      bb: CyberpunkBillboard,
      t: number
    ) => {
      const pulse = 0.65 + 0.35 * Math.sin(t * 3.1 + bb.phase);
      ctx.save();
      ctx.fillStyle = 'rgba(10, 5, 22, 0.92)';
      ctx.fillRect(bx, by, bw, bh);

      ctx.strokeStyle = bb.color;
      ctx.globalAlpha = 0.5 + 0.4 * pulse;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(bx, by, bw, bh);

      if (bb.pattern === 'bars') {
        const bars = 6;
        const gap = 3;
        const barW = Math.max(2, (bw - 8 - gap * (bars - 1)) / bars);
        ctx.fillStyle = bb.color;
        for (let i = 0; i < bars; i++) {
          const frac = 0.28 + 0.65 * Math.abs(Math.sin(t * 4.2 + bb.phase + i * 0.9));
          const curH = (bh - 8) * frac;
          ctx.fillRect(
            bx + 4 + i * (barW + gap),
            by + bh - 4 - curH,
            barW,
            curH
          );
        }
      } else if (bb.pattern === 'grid') {
        const scanY = by + 3 + ((t * 24 + bb.phase * 10) % Math.max(4, bh - 6));
        ctx.fillStyle = bb.color;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(bx + 3, by + 4, bw - 6, 3);
        ctx.fillRect(bx + 3, by + 10, (bw - 6) * 0.68, 2);
        ctx.globalAlpha = 0.9;
        ctx.fillRect(bx + 2, scanY, bw - 4, 2);
      } else if (bb.pattern === 'pulse') {
        ctx.fillStyle = bb.color;
        ctx.globalAlpha = 0.3 + 0.55 * pulse;
        ctx.fillRect(bx + 4, by + 4, bw - 8, bh - 8);
        ctx.fillStyle = '#090612';
        ctx.fillRect(bx + 8, by + bh * 0.42, bw - 16, 3);
      } else {
        // Animated scrolling cyber chevrons
        ctx.beginPath();
        ctx.rect(bx + 2, by + 2, bw - 4, bh - 4);
        ctx.clip();
        ctx.strokeStyle = bb.color;
        ctx.lineWidth = 2;
        const shift = (t * 28 + bb.phase * 12) % 14;
        for (let cx = bx - 14 + shift; cx < bx + bw + 14; cx += 14) {
          ctx.beginPath();
          ctx.moveTo(cx, by + bh - 3);
          ctx.lineTo(cx + 6, by + 3);
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const drawBuilding = (
      b: CyberpunkBuilding,
      drawX: number,
      h: number,
      t: number
    ) => {
      const bh = Math.round(b.hFrac * h);
      const topY = h - bh;

      const bodyFill =
        b.layer === 0 ? '#0d061d' : b.layer === 1 ? '#120826' : '#080312';
      const rimAlpha = b.layer === 0 ? 0.25 : b.layer === 1 ? 0.55 : 0.72;

      // Building silhouette
      ctx.fillStyle = bodyFill;
      ctx.fillRect(drawX, topY, b.w, bh);

      // Subtle vertical edge neon highlight on left/top edge
      ctx.fillStyle = b.accentColor;
      ctx.globalAlpha = rimAlpha;
      ctx.fillRect(drawX, topY, b.w, b.layer === 2 ? 2.5 : 1.5);
      ctx.globalAlpha = rimAlpha * 0.42;
      ctx.fillRect(drawX, topY, 1.5, bh);
      ctx.globalAlpha = 1;

      // Roof architectural details
      if (b.roofStyle === 'stepped') {
        const tierW = Math.round(b.w * 0.62);
        const tierH = b.layer === 2 ? 10 : 18;
        const tierX = drawX + Math.round((b.w - tierW) * 0.5);
        ctx.fillStyle = bodyFill;
        ctx.fillRect(tierX, topY - tierH, tierW, tierH);
        ctx.fillStyle = b.accentColor;
        ctx.globalAlpha = rimAlpha;
        ctx.fillRect(tierX, topY - tierH, tierW, 1.5);
        ctx.globalAlpha = 1;
      } else if (b.roofStyle === 'spire') {
        const spireH = b.layer === 0 ? 34 : b.layer === 1 ? 26 : 16;
        const sx = drawX + b.w * 0.5;
        ctx.strokeStyle = bodyFill;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, topY);
        ctx.lineTo(sx, topY - spireH);
        ctx.stroke();

        if (b.hasBeacon) {
          const blink = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.8 + b.beaconPhase));
          ctx.fillStyle = b.accentColor;
          ctx.globalAlpha = blink;
          ctx.beginPath();
          ctx.arc(sx, topY - spireH, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else if (b.roofStyle === 'antenna') {
        const ax1 = drawX + b.w * 0.28;
        const ax2 = drawX + b.w * 0.72;
        ctx.strokeStyle = '#1b0d36';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax1, topY);
        ctx.lineTo(ax1, topY - 18);
        ctx.moveTo(ax2, topY);
        ctx.lineTo(ax2, topY - 12);
        ctx.stroke();
        if (b.hasBeacon) {
          const blink = Math.sin(t * 3.4 + b.beaconPhase) > 0.1 ? 0.9 : 0.2;
          ctx.fillStyle = '#ff2a85';
          ctx.globalAlpha = blink;
          ctx.fillRect(ax1 - 1.5, topY - 20, 3, 3);
          ctx.globalAlpha = 1;
        }
      } else if (b.roofStyle === 'dome') {
        ctx.fillStyle = bodyFill;
        ctx.beginPath();
        ctx.arc(drawX + b.w * 0.5, topY, b.w * 0.24, Math.PI, 0);
        ctx.fill();
      }

      // Lit cyber window grid (skip for very low foreground roofs if needed, keep subtle)
      const padX = 8;
      const padY = 12;
      const usableW = b.w - padX * 2;
      const usableH = bh - padY * 2;
      if (usableW > 14 && usableH > 20) {
        const cellW = usableW / b.windowCols;
        const cellH = b.layer === 2 ? 12 : 11;
        const winW = Math.max(2, Math.min(5, cellW * 0.48));
        const winH = 4;
        const maxRows = Math.min(b.windowRows, Math.floor(usableH / cellH));
        for (let r = 0; r < maxRows; r++) {
          for (let c = 0; c < b.windowCols; c++) {
            const hash = (b.windowSeed + r * 31 + c * 17) % 19;
            if (hash > 6) continue;
            const wx = drawX + padX + c * cellW + (cellW - winW) * 0.5;
            const wy = topY + padY + r * cellH;
            const shimmer =
              hash === 0
                ? 0.35 + 0.55 * Math.abs(Math.sin(t * 1.9 + b.beaconPhase + r))
                : b.layer === 0
                  ? 0.22
                  : b.layer === 1
                    ? 0.42
                    : 0.32;
            ctx.fillStyle =
              hash === 1
                ? '#fcee0a'
                : hash % 2 === 0
                  ? '#c084fc'
                  : '#ff2a85';
            ctx.globalAlpha = shimmer;
            ctx.fillRect(wx, wy, winW, winH);
          }
        }
        ctx.globalAlpha = 1;
      }

      // Animated holographic billboard on midground towers
      if (b.billboard) {
        const bb = b.billboard;
        const bx = drawX + b.w * bb.offsetXFrac;
        const by = topY + bh * bb.offsetYFrac;
        const bw = Math.max(24, b.w * bb.wFrac);
        const bbh = Math.max(16, Math.min(40, bh * bb.hFrac));
        if (by + bbh < h - 30) {
          drawBillboard(bx, by, bw, bbh, bb, t);
        }
      }
    };

    const drawSpinner = (s: CyberpunkSpinner, h: number, t: number) => {
      const y = h * s.yFrac + Math.sin(t * 2.4 + s.phase) * 2.5;
      const dir = s.vx >= 0 ? 1 : -1;
      const trailLen = s.length * (s.lane === 2 ? 2.6 : 2.1);

      // Glowing neon engine trail
      const trailGrad = ctx.createLinearGradient(
        s.x,
        y,
        s.x - dir * trailLen,
        y
      );
      trailGrad.addColorStop(0, s.trailColor);
      trailGrad.addColorStop(1, 'rgba(9, 6, 18, 0)');
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = s.lane === 0 ? 1.5 : s.lane === 1 ? 2.2 : 3;
      ctx.beginPath();
      ctx.moveTo(s.x, y);
      ctx.lineTo(s.x - dir * trailLen, y);
      ctx.stroke();

      // Sleek flying car chassis
      const bodyH = s.lane === 0 ? 2.5 : s.lane === 1 ? 3.5 : 4.5;
      ctx.fillStyle = s.bodyColor;
      ctx.fillRect(
        dir > 0 ? s.x - s.length * 0.5 : s.x - s.length * 0.5,
        y - bodyH * 0.5,
        s.length,
        bodyH
      );

      // Headlight & tail light
      ctx.fillStyle = s.headlightColor;
      ctx.fillRect(
        dir > 0 ? s.x + s.length * 0.42 : s.x - s.length * 0.5,
        y - bodyH * 0.35,
        3,
        bodyH * 0.7
      );
      ctx.fillStyle = s.trailColor;
      ctx.fillRect(
        dir > 0 ? s.x - s.length * 0.5 : s.x + s.length * 0.4,
        y - bodyH * 0.35,
        3,
        bodyH * 0.7
      );
    };

    const drawMonorail = (w: number, h: number) => {
      const railY = getCyberpunkRailY(h);

      // Support pillars
      ctx.fillStyle = '#0d061c';
      for (let px = 70; px < w; px += 190) {
        ctx.fillRect(px - 4, railY + 5, 8, h - railY);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
        ctx.fillRect(px - 4, railY + 5, 2, h - railY);
        ctx.fillStyle = '#0d061c';
      }

      // Elevated track beam & glowing guide rail
      ctx.fillStyle = '#140928';
      ctx.fillRect(0, railY, w, 7);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.65)';
      ctx.fillRect(0, railY, w, 1.5);
      ctx.fillStyle = 'rgba(255, 42, 133, 0.4)';
      ctx.fillRect(0, railY + 6, w, 1);

      // Gliding cyber-train
      if (world.train.cooldown <= 0) {
        const { x, carCount, carW, gap, accentColor } = world.train;
        const trainTotalW = carCount * (carW + gap);

        // Trailing speed streak
        const streak = ctx.createLinearGradient(
          x - trainTotalW,
          railY - 6,
          x - trainTotalW - 110,
          railY - 6
        );
        streak.addColorStop(0, accentColor);
        streak.addColorStop(1, 'rgba(9, 6, 18, 0)');
        ctx.strokeStyle = streak;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - trainTotalW, railY - 5);
        ctx.lineTo(x - trainTotalW - 110, railY - 5);
        ctx.stroke();

        for (let i = 0; i < carCount; i++) {
          const cx = x - i * (carW + gap) - carW;
          const cy = railY - 12;
          ctx.fillStyle = '#1c0f38';
          ctx.fillRect(cx, cy, carW, 11);

          // Neon roof trim
          ctx.fillStyle = accentColor;
          ctx.fillRect(cx, cy, carW, 1.8);

          // Glowing passenger windows
          ctx.fillStyle = '#fcee0a';
          for (let wx = cx + 5; wx < cx + carW - 7; wx += 9) {
            ctx.fillRect(wx, cy + 4, 5, 3);
          }

          // Nose headlight on lead car
          if (i === 0) {
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(cx + carW - 3, cy + 4, 4, 4);
          }
        }
      }
    };

    const drawFrame = (dt: number) => {
      const { width: w, height: h } = world;
      if (w <= 0 || h <= 0) return;

      stepCyberpunkWorld(world, dt, prefersReducedMotion);
      const t = prefersReducedMotion ? 1.5 : world.elapsed;

      // 1. Pre-rendered neon night sky + synth orb
      if (skyCtx) {
        ctx.drawImage(skyCanvas, 0, 0);
      } else {
        ctx.fillStyle = '#090612';
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Sweeping atmospheric searchlight beams behind skyline
      for (const beam of world.beams) {
        const bx = w * beam.xFrac;
        const by = h * 0.92;
        const ang =
          beam.angleBase + Math.sin(t * beam.swingSpeed + beam.phase) * beam.swingAmp;
        const beamH = h * 0.96;
        const topX = bx + Math.sin(ang) * beamH;
        const topY = by - Math.cos(ang) * beamH;

        const grad = ctx.createLinearGradient(bx, by, topX, topY);
        grad.addColorStop(0, beam.color === '#ff2a85' ? 'rgba(255,42,133,0.14)' : 'rgba(168,85,247,0.16)');
        grad.addColorStop(0.65, beam.color === '#ff2a85' ? 'rgba(255,42,133,0.04)' : 'rgba(168,85,247,0.05)');
        grad.addColorStop(1, 'rgba(9,6,18,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(bx - 5, by);
        ctx.lineTo(bx + 5, by);
        ctx.lineTo(topX + beam.width, topY);
        ctx.lineTo(topX - beam.width, topY);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Far Parallax Skyline (Layer 0)
      const span0 = world.layerWidths[0];
      const off0 = world.layerOffsets[0];
      for (const base of [-off0, span0 - off0]) {
        for (const b of world.buildings[0]) {
          const dx = base + b.x;
          if (dx + b.w < -40 || dx > w + 40) continue;
          drawBuilding(b, dx, h, t);
        }
      }

      // 4. Distant Flying Traffic (Lane 0)
      for (const s of world.spinners) {
        if (s.lane === 0) drawSpinner(s, h, t);
      }

      // 5. Midground Parallax Metropolis + Animated Billboards (Layer 1)
      const span1 = world.layerWidths[1];
      const off1 = world.layerOffsets[1];
      for (const base of [-off1, span1 - off1]) {
        for (const b of world.buildings[1]) {
          const dx = base + b.x;
          if (dx + b.w < -40 || dx > w + 40) continue;
          drawBuilding(b, dx, h, t);
        }
      }

      // 6. Midground Flying Traffic (Lane 1)
      for (const s of world.spinners) {
        if (s.lane === 1) drawSpinner(s, h, t);
      }

      // 7. Elevated Neon Monorail & Cyber-Train
      drawMonorail(w, h);

      // 8. Foreground Flying Traffic (Lane 2)
      for (const s of world.spinners) {
        if (s.lane === 2) drawSpinner(s, h, t);
      }

      // 9. Foreground Framing Rooftop Silhouettes (Layer 2)
      const span2 = world.layerWidths[2];
      const off2 = world.layerOffsets[2];
      for (const base of [-off2, span2 - off2]) {
        for (const b of world.buildings[2]) {
          const dx = base + b.x;
          if (dx + b.w < -40 || dx > w + 40) continue;
          drawBuilding(b, dx, h, t);
        }
      }

      // 10. Neon Cyber-Rain Streaks
      ctx.lineWidth = 1;
      for (const r of world.rain) {
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.alpha;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + (r.vx / r.vy) * r.len, r.y + r.len);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    syncCanvasSize();
    drawFrame(0);

    let resizeTimer: number | null = null;
    const handleResize = () => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        syncCanvasSize();
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
      const dt = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 0.036;
      lastTick = now;
      drawFrame(dt);
      timerId = window.setTimeout(() => {
        if (!disposed) {
          rafId = window.requestAnimationFrame(tick);
        }
      }, 33);
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
      data-testid="cyberpunk-city-canvas"
      aria-hidden="true"
      className="tb-cyberpunk-canvas"
    />
  );
}

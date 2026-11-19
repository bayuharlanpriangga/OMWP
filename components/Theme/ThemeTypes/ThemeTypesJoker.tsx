'use client';

import React from 'react';
import {
  JOKER_CARD_SPECS,
  createJokerWorld,
  getJokerCardFlipState,
  resizeJokerWorld,
  stepJokerWorld,
  type JokerCardSpec,
  type JokerCardSuit,
  type JokerWorld,
} from '@/lib/theme/theme-types/theme-types-joker-simulation';

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - ry);
  ctx.lineTo(x + rx, y);
  ctx.lineTo(x, y + ry);
  ctx.lineTo(x - rx, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawJesterCrown(
  ctx: CanvasRenderingContext2D,
  r: number,
  strokeColor: string,
  fillColor: string,
  bellColor: string
) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.4, r * 0.09);

  ctx.beginPath();
  ctx.moveTo(-r * 0.72, r * 0.34);
  ctx.quadraticCurveTo(-r * 0.94, -r * 0.28, -r * 0.86, -r * 0.56);
  ctx.quadraticCurveTo(-r * 0.44, -r * 0.24, -r * 0.3, r * 0.04);
  ctx.quadraticCurveTo(-r * 0.14, -r * 0.58, 0, -r * 0.86);
  ctx.quadraticCurveTo(r * 0.14, -r * 0.58, r * 0.3, r * 0.04);
  ctx.quadraticCurveTo(r * 0.44, -r * 0.24, r * 0.86, -r * 0.56);
  ctx.quadraticCurveTo(r * 0.94, -r * 0.28, r * 0.72, r * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-r * 0.76, r * 0.34);
  ctx.lineTo(-r * 0.46, r * 0.54);
  ctx.lineTo(0, r * 0.38);
  ctx.lineTo(r * 0.46, r * 0.54);
  ctx.lineTo(r * 0.76, r * 0.34);
  ctx.stroke();

  ctx.fillStyle = bellColor;
  const bellR = Math.max(2, r * 0.13);
  const tips: ReadonlyArray<[number, number]> = [
    [-r * 0.87, -r * 0.58],
    [0, -r * 0.88],
    [r * 0.87, -r * 0.58],
  ];
  for (const [bx, by] of tips) {
    ctx.beginPath();
    ctx.arc(bx, by, bellR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSuitSymbol(
  ctx: CanvasRenderingContext2D,
  suit: JokerCardSuit,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  switch (suit) {
    case 'diamond': {
      drawDiamond(ctx, 0, 0, r * 0.74, r * 0.96, color, alpha);
      break;
    }
    case 'heart': {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.88);
      ctx.bezierCurveTo(-r * 1.12, r * 0.22, -r * 1.05, -r * 0.78, 0, -r * 0.25);
      ctx.bezierCurveTo(r * 1.05, -r * 0.78, r * 1.12, r * 0.22, 0, r * 0.88);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'spade': {
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.92);
      ctx.bezierCurveTo(r * 1.08, -r * 0.14, r * 0.98, r * 0.62, r * 0.16, r * 0.34);
      ctx.lineTo(r * 0.32, r * 0.88);
      ctx.lineTo(-r * 0.32, r * 0.88);
      ctx.lineTo(-r * 0.16, r * 0.34);
      ctx.bezierCurveTo(-r * 0.98, r * 0.62, -r * 1.08, -r * 0.14, 0, -r * 0.92);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'club': {
      const lobeR = r * 0.38;
      ctx.beginPath();
      ctx.arc(0, -r * 0.44, lobeR, 0, Math.PI * 2);
      ctx.arc(-r * 0.44, r * 0.12, lobeR, 0, Math.PI * 2);
      ctx.arc(r * 0.44, r * 0.12, lobeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, r * 0.05);
      ctx.lineTo(r * 0.28, r * 0.86);
      ctx.lineTo(-r * 0.28, r * 0.86);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'jester': {
      drawJesterCrown(ctx, r * 0.95, color, 'rgba(255, 31, 142, 0.3)', '#fff1f7');
      break;
    }
  }
  ctx.restore();
}

function drawJokerCenterFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  alpha: number,
  scale: number,
  t: number
) {
  if (alpha <= 0.01) return;

  const faceR = Math.max(62, radius * 0.6);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Dramatic hot-pink aura behind Joker's face during blackout
  const aura = ctx.createRadialGradient(0, 0, faceR * 0.15, 0, 0, faceR * 2.15);
  aura.addColorStop(0, 'rgba(255, 31, 142, 0.42)');
  aura.addColorStop(0.45, 'rgba(192, 38, 211, 0.2)');
  aura.addColorStop(1, 'rgba(10, 2, 7, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, faceR * 2.15, 0, Math.PI * 2);
  ctx.fill();

  // Subtle laugh shock-pulses around face
  const pulseR = faceR * (1.1 + ((t * 0.8) % 0.65));
  const pulseAlpha = Math.max(0, 0.38 * (1 - ((t * 0.8) % 0.65) / 0.65));
  ctx.strokeStyle = `rgba(255, 77, 166, ${pulseAlpha.toFixed(3)})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
  ctx.stroke();

  // Crown seated on top of Joker's head
  ctx.save();
  ctx.translate(0, -faceR * 0.72);
  ctx.shadowColor = 'rgba(255, 31, 142, 0.75)';
  ctx.shadowBlur = 18;
  drawJesterCrown(
    ctx,
    faceR * 0.82,
    '#ff4da6',
    'rgba(255, 31, 142, 0.35)',
    '#fff1f7'
  );
  ctx.restore();

  // Sharp theatrical Joker mask/head contour
  ctx.save();
  ctx.shadowColor = 'rgba(255, 31, 142, 0.65)';
  ctx.shadowBlur = 22;
  const maskGrad = ctx.createLinearGradient(0, -faceR * 0.72, 0, faceR * 0.92);
  maskGrad.addColorStop(0, '#27071a');
  maskGrad.addColorStop(0.55, '#13040d');
  maskGrad.addColorStop(1, '#2b091e');
  ctx.fillStyle = maskGrad;
  ctx.strokeStyle = '#ff1f8e';
  ctx.lineWidth = Math.max(2, faceR * 0.045);

  ctx.beginPath();
  ctx.moveTo(0, -faceR * 0.62);
  ctx.bezierCurveTo(faceR * 0.72, -faceR * 0.62, faceR * 0.82, -faceR * 0.08, faceR * 0.68, faceR * 0.28);
  ctx.quadraticCurveTo(faceR * 0.45, faceR * 0.72, 0, faceR * 0.94);
  ctx.quadraticCurveTo(-faceR * 0.45, faceR * 0.72, -faceR * 0.68, faceR * 0.28);
  ctx.bezierCurveTo(-faceR * 0.82, -faceR * 0.08, -faceR * 0.72, -faceR * 0.62, 0, -faceR * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Forehead diamond mark & sleek brow ridges
  drawDiamond(ctx, 0, -faceR * 0.36, faceR * 0.08, faceR * 0.12, '#ff66b2', 0.85);
  ctx.strokeStyle = '#ff66b2';
  ctx.lineWidth = Math.max(1.8, faceR * 0.04);
  ctx.lineCap = 'round';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(dir * faceR * 0.12, -faceR * 0.18);
    ctx.quadraticCurveTo(dir * faceR * 0.32, -faceR * 0.34, dir * faceR * 0.5, -faceR * 0.22);
    ctx.stroke();
  }

  // Wicked glowing Joker eyes with diamond harlequin makeup patches
  const eyePulse = 0.88 + 0.12 * Math.sin(t * 6.5);
  for (const dir of [-1, 1]) {
    const ex = dir * faceR * 0.29;
    const ey = -faceR * 0.07;

    // Harlequin eye diamond shadow
    drawDiamond(ctx, ex, ey, faceR * 0.16, faceR * 0.22, 'rgba(255, 31, 142, 0.32)', 0.9);

    // Sharp slanted eye socket
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(dir * -0.24);
    ctx.fillStyle = '#090206';
    ctx.strokeStyle = '#ff4da6';
    ctx.lineWidth = Math.max(1.4, faceR * 0.028);
    ctx.beginPath();
    ctx.moveTo(-faceR * 0.16, 0);
    ctx.quadraticCurveTo(0, -faceR * 0.11, faceR * 0.16, 0);
    ctx.quadraticCurveTo(0, faceR * 0.09, -faceR * 0.16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing hot-pink & rose-white iris
    ctx.shadowColor = '#ff1f8e';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff1f8e';
    ctx.beginPath();
    ctx.arc(0, 0, faceR * 0.056 * eyePulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff1f7';
    ctx.beginPath();
    ctx.arc(0, 0, faceR * 0.025, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Stylized sharp nose highlight
  ctx.strokeStyle = 'rgba(255, 133, 192, 0.55)';
  ctx.lineWidth = Math.max(1.4, faceR * 0.024);
  ctx.beginPath();
  ctx.moveTo(0, -faceR * 0.02);
  ctx.lineTo(-faceR * 0.04, faceR * 0.16);
  ctx.lineTo(faceR * 0.04, faceR * 0.16);
  ctx.stroke();

  // Wide iconic mischievous Joker grin with dark mouth hollow & sharp teeth highlights
  const laughShift = Math.sin(t * 7.2) * (faceR * 0.035);
  ctx.save();
  ctx.shadowColor = 'rgba(255, 31, 142, 0.85)';
  ctx.shadowBlur = 14;

  // Inner dark mouth opening + glowing grin lips
  ctx.fillStyle = '#090106';
  ctx.strokeStyle = '#ff1f8e';
  ctx.lineWidth = Math.max(2.4, faceR * 0.052);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-faceR * 0.52, faceR * 0.24);
  ctx.quadraticCurveTo(0, faceR * 0.44, faceR * 0.52, faceR * 0.24);
  ctx.quadraticCurveTo(0, faceR * 0.78 + laughShift, -faceR * 0.52, faceR * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stylized grinning teeth bars
  ctx.strokeStyle = '#fff1f7';
  ctx.lineWidth = Math.max(1.5, faceR * 0.03);
  ctx.beginPath();
  ctx.moveTo(-faceR * 0.36, faceR * 0.34);
  ctx.quadraticCurveTo(0, faceR * 0.54 + laughShift * 0.45, faceR * 0.36, faceR * 0.34);
  ctx.stroke();

  for (const tx of [-0.24, -0.12, 0, 0.12, 0.24]) {
    const xPos = faceR * tx;
    const archY = faceR * (0.47 - Math.abs(tx) * 0.32) + laughShift * 0.35;
    ctx.beginPath();
    ctx.moveTo(xPos, archY - faceR * 0.06);
    ctx.lineTo(xPos, archY + faceR * 0.06);
    ctx.stroke();
  }

  // Grin corner diamond sparkles
  drawDiamond(ctx, -faceR * 0.56, faceR * 0.21, faceR * 0.055, faceR * 0.08, '#fff1f7', 0.95);
  drawDiamond(ctx, faceR * 0.56, faceR * 0.21, faceR * 0.055, faceR * 0.08, '#fff1f7', 0.95);
  ctx.restore();

  ctx.restore();
}

function drawJokerPlayingCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tilt: number,
  scaleX: number,
  isFaceUp: boolean,
  glint: number,
  spec: JokerCardSpec,
  depth: number,
  speedBoost: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scaleX, 1);

  const hw = w * 0.5;
  const hh = h * 0.5;
  const radius = Math.max(5, w * 0.09);
  const inset = Math.max(4, w * 0.08);
  const alpha = Math.min(0.96, 0.64 + depth * 0.28);
  ctx.globalAlpha = alpha;

  ctx.shadowColor = isFaceUp
    ? `rgba(255, 31, 142, ${(0.4 + speedBoost * 0.35).toFixed(2)})`
    : `rgba(192, 38, 211, ${(0.34 + speedBoost * 0.3).toFixed(2)})`;
  ctx.shadowBlur = 14 + speedBoost * 12;

  const cardGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
  if (isFaceUp) {
    cardGrad.addColorStop(0, '#220718');
    cardGrad.addColorStop(0.5, '#12040c');
    cardGrad.addColorStop(1, '#2e0a20');
  } else {
    cardGrad.addColorStop(0, '#2b091d');
    cardGrad.addColorStop(1, '#140511');
  }
  ctx.fillStyle = cardGrad;
  ctx.beginPath();
  ctx.roundRect(-hw, -hh, w, h, radius);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.lineWidth = 1.65;
  ctx.strokeStyle = isFaceUp ? spec.accent : '#ff1f8e';
  ctx.stroke();

  ctx.lineWidth = 0.9;
  ctx.strokeStyle = isFaceUp
    ? 'rgba(255, 194, 226, 0.55)'
    : 'rgba(255, 77, 166, 0.52)';
  ctx.strokeRect(-hw + inset, -hh + inset, w - inset * 2, h - inset * 2);

  if (isFaceUp) {
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.38);
    aura.addColorStop(0, `rgba(255, 31, 142, ${(0.24 * glint).toFixed(3)})`);
    aura.addColorStop(1, 'rgba(18, 4, 12, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.38, 0, Math.PI * 2);
    ctx.fill();

    const cornerSize = Math.max(8, Math.round(w * 0.145));
    ctx.fillStyle = '#fff1f7';
    ctx.font = `700 ${cornerSize}px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const cornerTag = spec.rank === 'JOKER' ? '★' : spec.rank;
    ctx.fillText(cornerTag, -hw + inset * 1.4, -hh + inset * 1.3);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(cornerTag, hw - inset * 1.4, hh - inset * 1.3);

    const miniR = Math.max(3.5, w * 0.062);
    drawSuitSymbol(
      ctx,
      spec.suit,
      hw - inset * 2.1,
      -hh + inset * 2.2,
      miniR,
      spec.accent,
      0.92
    );
    drawSuitSymbol(
      ctx,
      spec.suit,
      -hw + inset * 2.1,
      hh - inset * 2.2,
      miniR,
      spec.accent,
      0.92
    );

    drawSuitSymbol(ctx, spec.suit, 0, -h * 0.03, w * 0.27, spec.accent, 0.96);

    const tagSize = Math.max(7, Math.round(w * 0.115));
    ctx.fillStyle = spec.accent;
    ctx.font = `700 ${tagSize}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spec.rank === 'JOKER' ? 'JOKER' : spec.label, 0, hh - inset * 2.3);
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-hw + inset * 1.4, -hh + inset * 1.4, w - inset * 2.8, h - inset * 2.8);
    ctx.clip();

    const step = Math.max(8, w * 0.18);
    ctx.strokeStyle = 'rgba(255, 31, 142, 0.34)';
    ctx.lineWidth = 0.85;
    for (let d = -h; d < h + w; d += step) {
      ctx.beginPath();
      ctx.moveTo(-hw, d);
      ctx.lineTo(hw, d - w * 1.2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-hw, d - w * 1.2);
      ctx.lineTo(hw, d);
      ctx.stroke();
    }
    ctx.restore();

    drawDiamond(ctx, 0, 0, w * 0.24, w * 0.34, 'rgba(255, 31, 142, 0.3)', 0.95);
    drawDiamond(ctx, 0, 0, w * 0.14, w * 0.2, '#ff66b2', 0.95);
    drawDiamond(ctx, 0, 0, w * 0.06, w * 0.09, '#fff1f7', 0.95);
  }

  ctx.restore();
}

export function ThemeTypesJoker() {
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

    const world: JokerWorld = createJokerWorld(
      window.innerWidth,
      window.innerHeight
    );

    const buildStaticBackdrop = () => {
      if (!bgCtx) return;
      const { width: w, height: h, centerX, centerY, vortexRadius } = world;
      bgCanvas.width = w;
      bgCanvas.height = h;

      // Deep velvet crimson-magenta theatrical stage backdrop (without circular diagram rings)
      const base = bgCtx.createLinearGradient(0, 0, w, h);
      base.addColorStop(0, '#0a0207');
      base.addColorStop(0.45, '#170511');
      base.addColorStop(0.8, '#26081b');
      base.addColorStop(1, '#0c0309');
      bgCtx.fillStyle = base;
      bgCtx.fillRect(0, 0, w, h);

      // Subtle hot-pink harlequin diamond lattice across velvet walls
      const cellW = w < 640 ? 44 : 58;
      const cellH = cellW * 1.35;
      bgCtx.save();
      bgCtx.fillStyle = 'rgba(255, 31, 142, 0.042)';
      bgCtx.strokeStyle = 'rgba(255, 92, 173, 0.06)';
      bgCtx.lineWidth = 0.75;
      for (let row = -1; row * cellH < h + cellH; row++) {
        const y = row * cellH;
        const offsetX = row % 2 === 0 ? 0 : cellW * 0.5;
        for (let col = -1; col * cellW < w + cellW; col++) {
          const x = col * cellW + offsetX;
          bgCtx.beginPath();
          bgCtx.moveTo(x, y - cellH * 0.45);
          bgCtx.lineTo(x + cellW * 0.45, y);
          bgCtx.lineTo(x, y + cellH * 0.45);
          bgCtx.lineTo(x - cellW * 0.45, y);
          bgCtx.closePath();
          if ((row + col) % 2 === 0) {
            bgCtx.fill();
          } else {
            bgCtx.stroke();
          }
        }
      }
      bgCtx.restore();

      // Atmospheric hot-pink stage glows
      const blooms: ReadonlyArray<[number, number, number, string]> = [
        [centerX, centerY, vortexRadius * 2.4, 'rgba(255, 31, 142, 0.16)'],
        [w * 0.16, h * 0.84, Math.max(w, h) * 0.34, 'rgba(255, 31, 142, 0.15)'],
        [w * 0.84, h * 0.16, Math.max(w, h) * 0.3, 'rgba(217, 70, 239, 0.13)'],
      ];
      for (const [gx, gy, gr, gc] of blooms) {
        const rg = bgCtx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        rg.addColorStop(0, gc);
        rg.addColorStop(1, 'rgba(18, 4, 12, 0)');
        bgCtx.fillStyle = rg;
        bgCtx.fillRect(0, 0, w, h);
      }
    };

    const syncCanvasSize = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      canvas.width = w;
      canvas.height = h;
      resizeJokerWorld(world, w, h);
      buildStaticBackdrop();
    };

    const drawSpotlights = (t: number, intensity: number) => {
      if (intensity <= 0.01) return;
      const { width: w, height: h } = world;
      const beamLength = Math.hypot(w, h) * 1.12;
      for (const sp of world.spotlights) {
        const originX = w * sp.originXFrac;
        const originY = -24;
        const angle = sp.baseAngle + Math.sin(t * sp.sweepSpeed + sp.phase) * sp.sweepAmp;
        const leftA = angle - sp.widthRad * 0.5;
        const rightA = angle + sp.widthRad * 0.5;
        const endX = originX + Math.cos(angle) * beamLength;
        const endY = originY + Math.sin(angle) * beamLength;

        const grad = ctx.createLinearGradient(originX, originY, endX, endY);
        const rgb =
          sp.color === '#d946ef'
            ? '217, 70, 239'
            : sp.color === '#ff5cad'
              ? '255, 92, 173'
              : '255, 31, 142';
        grad.addColorStop(
          0,
          `rgba(${rgb}, ${Math.min(0.45, sp.alpha * 1.55 * intensity).toFixed(3)})`
        );
        grad.addColorStop(
          0.55,
          `rgba(${rgb}, ${Math.min(0.28, sp.alpha * 0.58 * intensity).toFixed(3)})`
        );
        grad.addColorStop(1, 'rgba(18, 4, 12, 0)');

        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(
          originX + Math.cos(leftA) * beamLength,
          originY + Math.sin(leftA) * beamLength
        );
        ctx.lineTo(
          originX + Math.cos(rightA) * beamLength,
          originY + Math.sin(rightA) * beamLength
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    };

    const drawLaughEchoes = (t: number) => {
      const { width: w, height: h } = world;
      const laughBoost = world.phase === 'vortex' ? 1.35 : world.phase === 'explode' ? 1.5 : 1;
      for (const laugh of world.laughs) {
        const x = w * laugh.xFrac + Math.sin(t * laugh.speed + laugh.phase) * laugh.driftAmp;
        const y = h * laugh.yFrac;
        const edgeFade =
          laugh.yFrac < 0.12
            ? Math.max(0, laugh.yFrac / 0.12)
            : laugh.yFrac > 0.88
              ? Math.max(0, (1 - laugh.yFrac) / 0.12)
              : 1;
        const tilt = laugh.baseAngle + Math.sin(t * 0.9 + laugh.phase) * 0.06;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tilt);
        ctx.globalAlpha = Math.min(
          0.42,
          laugh.alpha *
            laughBoost *
            edgeFade *
            (0.76 + 0.24 * Math.sin(t * 2.1 + laugh.phase))
        );
        ctx.fillStyle = laugh.color;
        ctx.shadowColor = 'rgba(255, 31, 142, 0.45)';
        ctx.shadowBlur = 10;
        ctx.font = `800 italic ${laugh.fontSize}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(laugh.text, 0, 0);
        ctx.restore();
      }
    };

    const drawFrame = (dt: number) => {
      const { width: w, height: h } = world;
      if (w <= 0 || h <= 0) return;

      stepJokerWorld(world, dt, prefersReducedMotion);
      canvas.dataset.phase = world.phase;
      canvas.dataset.faceAlpha = world.jokerFaceAlpha.toFixed(2);
      const t = prefersReducedMotion ? 1.4 : world.elapsed;

      // 1. Cached velvet obsidian-magenta stage backdrop
      if (bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0);
      } else {
        ctx.fillStyle = '#12040c';
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Stage spotlights (fade out completely during Joker vortex reveal, blaze back on explosion)
      drawSpotlights(t, world.spotlightIntensity);

      // 3. Dramatic blackout veil during vortex card-circle reveal
      if (world.blackoutOpacity > 0.01) {
        ctx.fillStyle = `rgba(6, 1, 5, ${world.blackoutOpacity.toFixed(3)})`;
        ctx.fillRect(0, 0, w, h);
      }

      // 4. Floating HAHAHA laugh echoes
      drawLaughEchoes(t);

      // 5. Explosion shockwave burst ring
      if (world.explosionFlash > 0.01) {
        const ringR =
          world.vortexRadius * (0.9 + (1 - world.explosionFlash) * 2.3);
        ctx.save();
        ctx.strokeStyle = `rgba(255, 31, 142, ${(world.explosionFlash * 0.72).toFixed(3)})`;
        ctx.lineWidth = Math.max(2, 10 * world.explosionFlash);
        ctx.beginPath();
        ctx.arc(world.centerX, world.centerY, ringR, 0, Math.PI * 2);
        ctx.stroke();

        const flashGlow = ctx.createRadialGradient(
          world.centerX,
          world.centerY,
          0,
          world.centerX,
          world.centerY,
          ringR
        );
        flashGlow.addColorStop(
          0,
          `rgba(255, 77, 166, ${(world.explosionFlash * 0.28).toFixed(3)})`
        );
        flashGlow.addColorStop(1, 'rgba(18, 4, 12, 0)');
        ctx.fillStyle = flashGlow;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // 6. Glowing Hot-Pink Joker Face appearing inside the spinning card circle
      drawJokerCenterFace(
        ctx,
        world.centerX,
        world.centerY,
        world.vortexRadius,
        world.jokerFaceAlpha,
        world.jokerFaceScale,
        t
      );

      // 7. Random bouncing / vortex-spinning / exploding 3D-flipping playing cards
      const sortedCards = [...world.cards].sort((a, b) => a.depth - b.depth);
      for (const card of sortedCards) {
        const flip = getJokerCardFlipState(
          card.flipPhase,
          t,
          card.flipSpeed,
          prefersReducedMotion
        );
        const spec = JOKER_CARD_SPECS[card.specIndex % JOKER_CARD_SPECS.length];
        const speed = Math.hypot(card.vx, card.vy);
        const speedBoost = Math.max(
          0,
          Math.min(1, (speed - card.targetSpeed * 1.4) / 520)
        );

        drawJokerPlayingCard(
          ctx,
          card.x,
          card.y,
          card.width,
          card.height,
          card.angle,
          flip.scaleX,
          flip.isFaceUp,
          flip.glint,
          spec,
          card.depth,
          speedBoost
        );
      }

      // 8. Spinning harlequin confetti diamonds & hot-pink sparks
      for (const c of world.confetti) {
        const pulse = 0.55 + 0.45 * Math.sin(t * 2.2 + c.phase);
        const al = Math.max(0.14, Math.min(0.94, c.alpha * pulse));
        if (c.kind === 'diamond') {
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.spin);
          const scaleX = Math.max(0.25, Math.abs(Math.cos(c.spin * 1.4)));
          ctx.scale(scaleX, 1);
          drawDiamond(ctx, 0, 0, c.size * 0.68, c.size, c.color, al);
          ctx.restore();
        } else {
          ctx.globalAlpha = al;
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.size * 0.48, 0, Math.PI * 2);
          ctx.fill();
        }
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
      data-testid="joker-bg-canvas"
      aria-hidden="true"
      className="tb-joker-canvas"
    />
  );
}

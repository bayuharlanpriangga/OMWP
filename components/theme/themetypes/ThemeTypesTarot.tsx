'use client';

import React from 'react';
import {
  TAROT_ARCANA,
  createTarotWorld,
  getTarotCardFlipState,
  resizeTarotWorld,
  stepTarotWorld,
  type TarotArcanaSpec,
  type TarotMotif,
  type TarotWorld,
} from '@/lib/theme/theme-types/theme-types-tarot-simulation';

function drawSparkStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.22, y - r * 0.22);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.22, y + r * 0.22);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.22, y + r * 0.22);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.22, y - r * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawArcanaMotif(
  ctx: CanvasRenderingContext2D,
  motif: TarotMotif,
  r: number,
  color: string,
  t: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.2, r * 0.09);

  switch (motif) {
    case 'sun': {
      const coreR = r * 0.36;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * 0.15;
        const inner = coreR * 1.18;
        const outer = i % 2 === 0 ? r * 0.94 : r * 0.7;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
        ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, coreR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, coreR * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'moon': {
      // Twin temple pillars + luminous crescent moon
      ctx.globalAlpha = 0.72;
      ctx.strokeRect(-r * 0.76, -r * 0.35, r * 0.24, r * 0.95);
      ctx.strokeRect(r * 0.52, -r * 0.35, r * 0.24, r * 0.95);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(-r * 0.06, -r * 0.1, r * 0.44, -Math.PI * 0.65, Math.PI * 0.65, false);
      ctx.arc(r * 0.16, -r * 0.1, r * 0.36, Math.PI * 0.55, -Math.PI * 0.55, true);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'star': {
      drawSparkStar(ctx, 0, 0, r * 0.88, color, 0.95);
      drawSparkStar(ctx, -r * 0.54, -r * 0.52, r * 0.22, '#f5ecda', 0.8);
      drawSparkStar(ctx, r * 0.54, -r * 0.48, r * 0.18, '#f5ecda', 0.75);
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.strokeStyle = '#140822';
      ctx.stroke();
      break;
    }
    case 'wheel': {
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.12;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.18, Math.sin(a) * r * 0.18);
        ctx.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'eye': {
      // Mystic pyramid triangle + all-seeing eye
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.78);
      ctx.lineTo(r * 0.78, r * 0.58);
      ctx.lineTo(-r * 0.78, r * 0.58);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-r * 0.44, r * 0.08);
      ctx.quadraticCurveTo(0, -r * 0.26, r * 0.44, r * 0.08);
      ctx.quadraticCurveTo(0, r * 0.4, -r * 0.44, r * 0.08);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, r * 0.08, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chalice': {
      // Arcane goblet + rising aura orb
      ctx.beginPath();
      ctx.moveTo(-r * 0.44, -r * 0.26);
      ctx.lineTo(r * 0.44, -r * 0.26);
      ctx.quadraticCurveTo(r * 0.42, r * 0.24, 0, r * 0.3);
      ctx.quadraticCurveTo(-r * 0.42, r * 0.24, -r * 0.44, -r * 0.26);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, r * 0.3);
      ctx.lineTo(0, r * 0.68);
      ctx.moveTo(-r * 0.34, r * 0.68);
      ctx.lineTo(r * 0.34, r * 0.68);
      ctx.stroke();
      drawSparkStar(ctx, 0, -r * 0.56, r * 0.24, '#f5ecda', 0.9);
      break;
    }
    case 'lantern': {
      // Hermit lantern + inner star flame
      ctx.beginPath();
      ctx.arc(0, -r * 0.64, r * 0.16, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.34, -r * 0.42);
      ctx.lineTo(r * 0.34, -r * 0.42);
      ctx.lineTo(r * 0.44, r * 0.36);
      ctx.lineTo(-r * 0.44, r * 0.36);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, r * 0.36);
      ctx.lineTo(r * 0.5, r * 0.36);
      ctx.stroke();
      drawSparkStar(ctx, 0, -r * 0.04, r * 0.28, '#fde68a', 0.95);
      break;
    }
    case 'crown': {
      // Empress tri-crown + stars
      ctx.beginPath();
      ctx.moveTo(-r * 0.62, r * 0.34);
      ctx.lineTo(-r * 0.7, -r * 0.24);
      ctx.lineTo(-r * 0.28, r * 0.02);
      ctx.lineTo(0, -r * 0.46);
      ctx.lineTo(r * 0.28, r * 0.02);
      ctx.lineTo(r * 0.7, -r * 0.24);
      ctx.lineTo(r * 0.62, r * 0.34);
      ctx.closePath();
      ctx.stroke();
      drawSparkStar(ctx, 0, -r * 0.64, r * 0.16, color, 0.9);
      drawSparkStar(ctx, -r * 0.48, -r * 0.44, r * 0.12, color, 0.78);
      drawSparkStar(ctx, r * 0.48, -r * 0.44, r * 0.12, color, 0.78);
      break;
    }
  }
  ctx.restore();
}

function drawTarotCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tilt: number,
  scaleX: number,
  isFaceUp: boolean,
  glint: number,
  arcana: TarotArcanaSpec,
  t: number,
  depth: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(scaleX, 1);

  const hw = w * 0.5;
  const hh = h * 0.5;
  const radius = Math.max(4, w * 0.08);
  const alphaBase = Math.min(0.92, 0.56 + depth * 0.3);

  // Soft mystic drop shadow & aura
  ctx.globalAlpha = alphaBase * 0.55;
  ctx.fillStyle = '#050208';
  ctx.beginPath();
  ctx.roundRect(-hw + 3, -hh + 6, w, h, radius);
  ctx.fill();

  if (glint > 0.15) {
    ctx.globalAlpha = Math.min(0.42, glint * 0.26);
    ctx.strokeStyle = isFaceUp ? arcana.accent : '#c99846';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-hw - 1, -hh - 1, w + 2, h + 2, radius + 1);
    ctx.stroke();
  }

  ctx.globalAlpha = alphaBase;
  const cardGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
  if (isFaceUp) {
    cardGrad.addColorStop(0, '#1c0e2e');
    cardGrad.addColorStop(0.55, '#13081f');
    cardGrad.addColorStop(1, '#260d24');
  } else {
    cardGrad.addColorStop(0, '#220d2d');
    cardGrad.addColorStop(0.5, '#160922');
    cardGrad.addColorStop(1, '#2a0f25');
  }
  ctx.fillStyle = cardGrad;
  ctx.beginPath();
  ctx.roundRect(-hw, -hh, w, h, radius);
  ctx.fill();

  // Outer gilded border
  ctx.strokeStyle = isFaceUp ? arcana.accent : '#c99846';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Inner filigree frame
  const inset = Math.max(4, w * 0.08);
  ctx.strokeStyle = 'rgba(227, 185, 108, 0.52)';
  ctx.lineWidth = 0.9;
  ctx.strokeRect(-hw + inset, -hh + inset, w - inset * 2, h - inset * 2);

  if (isFaceUp) {
    // Gothic sanctuary arch inside face card
    const archTop = -hh + inset * 2.2;
    const archW = w - inset * 3.2;
    ctx.strokeStyle = 'rgba(227, 185, 108, 0.36)';
    ctx.beginPath();
    ctx.arc(0, archTop + archW * 0.5, archW * 0.5, Math.PI, 0);
    ctx.lineTo(archW * 0.5, hh - inset * 2.6);
    ctx.lineTo(-archW * 0.5, hh - inset * 2.6);
    ctx.closePath();
    ctx.stroke();

    // Roman numeral plate at top
    ctx.fillStyle = arcana.accent;
    ctx.font = `700 ${Math.max(8, Math.round(w * 0.14))}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(arcana.numeral, 0, -hh + inset * 1.65);

    // Soft inner arcane aura behind the emblem
    const motifGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.34);
    motifGlow.addColorStop(0, 'rgba(227, 185, 108, 0.18)');
    motifGlow.addColorStop(0.65, 'rgba(168, 85, 247, 0.08)');
    motifGlow.addColorStop(1, 'rgba(20, 9, 34, 0)');
    ctx.fillStyle = motifGlow;
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.34, 0, Math.PI * 2);
    ctx.fill();

    // Central Major Arcana emblem
    drawArcanaMotif(ctx, arcana.motif, w * 0.28, arcana.accent, t);

    // Subtle bottom title line / glyph dots
    ctx.fillStyle = 'rgba(245, 236, 218, 0.88)';
    ctx.font = `600 ${Math.max(6.5, Math.round(w * 0.09))}px Georgia, serif`;
    ctx.fillText(arcana.title.slice(0, 12), 0, hh - inset * 1.55);
  } else {
    // Ornate Tarot Card Back: diagonal lattice + central sacred diamond & star
    ctx.save();
    ctx.beginPath();
    ctx.rect(-hw + inset + 1, -hh + inset + 1, w - (inset + 1) * 2, h - (inset + 1) * 2);
    ctx.clip();

    ctx.strokeStyle = 'rgba(201, 152, 70, 0.24)';
    ctx.lineWidth = 0.8;
    const step = Math.max(8, w * 0.18);
    for (let d = -h; d < h + w; d += step) {
      ctx.beginPath();
      ctx.moveTo(-hw, -hh + d);
      ctx.lineTo(hw, -hh + d - w * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-hw, -hh + d - w * 0.9);
      ctx.lineTo(hw, -hh + d);
      ctx.stroke();
    }
    ctx.restore();

    // Central diamond & 4-point occult star
    const dr = w * 0.26;
    ctx.strokeStyle = '#e3b96c';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -dr * 1.35);
    ctx.lineTo(dr, 0);
    ctx.lineTo(0, dr * 1.35);
    ctx.lineTo(-dr, 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(20, 9, 34, 0.88)';
    ctx.fill();
    ctx.stroke();

    drawSparkStar(ctx, 0, 0, dr * 0.68, '#f3d285', 0.92);
    // Corner crescent dots
    for (const [cx0, cy0] of [
      [-hw + inset * 1.8, -hh + inset * 1.8],
      [hw - inset * 1.8, -hh + inset * 1.8],
      [-hw + inset * 1.8, hh - inset * 1.8],
      [hw - inset * 1.8, hh - inset * 1.8],
    ]) {
      ctx.fillStyle = '#e3b96c';
      ctx.beginPath();
      ctx.arc(cx0, cy0, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function ThemeTypesTarot() {
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

    const getSize = () => {
      const parent = canvas.parentElement;
      return {
        w: Math.max(1, parent ? parent.clientWidth : window.innerWidth),
        h: Math.max(1, parent ? parent.clientHeight : window.innerHeight),
      };
    };

    const initial = getSize();
    const world: TarotWorld = createTarotWorld(initial.w, initial.h);

    const buildSanctumCache = () => {
      if (!bgCtx) return;
      const { width: w, height: h, centerX: cx, centerY: cy, mandalaRadius: r } = world;
      bgCanvas.width = w;
      bgCanvas.height = h;

      // 1. Deep mystic obsidian-plum & velvet burgundy gradient
      const bg = bgCtx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#07030c');
      bg.addColorStop(0.45, '#150822');
      bg.addColorStop(0.8, '#230b1e');
      bg.addColorStop(1, '#09040e');
      bgCtx.fillStyle = bg;
      bgCtx.fillRect(0, 0, w, h);

      // 2. Ambient mystical nebula & warm altar candlelight pools
      const glows: Array<[number, number, number, string]> = [
        [cx, cy, r * 2.25, 'rgba(126, 34, 206, 0.22)'],
        [cx, cy - r * 0.2, r * 1.45, 'rgba(201, 152, 70, 0.12)'],
        [w * 0.14, h * 0.86, Math.max(w, h) * 0.34, 'rgba(139, 44, 78, 0.22)'],
        [w * 0.86, h * 0.86, Math.max(w, h) * 0.3, 'rgba(201, 152, 70, 0.11)'],
      ];
      for (const [gx, gy, gr, gc] of glows) {
        const rg = bgCtx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        rg.addColorStop(0, gc);
        rg.addColorStop(1, 'rgba(12, 6, 17, 0)');
        bgCtx.fillStyle = rg;
        bgCtx.fillRect(0, 0, w, h);
      }

      // 3. Subtle sacred sanctuary outer arch & celestial hairline rings
      bgCtx.strokeStyle = 'rgba(201, 152, 70, 0.1)';
      bgCtx.lineWidth = 1;
      for (const scale of [1.38, 1.82, 2.32]) {
        bgCtx.beginPath();
        bgCtx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        bgCtx.stroke();
      }

      // Subtle sanctuary frame corners
      const pad = Math.min(w, h) * 0.045;
      bgCtx.strokeStyle = 'rgba(201, 152, 70, 0.14)';
      bgCtx.lineWidth = 1;
      bgCtx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    };

    const syncCanvasSize = () => {
      const { w, h } = getSize();
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resizeTarotWorld(world, w, h);
      buildSanctumCache();
    };

    const drawSacredMandala = (t: number) => {
      const { centerX: cx, centerY: cy, mandalaRadius: r } = world;
      const outerR = r * 1.02;
      const midR = r * 0.82;
      const innerR = r * 0.48;

      // Soft pulsing altar halo
      const haloPulse = 0.85 + 0.15 * Math.sin(t * 1.4);
      const altarGlow = ctx.createRadialGradient(cx, cy, innerR * 0.2, cx, cy, outerR * 1.25);
      altarGlow.addColorStop(0, `rgba(227, 185, 108, ${(0.09 * haloPulse).toFixed(3)})`);
      altarGlow.addColorStop(0.55, 'rgba(139, 44, 78, 0.06)');
      altarGlow.addColorStop(1, 'rgba(12, 6, 17, 0)');
      ctx.fillStyle = altarGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // Concentric tarnished gold rings
      ctx.strokeStyle = 'rgba(201, 152, 70, 0.34)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(201, 152, 70, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, midR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(216, 180, 254, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating 22 Major Arcana divisions along the outer ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(world.outerRingAngle);
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2;
        const activePulse = 0.25 + 0.55 * Math.max(0, Math.sin(t * 1.6 - i * 0.45));
        ctx.strokeStyle = `rgba(227, 185, 108, ${(0.2 + activePulse * 0.35).toFixed(2)})`;
        ctx.lineWidth = i % 2 === 0 ? 1.3 : 0.9;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * midR, Math.sin(a) * midR);
        ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
        ctx.stroke();

        // Tiny gold sigil dot between ticks
        const midA = a + Math.PI / 22;
        const dotR = (outerR + midR) * 0.5;
        ctx.fillStyle = 'rgba(243, 210, 133, 0.38)';
        ctx.beginPath();
        ctx.arc(Math.cos(midA) * dotR, Math.sin(midA) * dotR, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Counter-rotating sacred octagram (Star of Destiny) inside midR
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(world.innerRingAngle);
      ctx.strokeStyle = 'rgba(216, 180, 254, 0.18)';
      ctx.lineWidth = 1;
      for (let sq = 0; sq < 2; sq++) {
        ctx.save();
        ctx.rotate((sq * Math.PI) / 4);
        const side = midR * 0.68;
        ctx.strokeRect(-side, -side, side * 2, side * 2);
        ctx.restore();
      }
      ctx.restore();

      // Slow-spinning inner sigil eye
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(world.sigilAngle * 0.4);
      ctx.strokeStyle = 'rgba(227, 185, 108, 0.28)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-innerR * 0.52, 0);
      ctx.quadraticCurveTo(0, -innerR * 0.36, innerR * 0.52, 0);
      ctx.quadraticCurveTo(0, innerR * 0.36, -innerR * 0.52, 0);
      ctx.stroke();
      ctx.fillStyle = 'rgba(227, 185, 108, 0.28)';
      ctx.beginPath();
      ctx.arc(0, 0, innerR * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Triple Goddess Moon crowning the top of the mandala
      const moonY = cy - outerR * 1.13;
      const moonR = Math.max(9, r * 0.082);
      const sideOffset = moonR * 2.55;
      ctx.save();
      // Central Full Moon
      const fullGlow = ctx.createRadialGradient(cx, moonY, 0, cx, moonY, moonR * 2.4);
      fullGlow.addColorStop(0, 'rgba(245, 236, 218, 0.36)');
      fullGlow.addColorStop(1, 'rgba(12, 6, 17, 0)');
      ctx.fillStyle = fullGlow;
      ctx.beginPath();
      ctx.arc(cx, moonY, moonR * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(227, 185, 108, 0.72)';
      ctx.fillStyle = 'rgba(245, 236, 218, 0.22)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(cx, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Left Waxing Crescent
      ctx.beginPath();
      ctx.arc(cx - sideOffset, moonY, moonR * 0.72, -Math.PI * 0.55, Math.PI * 0.55, true);
      ctx.arc(
        cx - sideOffset + moonR * 0.3,
        moonY,
        moonR * 0.58,
        Math.PI * 0.45,
        -Math.PI * 0.45,
        false
      );
      ctx.stroke();

      // Right Waning Crescent
      ctx.beginPath();
      ctx.arc(cx + sideOffset, moonY, moonR * 0.72, -Math.PI * 0.45, Math.PI * 0.45, false);
      ctx.arc(
        cx + sideOffset - moonR * 0.3,
        moonY,
        moonR * 0.58,
        Math.PI * 0.55,
        -Math.PI * 0.55,
        true
      );
      ctx.stroke();
      ctx.restore();
    };

    const drawIncenseWisps = (t: number) => {
      const { width: w, height: h, wisps } = world;
      for (const wisp of wisps) {
        const baseX = w * wisp.xFrac;
        const baseY = h * wisp.baseYFrac;
        const topY = baseY - h * wisp.heightFrac;
        const sway1 = Math.sin(t * wisp.speed + wisp.phase) * (w * 0.045);
        const sway2 = Math.cos(t * wisp.speed * 1.25 + wisp.phase) * (w * 0.05);

        const rgb =
          wisp.color === '#c99846'
            ? '201, 152, 70'
            : wisp.color === '#9d2a4b'
              ? '157, 42, 75'
              : '168, 85, 247';
        const baseWidth = Math.max(22, w * wisp.widthFrac * 0.16);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowColor = `rgba(${rgb}, 0.24)`;
        ctx.shadowBlur = 26;
        for (const [widthScale, alphaScale] of [
          [1.85, 0.26],
          [1.0, 0.44],
          [0.42, 0.52],
        ] as const) {
          const grad = ctx.createLinearGradient(baseX, baseY, baseX + sway2, topY);
          grad.addColorStop(0, 'rgba(12, 6, 17, 0)');
          grad.addColorStop(
            0.3,
            `rgba(${rgb}, ${(wisp.alpha * alphaScale).toFixed(3)})`
          );
          grad.addColorStop(
            0.72,
            `rgba(196, 181, 253, ${(wisp.alpha * alphaScale * 0.38).toFixed(3)})`
          );
          grad.addColorStop(1, 'rgba(12, 6, 17, 0)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = baseWidth * widthScale;
          ctx.beginPath();
          ctx.moveTo(baseX, baseY);
          ctx.bezierCurveTo(
            baseX + sway1,
            baseY - h * wisp.heightFrac * 0.35,
            baseX - sway2,
            baseY - h * wisp.heightFrac * 0.72,
            baseX + sway2 * 0.8,
            topY
          );
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    const drawFrame = (dt: number) => {
      const { width: w, height: h } = world;
      if (w <= 0 || h <= 0) return;

      stepTarotWorld(world, dt, prefersReducedMotion);
      const t = prefersReducedMotion ? 1.4 : world.elapsed;

      // 1. Cached deep velvet sanctum background
      if (bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0);
      } else {
        ctx.fillStyle = '#0c0611';
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Twinkling celestial motes
      for (const s of world.stars) {
        const al = Math.max(
          0.12,
          Math.min(0.88, s.alpha * (0.62 + 0.38 * Math.sin(t * s.twinkleSpeed + s.phase)))
        );
        if (s.r >= 1.55) {
          drawSparkStar(ctx, s.x, s.y, s.r * 2.8, s.color, al * 0.8);
        } else {
          ctx.globalAlpha = al;
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // 3. Undulating mystical incense smoke wisps
      drawIncenseWisps(t);

      // 4. Sacred rotating Tarot mandala & Triple Goddess Moon
      drawSacredMandala(t);

      // 5. Levitating & smoothly flipping Major Arcana Tarot cards (sorted by depth)
      const sortedCards = [...world.cards].sort((a, b) => a.depth - b.depth);
      for (const card of sortedCards) {
        const cx =
          w * card.anchorXFrac +
          Math.cos(t * card.driftSpeed + card.bobPhase) * card.driftAmpX;
        const cy =
          h * card.anchorYFrac +
          Math.sin(t * card.bobSpeed + card.bobPhase) * card.bobAmp;
        const tilt =
          card.baseTilt + Math.sin(t * 0.65 + card.bobPhase) * card.tiltAmp;

        const flip = getTarotCardFlipState(
          card.flipPhase,
          t,
          card.flipSpeed,
          prefersReducedMotion
        );
        const arcana = TAROT_ARCANA[card.arcanaIndex % TAROT_ARCANA.length];

        drawTarotCard(
          ctx,
          cx,
          cy,
          card.width,
          card.height,
          tilt,
          flip.scaleX,
          flip.isFaceUp,
          flip.glint,
          arcana,
          t,
          card.depth
        );
      }

      // 6. Rising warm candlelight embers & arcane sparks
      for (const e of world.embers) {
        const flicker = 0.55 + 0.45 * Math.sin(t * e.twinkleSpeed + e.phase);
        const al = Math.max(0.1, Math.min(0.92, e.alpha * flicker));
        const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3.4);
        glow.addColorStop(0, e.color);
        glow.addColorStop(1, 'rgba(12, 6, 17, 0)');
        ctx.globalAlpha = al * 0.52;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 3.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = al;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
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
      data-testid="tarot-bg-canvas"
      aria-hidden="true"
      className="tb-tarot-canvas"
    />
  );
}

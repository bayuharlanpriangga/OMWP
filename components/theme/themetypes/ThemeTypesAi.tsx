'use client';

import React from 'react';
import {
  AI_MODEL_CORES,
  createAiWorld,
  getAiModelOrbitalPosition,
  resizeAiWorld,
  stepAiWorld,
  type AiModelSignatureId,
  type AiWorld,
} from '@/lib/theme/theme-types/theme-types-ai-simulation';

function drawGeminiStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string | CanvasGradient,
  alpha = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  const inner = r * 0.24;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(inner, -inner, r, 0);
  ctx.quadraticCurveTo(inner, inner, 0, r);
  ctx.quadraticCurveTo(-inner, inner, -r, 0);
  ctx.quadraticCurveTo(-inner, -inner, 0, -r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawClaudeSunburst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  rotation: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.min(3.2, Math.max(1.4, r * 0.14));
  const rays = 10;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const len = i % 2 === 0 ? r : r * 0.72;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r * 0.24), Math.sin(a) * (r * 0.24));
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawChatGptBloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  rotation: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.min(2.6, Math.max(1.2, r * 0.095));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const px = Math.cos(a) * r * 0.42;
    const py = Math.sin(a) * r * 0.42;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.48, r * 0.26, a + Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDeepSeekCrest(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  secondary: string,
  phase: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, r * 0.14);

  // Twin harmonic deep-ocean / neural prism arcs
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r * 0.78, Math.sin(phase) * r * 0.12);
  ctx.bezierCurveTo(-r * 0.3, -r * 0.65, r * 0.3, r * 0.45, r * 0.78, -r * 0.18);
  ctx.stroke();

  ctx.strokeStyle = secondary;
  ctx.beginPath();
  ctx.moveTo(-r * 0.65, r * 0.36);
  ctx.bezierCurveTo(-r * 0.15, -r * 0.25, r * 0.32, r * 0.65, r * 0.74, r * 0.16);
  ctx.stroke();

  ctx.fillStyle = secondary;
  ctx.beginPath();
  ctx.arc(0, -r * 0.46, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawModelGlyph(
  ctx: CanvasRenderingContext2D,
  id: AiModelSignatureId,
  x: number,
  y: number,
  r: number,
  primary: string,
  secondary: string,
  t: number
) {
  switch (id) {
    case 'gemini':
      drawGeminiStar(ctx, x, y, r, primary, 0.96);
      break;
    case 'claude':
      drawClaudeSunburst(ctx, x, y, r * 0.86, primary, t * 0.25);
      break;
    case 'chatgpt':
      drawChatGptBloom(ctx, x, y, r * 0.88, primary, -t * 0.22);
      break;
    case 'deepseek':
      drawDeepSeekCrest(ctx, x, y, r * 0.88, primary, secondary, t * 1.4);
      break;
  }
}

function quadraticBezierPoint(
  p0x: number,
  p0y: number,
  cx: number,
  cy: number,
  p1x: number,
  p1y: number,
  t: number
): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * p0x + 2 * u * t * cx + t * t * p1x,
    y: u * u * p0y + 2 * u * t * cy + t * t * p1y,
  };
}

export function ThemeTypesAi() {
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
    const world: AiWorld = createAiWorld(initial.w, initial.h);

    const buildStaticBackdrop = () => {
      if (!bgCtx) return;
      const { width: w, height: h, centerX: cx, centerY: cy, nexusRadius: r } =
        world;
      bgCanvas.width = w;
      bgCanvas.height = h;

      // 1. Deep obsidian-cobalt background canvas
      const bg = bgCtx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#050814');
      bg.addColorStop(0.45, '#091022');
      bg.addColorStop(0.82, '#070e1d');
      bg.addColorStop(1, '#04060f');
      bgCtx.fillStyle = bg;
      bgCtx.fillRect(0, 0, w, h);

      // 2. Subtle precision tensor coordinate grid
      const gridStep = w < 640 ? 44 : 56;
      bgCtx.strokeStyle = 'rgba(77, 107, 254, 0.045)';
      bgCtx.lineWidth = 1;
      for (let gx = 0; gx < w; gx += gridStep) {
        bgCtx.beginPath();
        bgCtx.moveTo(gx + 0.5, 0);
        bgCtx.lineTo(gx + 0.5, h);
        bgCtx.stroke();
      }
      for (let gy = 0; gy < h; gy += gridStep) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, gy + 0.5);
        bgCtx.lineTo(w, gy + 0.5);
        bgCtx.stroke();
      }

      // 3. Quad-spectrum soft atmospheric glow pools (Gemini, Claude, ChatGPT, DeepSeek)
      const glows: Array<[number, number, number, string]> = [
        [cx - r * 0.7, cy - r * 0.65, r * 1.9, 'rgba(66, 133, 244, 0.13)'],
        [cx + r * 0.75, cy - r * 0.55, r * 1.6, 'rgba(217, 119, 87, 0.10)'],
        [cx + r * 0.65, cy + r * 0.75, r * 1.6, 'rgba(16, 163, 127, 0.11)'],
        [cx - r * 0.65, cy + r * 0.7, r * 1.85, 'rgba(77, 107, 254, 0.14)'],
        [w * 0.16, h * 0.25, Math.max(w, h) * 0.34, 'rgba(77, 107, 254, 0.08)'],
      ];
      for (const [gx, gy, gr, gc] of glows) {
        const rg = bgCtx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        rg.addColorStop(0, gc);
        rg.addColorStop(1, 'rgba(6, 9, 19, 0)');
        bgCtx.fillStyle = rg;
        bgCtx.fillRect(0, 0, w, h);
      }

      // 4. Outer subtle orbital calibration arcs
      bgCtx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      bgCtx.lineWidth = 1;
      for (const scale of [1.42, 1.88, 2.38]) {
        bgCtx.beginPath();
        bgCtx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        bgCtx.stroke();
      }
    };

    const syncCanvasSize = () => {
      const { w, h } = getSize();
      canvas.width = w;
      canvas.height = h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resizeAiWorld(world, w, h);
      buildStaticBackdrop();
    };

    const drawTensorWaves = (t: number) => {
      const { width: w, height: h, waves } = world;
      for (const wave of waves) {
        const baseY = h * wave.yFrac;
        ctx.save();
        ctx.globalAlpha = wave.alpha;
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const step = w < 640 ? 18 : 22;
        for (let x = 0; x <= w + step; x += step) {
          const y =
            baseY +
            Math.sin(x * wave.frequency + t * wave.speed + wave.phase) *
              wave.amplitude +
            Math.cos(x * wave.frequency * 0.55 - t * wave.speed * 0.7) *
              (wave.amplitude * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawNeuralConstellation = (t: number) => {
      const { nodes, width: w } = world;
      const maxDist = w < 640 ? 96 : 138;
      const maxDistSq = maxDist * maxDist;

      // Synaptic links
      ctx.lineWidth = 0.85;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < maxDistSq) {
            const strength = 1 - Math.sqrt(dSq) / maxDist;
            ctx.globalAlpha = strength * 0.16;
            ctx.strokeStyle = a.color;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Neural nodes
      for (const n of nodes) {
        const pulse = 0.65 + 0.35 * Math.sin(t * n.pulseSpeed + n.phase);
        ctx.globalAlpha = n.alpha * pulse;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawConvergenceNexus = (t: number) => {
      const { centerX: cx, centerY: cy, nexusRadius: r } = world;
      const outerR = r * 0.96;
      const midR = r * 0.66;
      const coreR = r * 0.31;

      // 1. Central core radial halo
      const haloPulse = 0.85 + 0.15 * Math.sin(t * 1.6);
      const halo = ctx.createRadialGradient(cx, cy, coreR * 0.15, cx, cy, outerR * 1.15);
      halo.addColorStop(0, `rgba(96, 165, 250, ${(0.16 * haloPulse).toFixed(3)})`);
      halo.addColorStop(0.42, 'rgba(77, 107, 254, 0.08)');
      halo.addColorStop(0.75, 'rgba(16, 163, 127, 0.04)');
      halo.addColorStop(1, 'rgba(6, 9, 19, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // 2. Elliptical orbital path + calibrated segmented token ring
      ctx.save();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.18, r * 0.88, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(world.outerRingAngle);
      const ticks = 48;
      for (let i = 0; i < ticks; i++) {
        const a = (i / ticks) * Math.PI * 2;
        const coreSpec = AI_MODEL_CORES[Math.floor((i / ticks) * 4) % 4];
        const waveGlow = 0.25 + 0.55 * Math.max(0, Math.sin(t * 2.1 - i * 0.35));
        ctx.strokeStyle = coreSpec.primaryColor;
        ctx.globalAlpha = 0.16 + waveGlow * 0.34;
        ctx.lineWidth = i % 4 === 0 ? 1.6 : 0.9;
        const rIn = i % 4 === 0 ? outerR * 0.87 : outerR * 0.91;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
        ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // 3. Counter-rotating ChatGPT-inspired 6-petal Möbius bloom around center
      drawChatGptBloom(
        ctx,
        cx,
        cy,
        midR * 0.82,
        'rgba(52, 211, 153, 0.28)',
        world.innerRingAngle
      );

      // 4. Inner Claude warm terracotta sunburst + Gemini 4-point star at the singularity core
      drawClaudeSunburst(
        ctx,
        cx,
        cy,
        coreR * 0.92,
        'rgba(217, 119, 87, 0.52)',
        t * 0.18
      );

      const starGrad = ctx.createLinearGradient(
        cx - coreR * 0.7,
        cy - coreR * 0.7,
        cx + coreR * 0.7,
        cy + coreR * 0.7
      );
      starGrad.addColorStop(0, '#60a5fa');
      starGrad.addColorStop(0.5, '#c4b5fd');
      starGrad.addColorStop(1, '#38bdf8');
      drawGeminiStar(ctx, cx, cy, coreR * 0.74, starGrad, 0.92);

      // 5. Curved neural bridges & bidirectional packets to the 4 orbital AI model cores
      const modelCoords = AI_MODEL_CORES.map((spec) => ({
        spec,
        pos: getAiModelOrbitalPosition(world, spec),
      }));

      for (let i = 0; i < modelCoords.length; i++) {
        const { spec, pos } = modelCoords[i];
        const midX = (cx + pos.x) * 0.5;
        const midY = (cy + pos.y) * 0.5;
        const nx = -(pos.y - cy) * 0.22;
        const ny = (pos.x - cx) * 0.22;
        const ctrlX = midX + nx;
        const ctrlY = midY + ny;

        // Synapse curve
        ctx.save();
        ctx.strokeStyle = spec.primaryColor;
        ctx.globalAlpha = 0.26;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(ctrlX, ctrlY, pos.x, pos.y);
        ctx.stroke();
        ctx.restore();

        // Reasoning token packets traveling along this bridge
        for (const pkt of world.packets) {
          if (pkt.modelIndex !== i) continue;
          const pt = quadraticBezierPoint(
            cx,
            cy,
            ctrlX,
            ctrlY,
            pos.x,
            pos.y,
            pkt.progress
          );
          const tailT = Math.max(
            0,
            Math.min(1, pkt.progress - pkt.direction * pkt.trail)
          );
          const tail = quadraticBezierPoint(
            cx,
            cy,
            ctrlX,
            ctrlY,
            pos.x,
            pos.y,
            tailT
          );

          ctx.save();
          const lineGrad = ctx.createLinearGradient(tail.x, tail.y, pt.x, pt.y);
          lineGrad.addColorStop(0, 'rgba(6, 9, 19, 0)');
          lineGrad.addColorStop(1, pkt.color);
          ctx.strokeStyle = lineGrad;
          ctx.lineWidth = 2.1;
          ctx.beginPath();
          ctx.moveTo(tail.x, tail.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();

          ctx.fillStyle = '#eef4ff';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 6. Render the 4 orbital AI model core pods
      const nodeRadius = Math.max(15, r * 0.145);
      for (const { spec, pos } of modelCoords) {
        ctx.save();
        const podGlow = ctx.createRadialGradient(
          pos.x,
          pos.y,
          0,
          pos.x,
          pos.y,
          nodeRadius * 2.1
        );
        podGlow.addColorStop(0, spec.glowColor);
        podGlow.addColorStop(1, 'rgba(6, 9, 19, 0)');
        ctx.fillStyle = podGlow;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius * 2.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(9, 15, 31, 0.92)';
        ctx.strokeStyle = spec.primaryColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        drawModelGlyph(
          ctx,
          spec.id,
          pos.x,
          pos.y,
          nodeRadius * 0.62,
          spec.primaryColor,
          spec.secondaryColor,
          t
        );
        ctx.restore();
      }
    };

    const drawFrame = (dt: number) => {
      const { width: w, height: h } = world;
      if (w <= 0 || h <= 0) return;

      stepAiWorld(world, dt, prefersReducedMotion);
      const t = prefersReducedMotion ? 1.2 : world.elapsed;

      if (bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0);
      } else {
        ctx.fillStyle = '#060913';
        ctx.fillRect(0, 0, w, h);
      }

      drawTensorWaves(t);
      drawNeuralConstellation(t);
      drawConvergenceNexus(t);

      // Ambient 4-point AI attention sparkles
      for (const sp of world.sparkles) {
        const flicker = 0.5 + 0.5 * Math.sin(t * sp.twinkleSpeed + sp.phase);
        const al = Math.max(0.1, Math.min(0.85, sp.alpha * flicker));
        if (sp.size >= 2.8) {
          drawGeminiStar(ctx, sp.x, sp.y, sp.size * 1.4, sp.color, al);
        } else {
          ctx.globalAlpha = al;
          ctx.fillStyle = sp.color;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
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
      data-testid="ai-bg-canvas"
      aria-hidden="true"
      className="tb-ai-canvas"
    />
  );
}

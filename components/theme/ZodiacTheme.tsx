'use client';

import React from 'react';
import {
  ZODIAC_CONSTELLATIONS,
  createZodiacWorld,
  resizeZodiacWorld,
  stepZodiacWorld,
  type ZodiacWorld,
} from '@/lib/zodiac-simulation';

function drawZodiacGlyph(
  ctx: CanvasRenderingContext2D,
  index: number,
  x: number,
  y: number,
  size: number
) {
  const s = size * 0.46;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  switch (index % 12) {
    case 0: // Aries
      ctx.moveTo(0, s * 0.9);
      ctx.lineTo(0, -s * 0.25);
      ctx.arc(-s * 0.45, -s * 0.35, s * 0.45, 0, Math.PI * 1.15, true);
      ctx.moveTo(0, -s * 0.25);
      ctx.arc(s * 0.45, -s * 0.35, s * 0.45, Math.PI, -Math.PI * 0.15, false);
      break;
    case 1: // Taurus
      ctx.arc(0, s * 0.25, s * 0.48, 0, Math.PI * 2);
      ctx.moveTo(-s * 0.55, -s * 0.72);
      ctx.quadraticCurveTo(0, -s * 0.05, s * 0.55, -s * 0.72);
      break;
    case 2: // Gemini
      ctx.moveTo(-s * 0.65, -s * 0.68);
      ctx.quadraticCurveTo(0, -s * 0.48, s * 0.65, -s * 0.68);
      ctx.moveTo(-s * 0.65, s * 0.68);
      ctx.quadraticCurveTo(0, s * 0.48, s * 0.65, s * 0.68);
      ctx.moveTo(-s * 0.26, -s * 0.56);
      ctx.lineTo(-s * 0.26, s * 0.56);
      ctx.moveTo(s * 0.26, -s * 0.56);
      ctx.lineTo(s * 0.26, s * 0.56);
      break;
    case 3: // Cancer
      ctx.arc(-s * 0.32, -s * 0.22, s * 0.25, 0, Math.PI * 2);
      ctx.moveTo(-s * 0.32, -s * 0.47);
      ctx.quadraticCurveTo(s * 0.28, -s * 0.56, s * 0.62, -s * 0.18);
      ctx.moveTo(s * 0.57, s * 0.22);
      ctx.arc(s * 0.32, s * 0.22, s * 0.25, 0, Math.PI * 2);
      ctx.moveTo(s * 0.32, s * 0.47);
      ctx.quadraticCurveTo(-s * 0.28, s * 0.56, -s * 0.62, s * 0.18);
      break;
    case 4: // Leo
      ctx.arc(-s * 0.38, s * 0.22, s * 0.24, 0, Math.PI * 2);
      ctx.moveTo(-s * 0.18, s * 0.1);
      ctx.bezierCurveTo(-s * 0.15, -s * 0.85, s * 0.55, -s * 0.72, s * 0.42, s * 0.25);
      ctx.quadraticCurveTo(s * 0.36, s * 0.78, s * 0.68, s * 0.58);
      break;
    case 5: // Virgo
      ctx.moveTo(-s * 0.64, -s * 0.55);
      ctx.lineTo(-s * 0.64, s * 0.48);
      ctx.moveTo(-s * 0.64, -s * 0.25);
      ctx.quadraticCurveTo(-s * 0.4, -s * 0.62, -s * 0.2, -s * 0.25);
      ctx.lineTo(-s * 0.2, s * 0.48);
      ctx.moveTo(-s * 0.2, -s * 0.25);
      ctx.quadraticCurveTo(s * 0.04, -s * 0.62, s * 0.24, -s * 0.25);
      ctx.lineTo(s * 0.24, s * 0.48);
      ctx.moveTo(s * 0.24, -s * 0.15);
      ctx.quadraticCurveTo(s * 0.72, -s * 0.35, s * 0.52, s * 0.3);
      ctx.quadraticCurveTo(s * 0.36, s * 0.68, s * 0.68, s * 0.72);
      break;
    case 6: // Libra
      ctx.moveTo(-s * 0.72, s * 0.55);
      ctx.lineTo(s * 0.72, s * 0.55);
      ctx.moveTo(-s * 0.72, s * 0.22);
      ctx.lineTo(-s * 0.34, s * 0.22);
      ctx.arc(0, s * 0.04, s * 0.36, Math.PI * 0.86, Math.PI * 0.14, false);
      ctx.lineTo(s * 0.72, s * 0.22);
      break;
    case 7: // Scorpius
      ctx.moveTo(-s * 0.66, -s * 0.55);
      ctx.lineTo(-s * 0.66, s * 0.45);
      ctx.moveTo(-s * 0.66, -s * 0.25);
      ctx.quadraticCurveTo(-s * 0.42, -s * 0.62, -s * 0.22, -s * 0.25);
      ctx.lineTo(-s * 0.22, s * 0.45);
      ctx.moveTo(-s * 0.22, -s * 0.25);
      ctx.quadraticCurveTo(s * 0.02, -s * 0.62, s * 0.22, -s * 0.25);
      ctx.lineTo(s * 0.22, s * 0.38);
      ctx.quadraticCurveTo(s * 0.24, s * 0.72, s * 0.64, s * 0.48);
      ctx.lineTo(s * 0.44, s * 0.42);
      ctx.moveTo(s * 0.64, s * 0.48);
      ctx.lineTo(s * 0.55, s * 0.7);
      break;
    case 8: // Sagittarius
      ctx.moveTo(-s * 0.62, s * 0.62);
      ctx.lineTo(s * 0.62, -s * 0.62);
      ctx.moveTo(s * 0.12, -s * 0.62);
      ctx.lineTo(s * 0.62, -s * 0.62);
      ctx.lineTo(s * 0.62, -s * 0.12);
      ctx.moveTo(-s * 0.38, -s * 0.02);
      ctx.lineTo(s * 0.02, s * 0.38);
      break;
    case 9: // Capricornus
      ctx.moveTo(-s * 0.65, -s * 0.45);
      ctx.lineTo(-s * 0.28, s * 0.45);
      ctx.lineTo(s * 0.08, -s * 0.32);
      ctx.quadraticCurveTo(s * 0.46, -s * 0.42, s * 0.48, s * 0.02);
      ctx.arc(s * 0.34, s * 0.34, s * 0.24, 0, Math.PI * 1.65);
      break;
    case 10: // Aquarius
      ctx.moveTo(-s * 0.68, -s * 0.24);
      ctx.lineTo(-s * 0.34, -s * 0.46);
      ctx.lineTo(0, -s * 0.18);
      ctx.lineTo(s * 0.34, -s * 0.46);
      ctx.lineTo(s * 0.68, -s * 0.24);
      ctx.moveTo(-s * 0.68, s * 0.3);
      ctx.lineTo(-s * 0.34, s * 0.08);
      ctx.lineTo(0, s * 0.36);
      ctx.lineTo(s * 0.34, s * 0.08);
      ctx.lineTo(s * 0.68, s * 0.3);
      break;
    default: // Pisces
      ctx.moveTo(-s * 0.48, -s * 0.66);
      ctx.quadraticCurveTo(-s * 0.05, 0, -s * 0.48, s * 0.66);
      ctx.moveTo(s * 0.48, -s * 0.66);
      ctx.quadraticCurveTo(s * 0.05, 0, s * 0.48, s * 0.66);
      ctx.moveTo(-s * 0.64, 0);
      ctx.lineTo(s * 0.64, 0);
      break;
  }

  ctx.stroke();
  ctx.restore();
}

function drawFourPointStar(
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
  ctx.lineTo(x + r * 0.24, y - r * 0.24);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.24, y + r * 0.24);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.24, y + r * 0.24);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.24, y - r * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function ZodiacTheme() {
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

    let world: ZodiacWorld = createZodiacWorld(
      Math.max(320, window.innerWidth),
      Math.max(240, window.innerHeight)
    );

    const buildStaticAtlas = () => {
      if (!bgCtx || world.width <= 0 || world.height <= 0) return;
      bgCanvas.width = world.width;
      bgCanvas.height = world.height;

      const { width: w, height: h, centerX: cx, centerY: cy, wheelRadius: r } = world;

      // 1. Deep Prussian midnight-indigo sky gradient
      const sky = bgCtx.createLinearGradient(0, 0, w, h);
      sky.addColorStop(0, '#050816');
      sky.addColorStop(0.5, '#0b1433');
      sky.addColorStop(1, '#060a1c');
      bgCtx.fillStyle = sky;
      bgCtx.fillRect(0, 0, w, h);

      // 2. Soft celestial indigo & antique-gold atmospheric nebulae
      const glows: Array<[number, number, number, string]> = [
        [cx, cy, r * 2.1, 'rgba(37, 72, 138, 0.26)'],
        [cx - r * 0.4, cy + r * 0.25, r * 1.45, 'rgba(212, 175, 55, 0.09)'],
        [w * 0.18, h * 0.24, Math.max(w, h) * 0.35, 'rgba(30, 58, 118, 0.2)'],
      ];
      for (const [gx, gy, gr, gc] of glows) {
        const rg = bgCtx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        rg.addColorStop(0, gc);
        rg.addColorStop(1, 'rgba(5, 8, 22, 0)');
        bgCtx.fillStyle = rg;
        bgCtx.fillRect(0, 0, w, h);
      }

      // 3. Faint celestial atlas meridian arcs
      bgCtx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
      bgCtx.lineWidth = 1;
      for (const scale of [1.48, 1.95, 2.5]) {
        bgCtx.beginPath();
        bgCtx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        bgCtx.stroke();
      }

      // Diagonal ecliptic reference line
      bgCtx.beginPath();
      bgCtx.moveTo(0, h * 0.78);
      bgCtx.quadraticCurveTo(w * 0.46, h * 0.46, w, h * 0.14);
      bgCtx.stroke();
    };

    const handleResize = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      canvas.width = w;
      canvas.height = h;
      resizeZodiacWorld(world, w, h);
      buildStaticAtlas();
    };

    const drawFrame = (dt: number) => {
      if (!prefersReducedMotion && dt > 0) {
        stepZodiacWorld(world, dt);
      }

      if (bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0);
      }

      const {
        centerX: cx,
        centerY: cy,
        wheelRadius: R,
        elapsed,
        wheelAngle,
        innerRingAngle,
      } = world;

      // 1. Twinkling sky starfield
      for (const s of world.stars) {
        const alpha = Math.max(
          0.14,
          Math.min(0.95, s.baseAlpha * (0.65 + 0.35 * Math.sin(elapsed * s.speed + s.phase)))
        );
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.tint;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r >= 1.7) {
          drawFourPointStar(ctx, s.x, s.y, s.r * 3.1, s.tint, alpha * 0.75);
        }
      }
      ctx.globalAlpha = 1;

      // 2. Shooting stars
      for (const m of world.meteors) {
        const ratio = Math.max(0, m.life / m.maxLife);
        const grad = ctx.createLinearGradient(
          m.x,
          m.y,
          m.x - m.vx * 0.22,
          m.y - m.vy * 0.22
        );
        grad.addColorStop(0, `rgba(250, 246, 235, ${0.9 * ratio})`);
        grad.addColorStop(0.4, `rgba(229, 193, 88, ${0.55 * ratio})`);
        grad.addColorStop(1, 'rgba(229, 193, 88, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 0.22, m.y - m.vy * 0.22);
        ctx.stroke();
      }

      // 3. Rotating Outer Astrolabe & 12 Zodiac Houses
      const outerR = R * 1.06;
      const midR = R * 0.85;
      const innerR = R * 0.48;
      const activeIdx = world.activeHouseIndex;
      const houseProgress = Math.min(1, world.houseTimer / world.houseDuration);

      // Highlighted active wedge glow
      const sectorSpan = (Math.PI * 2) / 12;
      const activeSectorAngle = wheelAngle + activeIdx * sectorSpan;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, activeSectorAngle - sectorSpan * 0.5, activeSectorAngle + sectorSpan * 0.5);
      ctx.closePath();
      const wedgeGrad = ctx.createRadialGradient(cx, cy, innerR * 0.5, cx, cy, outerR);
      wedgeGrad.addColorStop(0, 'rgba(212, 175, 55, 0.02)');
      wedgeGrad.addColorStop(0.75, 'rgba(212, 175, 55, 0.14)');
      wedgeGrad.addColorStop(1, 'rgba(229, 193, 88, 0.24)');
      ctx.fillStyle = wedgeGrad;
      ctx.fill();
      ctx.restore();

      // Concentric astrolabe brass rings
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.36)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.26)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, midR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(147, 197, 253, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.stroke();

      // 72-step degree tick marks on outer ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(wheelAngle);
      for (let i = 0; i < 72; i++) {
        const ang = (i / 72) * Math.PI * 2;
        const isHouseBound = i % 6 === 0;
        const rStart = isHouseBound ? midR : outerR - R * 0.045;
        ctx.strokeStyle = isHouseBound
          ? 'rgba(212, 175, 55, 0.34)'
          : 'rgba(212, 175, 55, 0.2)';
        ctx.lineWidth = isHouseBound ? 1.2 : 0.8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * rStart, Math.sin(ang) * rStart);
        ctx.lineTo(Math.cos(ang) * outerR, Math.sin(ang) * outerR);
        ctx.stroke();
      }
      ctx.restore();

      // 12 Vector Zodiac Glyphs placed upright around the zodiac band
      const glyphOrbitR = (outerR + midR) * 0.5;
      const glyphSize = Math.max(12, R * 0.092);
      for (let i = 0; i < 12; i++) {
        const ang = wheelAngle + i * sectorSpan;
        const gx = cx + Math.cos(ang) * glyphOrbitR;
        const gy = cy + Math.sin(ang) * glyphOrbitR;
        const isAct = i === activeIdx;
        ctx.strokeStyle = isAct ? '#fde047' : 'rgba(229, 193, 88, 0.56)';
        ctx.lineWidth = isAct ? 1.9 : 1.25;
        drawZodiacGlyph(ctx, i, gx, gy, isAct ? glyphSize * 1.15 : glyphSize);
      }

      // 4. Counter-rotating Sacred Geometry Inner Dial
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(innerRingAngle);
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.14)';
      ctx.lineWidth = 1;
      for (let tri = 0; tri < 2; tri++) {
        ctx.beginPath();
        for (let v = 0; v < 3; v++) {
          const va = (v / 3) * Math.PI * 2 + (tri * Math.PI) / 3;
          const vx = Math.cos(va) * midR * 0.96;
          const vy = Math.sin(va) * midR * 0.96;
          if (v === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();

      // 5. Planetary Orbits, Planets, and Geometric Aspect Filaments
      for (const p of world.planets) {
        const pr = p.orbitRatio * R;
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.11)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, pr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      for (const asp of world.aspects) {
        const isGoldAspect = asp.kind === 'trine' || asp.kind === 'conjunction';
        ctx.strokeStyle = isGoldAspect
          ? `rgba(250, 204, 21, ${(0.22 + 0.34 * asp.strength).toFixed(2)})`
          : `rgba(147, 197, 253, ${(0.18 + 0.28 * asp.strength).toFixed(2)})`;
        ctx.lineWidth = isGoldAspect ? 1.2 : 0.9;
        ctx.beginPath();
        ctx.moveTo(asp.x1, asp.y1);
        ctx.lineTo(asp.x2, asp.y2);
        ctx.stroke();
      }

      for (const p of world.planets) {
        const pr = p.orbitRatio * R;
        const px = cx + Math.cos(p.angle) * pr;
        const py = cy + Math.sin(p.angle) * pr;

        const halo = ctx.createRadialGradient(px, py, 0, px, py, p.radius * 2.8);
        halo.addColorStop(0, `${p.color}66`);
        halo.addColorStop(1, 'rgba(7, 11, 26, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, p.radius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        if (p.hasRing) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(-0.35);
          ctx.scale(1, 0.38);
          ctx.strokeStyle = 'rgba(229, 193, 88, 0.72)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius * 1.85, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Active Zodiac Constellation Spotlight (progressive filament trace inside inner field)
      const activeConst = ZODIAC_CONSTELLATIONS[activeIdx];
      const constScale = innerR * 0.78;
      const traceProgress = prefersReducedMotion
        ? 1
        : Math.min(1, houseProgress * 2.4);
      const fadeEnvelope = prefersReducedMotion
        ? 1
        : houseProgress < 0.1
          ? houseProgress / 0.1
          : houseProgress > 0.88
            ? (1 - houseProgress) / 0.12
            : 1;

      if (activeConst && fadeEnvelope > 0.02) {
        ctx.save();
        ctx.globalAlpha = fadeEnvelope;

        const edgeCount = activeConst.edges.length;
        const drawnEdges = traceProgress * edgeCount;
        ctx.strokeStyle = 'rgba(250, 224, 108, 0.76)';
        ctx.lineWidth = 1.5;

        for (let eIdx = 0; eIdx < edgeCount; eIdx++) {
          const [aIdx, bIdx] = activeConst.edges[eIdx];
          const sa = activeConst.stars[aIdx];
          const sb = activeConst.stars[bIdx];
          const segT = Math.max(0, Math.min(1, drawnEdges - eIdx));
          if (segT <= 0) continue;

          const ax = cx + sa.x * constScale;
          const ay = cy + sa.y * constScale;
          const bx = cx + sb.x * constScale;
          const by = cy + sb.y * constScale;

          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + (bx - ax) * segT, ay + (by - ay) * segT);
          ctx.stroke();
        }

        for (const st of activeConst.stars) {
          const sx = cx + st.x * constScale;
          const sy = cy + st.y * constScale;
          const pulse = 0.82 + 0.18 * Math.sin(elapsed * 3.4 + st.x * 5);
          drawFourPointStar(ctx, sx, sy, (4.2 + st.mag * 3.8) * pulse, '#faf6eb', fadeEnvelope);
        }

        // Subtle Latin constellation inscription below inner wheel
        ctx.fillStyle = 'rgba(250, 246, 235, 0.78)';
        ctx.font = `600 ${Math.max(10, Math.round(R * 0.062))}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.fillText(
          `${activeConst.name} · ${activeConst.element}`,
          cx,
          cy + outerR + Math.max(18, R * 0.11)
        );
        ctx.restore();
      }
    };

    handleResize();
    drawFrame(0);
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let lastTime = 0;
    if (!prefersReducedMotion) {
      const tick = (now: number) => {
        if (now - lastTime >= 36) {
          const dt = lastTime ? Math.min(0.08, (now - lastTime) / 1000) : 0.036;
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
      data-testid="zodiac-bg-canvas"
      className="tb-zodiac-canvas"
      aria-hidden="true"
    />
  );
}

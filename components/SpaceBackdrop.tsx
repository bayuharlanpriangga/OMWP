'use client';

import React from 'react';

interface Star {
  x: number;
  y: number;
  layer: 1 | 2 | 3;
  radius: number;
  baseAlpha: number;
  phase: number;
  twinkleSpeed: number;
  color: string;
  hasSpikes: boolean;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number;
}

const SPECTRAL_COLORS = [
  '#d2e9ff', // Class O/B blue-white
  '#9ecaff', // Class B celestial blue
  '#f8fbff', // Class A/F pure white
  '#fff0d2', // Class G solar cream-gold
  '#ffd09b', // Class K warm amber
];

export function SpaceBackdrop() {
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
    let stars: Star[] = [];
    const meteors: Meteor[] = [];

    const buildOffscreenCosmos = (w: number, h: number) => {
      if (!bgCtx) return;
      bgCanvas.width = w;
      bgCanvas.height = h;

      // 1. Deep space obsidian sky gradient
      const sky = bgCtx.createLinearGradient(0, 0, w, h);
      sky.addColorStop(0, '#02040b');
      sky.addColorStop(0.45, '#040b1b');
      sky.addColorStop(1, '#02050d');
      bgCtx.fillStyle = sky;
      bgCtx.fillRect(0, 0, w, h);

      // 2. Galactic Milky Way band running diagonally across the sky
      bgCtx.save();
      bgCtx.translate(w * 0.46, h * 0.54);
      bgCtx.rotate(-0.48);
      const span = Math.max(w, h) * 1.5;
      const bandGrad = bgCtx.createLinearGradient(0, -h * 0.38, 0, h * 0.38);
      bandGrad.addColorStop(0, 'rgba(30, 64, 130, 0)');
      bandGrad.addColorStop(0.28, 'rgba(42, 88, 168, 0.17)');
      bandGrad.addColorStop(0.5, 'rgba(92, 152, 224, 0.26)');
      bandGrad.addColorStop(0.72, 'rgba(42, 88, 168, 0.15)');
      bandGrad.addColorStop(1, 'rgba(30, 64, 130, 0)');
      bgCtx.fillStyle = bandGrad;
      bgCtx.fillRect(-span * 0.6, -h * 0.38, span * 1.2, h * 0.76);

      // Dense galactic core star clouds along the band
      for (let i = 0; i < 420; i++) {
        const bx = (Math.random() - 0.5) * span * 0.95;
        const spread = (Math.random() + Math.random() - 1) * h * 0.19;
        const br = 0.35 + Math.random() * 0.7;
        bgCtx.globalAlpha = 0.18 + Math.random() * 0.42;
        bgCtx.fillStyle =
          i % 7 === 0 ? '#ffe7ba' : i % 3 === 0 ? '#bae6fd' : '#eef4ff';
        bgCtx.beginPath();
        bgCtx.arc(bx, spread, br, 0, Math.PI * 2);
        bgCtx.fill();
      }
      bgCtx.globalAlpha = 1;

      // Dark cosmic dust rift carving through the center of the Milky Way
      const dustGrad = bgCtx.createLinearGradient(0, -h * 0.085, 0, h * 0.085);
      dustGrad.addColorStop(0, 'rgba(2, 4, 10, 0)');
      dustGrad.addColorStop(0.5, 'rgba(2, 4, 11, 0.48)');
      dustGrad.addColorStop(1, 'rgba(2, 4, 10, 0)');
      bgCtx.fillStyle = dustGrad;
      bgCtx.fillRect(-span * 0.55, -h * 0.085, span * 1.1, h * 0.17);
      bgCtx.restore();

      // 3. Multi-hue Hubble / JWST-style volumetric emission nebulae
      const nebulae: Array<[number, number, number, string, string]> = [
        [
          w * 0.2,
          h * 0.74,
          Math.max(w, h) * 0.42,
          'rgba(52, 116, 204, 0.26)',
          'rgba(18, 44, 96, 0)',
        ],
        [
          w * 0.42,
          h * 0.48,
          Math.max(w, h) * 0.34,
          'rgba(56, 189, 248, 0.16)',
          'rgba(56, 189, 248, 0)',
        ],
        [
          w * 0.62,
          h * 0.36,
          Math.max(w, h) * 0.3,
          'rgba(139, 92, 246, 0.13)',
          'rgba(139, 92, 246, 0)',
        ],
        [
          w * 0.28,
          h * 0.66,
          Math.max(w, h) * 0.24,
          'rgba(245, 184, 92, 0.11)',
          'rgba(245, 184, 92, 0)',
        ],
      ];

      for (const [nx, ny, nr, inner, outer] of nebulae) {
        const rg = bgCtx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        rg.addColorStop(0, inner);
        rg.addColorStop(0.55, inner.replace(/[\d.]+\)$/, '0.05)'));
        rg.addColorStop(1, outer);
        bgCtx.fillStyle = rg;
        bgCtx.fillRect(0, 0, w, h);
      }

      // 4. Distant tilted spiral galaxy with subtle core + arms in upper-left quadrant
      bgCtx.save();
      bgCtx.translate(w * 0.13, h * 0.24);
      bgCtx.rotate(-0.48);
      bgCtx.scale(2.3, 0.72);
      const galR = Math.max(24, Math.min(w, h) * 0.058);
      const galGrad = bgCtx.createRadialGradient(0, 0, 0, 0, 0, galR);
      galGrad.addColorStop(0, 'rgba(255, 246, 226, 0.72)');
      galGrad.addColorStop(0.24, 'rgba(245, 210, 148, 0.36)');
      galGrad.addColorStop(0.54, 'rgba(147, 197, 253, 0.18)');
      galGrad.addColorStop(1, 'rgba(125, 211, 252, 0)');
      bgCtx.fillStyle = galGrad;
      bgCtx.beginPath();
      bgCtx.arc(0, 0, galR, 0, Math.PI * 2);
      bgCtx.fill();
      // Faint spiral dust arc
      bgCtx.strokeStyle = 'rgba(186, 230, 253, 0.18)';
      bgCtx.lineWidth = 1.4;
      bgCtx.beginPath();
      bgCtx.arc(0, 0, galR * 0.58, 0.2, Math.PI * 0.9);
      bgCtx.stroke();
      bgCtx.beginPath();
      bgCtx.arc(0, 0, galR * 0.58, Math.PI + 0.2, Math.PI * 1.9);
      bgCtx.stroke();
      bgCtx.restore();

      // 5. Micro-pinpoint background field stars baked onto static layer
      for (let i = 0; i < 360; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * h;
        const sr = 0.38 + Math.random() * 0.65;
        bgCtx.globalAlpha = 0.22 + Math.random() * 0.42;
        bgCtx.fillStyle = SPECTRAL_COLORS[i % SPECTRAL_COLORS.length];
        bgCtx.beginPath();
        bgCtx.arc(sx, sy, sr, 0, Math.PI * 2);
        bgCtx.fill();
      }
      bgCtx.globalAlpha = 1;
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

      buildOffscreenCosmos(w, h);

      const starCount = w < 640 ? 150 : 260;
      stars = Array.from({ length: starCount }, (_, i) => {
        const layer: 1 | 2 | 3 = i % 10 === 0 ? 3 : i % 3 === 0 ? 2 : 1;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          layer,
          radius:
            layer === 3
              ? 1.55 + Math.random() * 1.2
              : layer === 2
                ? 0.95 + Math.random() * 0.7
                : 0.55 + Math.random() * 0.55,
          baseAlpha:
            layer === 3 ? 0.85 + Math.random() * 0.15 : 0.48 + Math.random() * 0.48,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.75 + Math.random() * 1.8,
          color: SPECTRAL_COLORS[i % SPECTRAL_COLORS.length],
          hasSpikes: layer === 3 && i % 20 === 0,
        };
      });
    };

    const drawRingedPlanet = (time: number) => {
      const isNarrow = width < 640;
      const cx = width * (isNarrow ? 0.81 : 0.8);
      const cy = height * (isNarrow ? 0.22 : 0.25);
      const pr = Math.max(48, Math.min(118, Math.min(width, height) * 0.13));
      const ringTilt = -0.32 + Math.sin(time * 0.08) * 0.015;
      const ringOuterR = pr * 2.38;
      const ringFlatness = 0.26;

      // Uses true circular radial gradient scaled vertically by 0.26 so concentric rings & Cassini gap project cleanly 360°!
      const drawRingHalf = (frontHalf: boolean) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ringTilt);
        ctx.scale(1, ringFlatness);

        ctx.beginPath();
        if (frontHalf) {
          ctx.rect(-ringOuterR * 1.15, 0, ringOuterR * 2.3, ringOuterR * 1.15);
        } else {
          ctx.rect(
            -ringOuterR * 1.15,
            -ringOuterR * 1.15,
            ringOuterR * 2.3,
            ringOuterR * 1.15
          );
        }
        ctx.clip();

        const ringGrad = ctx.createRadialGradient(
          0,
          0,
          pr * 1.24,
          0,
          0,
          ringOuterR
        );
        ringGrad.addColorStop(0, 'rgba(125, 211, 252, 0)');
        ringGrad.addColorStop(0.12, 'rgba(148, 186, 224, 0.24)');
        ringGrad.addColorStop(0.28, 'rgba(226, 238, 252, 0.48)');
        ringGrad.addColorStop(0.45, 'rgba(202, 218, 238, 0.36)');
        // Dark Cassini Division gap
        ringGrad.addColorStop(0.51, 'rgba(3, 6, 14, 0.08)');
        ringGrad.addColorStop(0.57, 'rgba(3, 6, 14, 0.06)');
        // Outer A-ring with sunlit pale gold/ice sheen
        ringGrad.addColorStop(0.63, 'rgba(245, 212, 145, 0.38)');
        ringGrad.addColorStop(0.84, 'rgba(165, 208, 242, 0.24)');
        ringGrad.addColorStop(1, 'rgba(125, 211, 252, 0)');

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(0, 0, ringOuterR, 0, Math.PI * 2);
        ctx.fill();

        // Planet umbral shadow cast obliquely onto the back rings (night side upper-right)
        if (!frontHalf) {
          const shGrad = ctx.createLinearGradient(
            pr * 0.2,
            0,
            ringOuterR * 0.78,
            -ringOuterR * 0.72
          );
          shGrad.addColorStop(0, 'rgba(2, 4, 10, 0.94)');
          shGrad.addColorStop(0.75, 'rgba(2, 4, 10, 0.78)');
          shGrad.addColorStop(1, 'rgba(2, 4, 10, 0)');
          ctx.fillStyle = shGrad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(pr * 0.75, -ringOuterR * 1.1);
          ctx.lineTo(ringOuterR * 1.15, -ringOuterR * 1.1);
          ctx.lineTo(ringOuterR * 1.15, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      };

      // 1. Back half of planetary rings
      drawRingHalf(false);

      // 2. Outer atmospheric scattering halo
      const auraGrad = ctx.createRadialGradient(
        cx - pr * 0.25,
        cy - pr * 0.25,
        pr * 0.88,
        cx,
        cy,
        pr * 1.24
      );
      auraGrad.addColorStop(0, 'rgba(125, 211, 252, 0.28)');
      auraGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.08)');
      auraGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, pr * 1.24, 0, Math.PI * 2);
      ctx.fill();

      // 3. Planet globe with cloud belts and directional solar terminator
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, pr, 0, Math.PI * 2);
      ctx.clip();

      const planetBase = ctx.createLinearGradient(
        cx - pr * 0.85,
        cy - pr * 0.85,
        cx + pr * 0.9,
        cy + pr * 0.9
      );
      planetBase.addColorStop(0, '#e2efff');
      planetBase.addColorStop(0.32, '#82add4');
      planetBase.addColorStop(0.66, '#274269');
      planetBase.addColorStop(1, '#070f1e');
      ctx.fillStyle = planetBase;
      ctx.fillRect(cx - pr, cy - pr, pr * 2, pr * 2);

      // Atmospheric gas giant cloud belts
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ringTilt);
      const bands: Array<[number, number, string]> = [
        [-pr * 0.62, pr * 0.14, 'rgba(245, 224, 178, 0.18)'],
        [-pr * 0.34, pr * 0.18, 'rgba(147, 197, 253, 0.20)'],
        [-pr * 0.06, pr * 0.12, 'rgba(245, 196, 81, 0.16)'],
        [pr * 0.22, pr * 0.2, 'rgba(125, 211, 252, 0.16)'],
        [pr * 0.56, pr * 0.14, 'rgba(226, 232, 240, 0.14)'],
      ];
      for (const [by, bh, bColor] of bands) {
        ctx.fillStyle = bColor;
        ctx.fillRect(-pr * 1.2, by, pr * 2.4, bh);
      }
      ctx.restore();

      // Shadow terminator across lower-right night hemisphere
      const terminator = ctx.createRadialGradient(
        cx - pr * 0.52,
        cy - pr * 0.44,
        pr * 0.12,
        cx + pr * 0.26,
        cy + pr * 0.22,
        pr * 1.38
      );
      terminator.addColorStop(0, 'rgba(255, 250, 235, 0.18)');
      terminator.addColorStop(0.46, 'rgba(12, 24, 48, 0.20)');
      terminator.addColorStop(0.74, 'rgba(4, 8, 18, 0.88)');
      terminator.addColorStop(1, 'rgba(2, 4, 10, 0.98)');
      ctx.fillStyle = terminator;
      ctx.fillRect(cx - pr, cy - pr, pr * 2, pr * 2);

      // Sunlit Rayleigh scattering rim along upper-left edge
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.52)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(cx, cy, pr - 1, Math.PI * 0.82, Math.PI * 1.62);
      ctx.stroke();

      ctx.restore();

      // 4. Front half of planetary rings crossing planet equator
      drawRingHalf(true);

      // 5. Orbiting icy crescent moon
      const orbitAngle = 0.55 + time * 0.11;
      const moonX = cx + Math.cos(orbitAngle) * pr * 2.72;
      const moonY = cy + Math.sin(orbitAngle) * pr * 0.82;
      const moonR = Math.max(7, pr * 0.13);

      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = '#d0e0f0';
      ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);

      const moonShadow = ctx.createRadialGradient(
        moonX - moonR * 0.46,
        moonY - moonR * 0.36,
        moonR * 0.08,
        moonX + moonR * 0.22,
        moonY + moonR * 0.22,
        moonR * 1.25
      );
      moonShadow.addColorStop(0, 'rgba(255, 250, 240, 0.24)');
      moonShadow.addColorStop(0.55, 'rgba(15, 26, 48, 0.55)');
      moonShadow.addColorStop(1, 'rgba(2, 4, 10, 0.98)');
      ctx.fillStyle = moonShadow;
      ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
      ctx.restore();
    };

    const drawFrame = (dt: number) => {
      if (width <= 0 || height <= 0) return;
      elapsed += dt;

      // 1. Blit pre-rendered deep-space nebula + Milky Way
      if (bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0);
      } else {
        ctx.fillStyle = '#03060e';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Parallax drifting & scintillating spectral starfield
      for (const s of stars) {
        if (dt > 0) {
          s.x -= s.layer * 0.075;
          if (s.x < -6) s.x = width + 6;
        }
        const twinkle = 0.66 + 0.34 * Math.sin(elapsed * s.twinkleSpeed + s.phase);
        const alpha = Math.max(0.18, Math.min(1, s.baseAlpha * twinkle));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        if (s.hasSpikes) {
          const spikeLen = s.radius * 4.6;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(s.x - spikeLen, s.y);
          ctx.lineTo(s.x + spikeLen, s.y);
          ctx.moveTo(s.x, s.y - spikeLen);
          ctx.lineTo(s.x, s.y + spikeLen);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // 3. Ringed gas giant & orbiting crescent moon
      drawRingedPlanet(elapsed);

      // 4. Periodic shooting stars across the upper dark sky
      if (dt > 0 && Math.random() < 0.02 && meteors.length < 2) {
        meteors.push({
          x: Math.random() * width * 0.78,
          y: Math.random() * height * 0.42,
          vx: 8.5 + Math.random() * 5,
          vy: 3.4 + Math.random() * 2.4,
          length: 5.5 + Math.random() * 3,
          life: 1,
        });
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.036;
        if (m.life <= 0 || m.x > width + 80 || m.y > height + 80) {
          meteors.splice(i, 1);
          continue;
        }
        const tailX = m.x - m.vx * m.length;
        const tailY = m.y - m.vy * m.length;
        const trail = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        trail.addColorStop(0, `rgba(240, 249, 255, ${m.life})`);
        trail.addColorStop(0.35, `rgba(125, 211, 252, ${m.life * 0.6})`);
        trail.addColorStop(1, 'rgba(125, 211, 252, 0)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${m.life})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
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
    let lastTick = 0;
    const tick = (now: number) => {
      if (now - lastTick >= 33) {
        const dt = lastTick ? Math.min(0.1, (now - lastTick) / 1000) : 0.033;
        lastTick = now;
        drawFrame(dt);
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="space-astronomy-canvas"
      aria-hidden="true"
      className="tb-space-canvas"
    />
  );
}

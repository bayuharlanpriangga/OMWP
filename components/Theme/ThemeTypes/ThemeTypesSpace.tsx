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

// Monochrome silver / white / ash starlight palette for the black-white-gray space backdrop
const MONOCHROME_STARS = [
  '#ffffff',
  '#f4f4f5',
  '#e4e4e7',
  '#d4d4d8',
  '#a1a1aa',
];

export function ThemeTypesSpace() {
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

      // 1. Deep monochrome obsidian sky gradient (black -> charcoal -> deep black)
      const sky = bgCtx.createLinearGradient(0, 0, w, h);
      sky.addColorStop(0, '#030305');
      sky.addColorStop(0.45, '#0b0b0f');
      sky.addColorStop(1, '#040406');
      bgCtx.fillStyle = sky;
      bgCtx.fillRect(0, 0, w, h);

      // 2. Monochrome Galactic Milky Way band running diagonally across the sky
      bgCtx.save();
      bgCtx.translate(w * 0.46, h * 0.54);
      bgCtx.rotate(-0.48);
      const span = Math.max(w, h) * 1.5;
      const bandGrad = bgCtx.createLinearGradient(0, -h * 0.38, 0, h * 0.38);
      bandGrad.addColorStop(0, 'rgba(63, 63, 70, 0)');
      bandGrad.addColorStop(0.28, 'rgba(113, 113, 122, 0.14)');
      bandGrad.addColorStop(0.5, 'rgba(212, 212, 216, 0.22)');
      bandGrad.addColorStop(0.72, 'rgba(113, 113, 122, 0.13)');
      bandGrad.addColorStop(1, 'rgba(63, 63, 70, 0)');
      bgCtx.fillStyle = bandGrad;
      bgCtx.fillRect(-span * 0.6, -h * 0.38, span * 1.2, h * 0.76);

      // Dense galactic core star clouds along the band
      for (let i = 0; i < 400; i++) {
        const bx = (Math.random() - 0.5) * span * 0.95;
        const spread = (Math.random() + Math.random() - 1) * h * 0.19;
        const br = 0.45 + Math.random() * 0.75;
        bgCtx.globalAlpha = 0.16 + Math.random() * 0.38;
        bgCtx.fillStyle =
          i % 5 === 0 ? '#ffffff' : i % 2 === 0 ? '#d4d4d8' : '#a1a1aa';
        bgCtx.fillRect(bx, spread, br * 1.6, br * 1.6);
      }
      bgCtx.globalAlpha = 1;

      // Dark cosmic dust rift carving through the center of the Milky Way
      const dustGrad = bgCtx.createLinearGradient(0, -h * 0.085, 0, h * 0.085);
      dustGrad.addColorStop(0, 'rgba(4, 4, 6, 0)');
      dustGrad.addColorStop(0.5, 'rgba(4, 4, 6, 0.54)');
      dustGrad.addColorStop(1, 'rgba(4, 4, 6, 0)');
      bgCtx.fillStyle = dustGrad;
      bgCtx.fillRect(-span * 0.55, -h * 0.085, span * 1.1, h * 0.17);
      bgCtx.restore();

      // 3. Monochrome silver-ash interstellar nebulae (zero blue tint)
      const nebulae: Array<[number, number, number, string, string]> = [
        [
          w * 0.2,
          h * 0.74,
          Math.max(w, h) * 0.42,
          'rgba(161, 161, 170, 0.16)',
          'rgba(39, 39, 42, 0)',
        ],
        [
          w * 0.42,
          h * 0.48,
          Math.max(w, h) * 0.34,
          'rgba(228, 228, 231, 0.12)',
          'rgba(63, 63, 70, 0)',
        ],
        [
          w * 0.62,
          h * 0.36,
          Math.max(w, h) * 0.3,
          'rgba(113, 113, 122, 0.14)',
          'rgba(39, 39, 42, 0)',
        ],
        [
          w * 0.28,
          h * 0.66,
          Math.max(w, h) * 0.24,
          'rgba(244, 244, 245, 0.09)',
          'rgba(63, 63, 70, 0)',
        ],
      ];

      for (const [nx, ny, nr, inner, outer] of nebulae) {
        const rg = bgCtx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        rg.addColorStop(0, inner);
        rg.addColorStop(0.55, inner.replace(/[\d.]+\)$/, '0.04)'));
        rg.addColorStop(1, outer);
        bgCtx.fillStyle = rg;
        bgCtx.fillRect(0, 0, w, h);
      }

      // 4. Distant tilted monochrome spiral galaxy in upper-left quadrant
      bgCtx.save();
      bgCtx.translate(w * 0.13, h * 0.24);
      bgCtx.rotate(-0.48);
      bgCtx.scale(2.3, 0.72);
      const galR = Math.max(24, Math.min(w, h) * 0.058);
      const galGrad = bgCtx.createRadialGradient(0, 0, 0, 0, 0, galR);
      galGrad.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
      galGrad.addColorStop(0.28, 'rgba(212, 212, 216, 0.34)');
      galGrad.addColorStop(0.58, 'rgba(161, 161, 170, 0.14)');
      galGrad.addColorStop(1, 'rgba(113, 113, 122, 0)');
      bgCtx.fillStyle = galGrad;
      bgCtx.beginPath();
      bgCtx.arc(0, 0, galR, 0, Math.PI * 2);
      bgCtx.fill();
      bgCtx.strokeStyle = 'rgba(228, 228, 231, 0.22)';
      bgCtx.lineWidth = 1.4;
      bgCtx.beginPath();
      bgCtx.arc(0, 0, galR * 0.58, 0.2, Math.PI * 0.9);
      bgCtx.stroke();
      bgCtx.beginPath();
      bgCtx.arc(0, 0, galR * 0.58, Math.PI + 0.2, Math.PI * 1.9);
      bgCtx.stroke();
      bgCtx.restore();

      // 5. Micro-pinpoint monochrome field stars baked onto static layer
      for (let i = 0; i < 340; i++) {
        const sx = Math.random() * w;
        const sy = Math.random() * h;
        const sr = 0.65 + Math.random() * 0.9;
        bgCtx.globalAlpha = 0.24 + Math.random() * 0.44;
        bgCtx.fillStyle = MONOCHROME_STARS[i % MONOCHROME_STARS.length];
        bgCtx.fillRect(sx, sy, sr, sr);
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

      const starCount = w < 640 ? 140 : 240;
      stars = Array.from({ length: starCount }, (_, i) => {
        const layer: 1 | 2 | 3 = i % 10 === 0 ? 3 : i % 3 === 0 ? 2 : 1;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          layer,
          radius:
            layer === 3
              ? 1.55 + Math.random() * 1.15
              : layer === 2
                ? 0.95 + Math.random() * 0.65
                : 0.55 + Math.random() * 0.55,
          baseAlpha:
            layer === 3 ? 0.86 + Math.random() * 0.14 : 0.48 + Math.random() * 0.48,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.75 + Math.random() * 1.8,
          color: MONOCHROME_STARS[i % MONOCHROME_STARS.length],
          hasSpikes: layer === 3 && i % 20 === 0,
        };
      });
    };

    // Authentic Saturn with realistic golden-cream, ochre/tan atmospheric cloud belts & icy-beige rings
    const drawSaturn = (time: number) => {
      const isNarrow = width < 640;
      const cx = width * (isNarrow ? 0.8 : 0.8);
      const cy = height * (isNarrow ? 0.22 : 0.25);
      const pr = Math.max(48, Math.min(118, Math.min(width, height) * 0.13));
      const ringTilt = -0.32 + Math.sin(time * 0.08) * 0.015;
      const ringOuterR = pr * 2.42;
      const ringFlatness = 0.26;

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

        // Authentic Saturn ring system: C-ring (crepe) -> bright B-ring -> Cassini Division -> A-ring -> Encke Gap -> F-ring
        const ringGrad = ctx.createRadialGradient(
          0,
          0,
          pr * 1.22,
          0,
          0,
          ringOuterR
        );
        ringGrad.addColorStop(0, 'rgba(155, 138, 114, 0)');
        ringGrad.addColorStop(0.11, 'rgba(148, 132, 108, 0.24)'); // Crepe C-ring
        ringGrad.addColorStop(0.24, 'rgba(232, 214, 178, 0.56)'); // Dense inner B-ring
        ringGrad.addColorStop(0.39, 'rgba(246, 232, 200, 0.64)'); // Bright sunlit cream B-ring
        ringGrad.addColorStop(0.49, 'rgba(208, 188, 154, 0.44)');
        // Dark Cassini Division gap
        ringGrad.addColorStop(0.525, 'rgba(8, 7, 6, 0.10)');
        ringGrad.addColorStop(0.585, 'rgba(8, 7, 6, 0.08)');
        // Outer A-ring with dusty cream-taupe sheen & faint Encke notch
        ringGrad.addColorStop(0.635, 'rgba(226, 206, 172, 0.46)');
        ringGrad.addColorStop(0.81, 'rgba(198, 178, 148, 0.34)');
        ringGrad.addColorStop(0.85, 'rgba(92, 82, 68, 0.14)'); // Subtle Encke gap
        ringGrad.addColorStop(0.89, 'rgba(205, 186, 155, 0.26)');
        ringGrad.addColorStop(0.96, 'rgba(170, 152, 128, 0.14)');
        ringGrad.addColorStop(1, 'rgba(140, 126, 106, 0)');

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(0, 0, ringOuterR, 0, Math.PI * 2);
        ctx.fill();

        // Planet umbral shadow cast obliquely across the back half of the rings
        if (!frontHalf) {
          const shGrad = ctx.createLinearGradient(
            pr * 0.2,
            0,
            ringOuterR * 0.78,
            -ringOuterR * 0.72
          );
          shGrad.addColorStop(0, 'rgba(5, 4, 4, 0.94)');
          shGrad.addColorStop(0.75, 'rgba(5, 4, 4, 0.78)');
          shGrad.addColorStop(1, 'rgba(5, 4, 4, 0)');
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

      // 1. Back half of Saturn's rings
      drawRingHalf(false);

      // 2. Subtle warm cream atmospheric glow around Saturn (strictly concentric to prevent hard gradient edge)
      const auraGrad = ctx.createRadialGradient(
        cx,
        cy,
        pr * 0.88,
        cx,
        cy,
        pr * 1.32
      );
      auraGrad.addColorStop(0, 'rgba(244, 226, 186, 0.14)');
      auraGrad.addColorStop(0.55, 'rgba(196, 162, 108, 0.04)');
      auraGrad.addColorStop(1, 'rgba(196, 162, 108, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, pr * 1.32, 0, Math.PI * 2);
      ctx.fill();

      // 3. Saturn globe with authentic golden-cream & ochre atmospheric bands
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
      planetBase.addColorStop(0, '#f5e9ce');
      planetBase.addColorStop(0.32, '#dfc28d');
      planetBase.addColorStop(0.68, '#a47d47');
      planetBase.addColorStop(1, '#261d12');
      ctx.fillStyle = planetBase;
      ctx.fillRect(cx - pr, cy - pr, pr * 2, pr * 2);

      // Authentic horizontal atmospheric cloud belts tilted with Saturn's axial obliquity
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ringTilt);
      const bands: Array<[number, number, string]> = [
        [-pr * 0.92, pr * 0.24, 'rgba(116, 112, 96, 0.34)'], // North polar olive-slate region
        [-pr * 0.64, pr * 0.16, 'rgba(228, 204, 160, 0.28)'], // North temperate belt
        [-pr * 0.42, pr * 0.18, 'rgba(184, 144, 88, 0.32)'], // North tropical belt
        [-pr * 0.14, pr * 0.22, 'rgba(252, 241, 212, 0.40)'], // Bright cream-gold equatorial zone
        [pr * 0.14, pr * 0.16, 'rgba(168, 124, 72, 0.34)'], // South equatorial belt
        [pr * 0.38, pr * 0.20, 'rgba(222, 198, 155, 0.26)'], // South temperate zone
        [pr * 0.68, pr * 0.28, 'rgba(98, 86, 68, 0.34)'], // South polar haze
      ];
      for (const [by, bh, bColor] of bands) {
        ctx.fillStyle = bColor;
        ctx.fillRect(-pr * 1.2, by, pr * 2.4, bh);
      }
      ctx.restore();

      // Natural solar terminator across night hemisphere
      const terminator = ctx.createRadialGradient(
        cx - pr * 0.52,
        cy - pr * 0.44,
        pr * 0.12,
        cx + pr * 0.26,
        cy + pr * 0.22,
        pr * 1.38
      );
      terminator.addColorStop(0, 'rgba(255, 250, 235, 0.16)');
      terminator.addColorStop(0.46, 'rgba(32, 24, 16, 0.18)');
      terminator.addColorStop(0.75, 'rgba(10, 8, 6, 0.88)');
      terminator.addColorStop(1, 'rgba(4, 3, 2, 0.98)');
      ctx.fillStyle = terminator;
      ctx.fillRect(cx - pr, cy - pr, pr * 2, pr * 2);

      // Sunlit warm cream atmospheric rim
      ctx.strokeStyle = 'rgba(246, 234, 204, 0.48)';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.arc(cx, cy, pr - 1, Math.PI * 0.82, Math.PI * 1.62);
      ctx.stroke();

      ctx.restore();

      // 4. Front half of Saturn's rings crossing equator
      drawRingHalf(true);

      // 5. Orbiting monochrome gray/silver moon (Enceladus / Tethys style)
      const orbitAngle = 0.55 + time * 0.11;
      const moonX = cx + Math.cos(orbitAngle) * pr * 2.72;
      const moonY = cy + Math.sin(orbitAngle) * pr * 0.82;
      const moonR = Math.max(7, pr * 0.13);

      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = '#d4d4d8';
      ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);

      const moonShadow = ctx.createRadialGradient(
        moonX - moonR * 0.46,
        moonY - moonR * 0.36,
        moonR * 0.08,
        moonX + moonR * 0.22,
        moonY + moonR * 0.22,
        moonR * 1.25
      );
      moonShadow.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
      moonShadow.addColorStop(0.55, 'rgba(39, 39, 42, 0.58)');
      moonShadow.addColorStop(1, 'rgba(5, 5, 7, 0.98)');
      ctx.fillStyle = moonShadow;
      ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
      ctx.restore();
    };

    const drawFrame = (dt: number) => {
      if (width <= 0 || height <= 0) return;
      elapsed += dt;

      // 1. Blit pre-rendered monochrome cosmos + Milky Way
      if (bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0);
      } else {
        ctx.fillStyle = '#050507';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Parallax drifting & scintillating white/silver starfield
      for (const s of stars) {
        if (dt > 0) {
          s.x -= s.layer * 0.075;
          if (s.x < -6) s.x = width + 6;
        }
        const twinkle = 0.66 + 0.34 * Math.sin(elapsed * s.twinkleSpeed + s.phase);
        const alpha = Math.max(0.18, Math.min(1, s.baseAlpha * twinkle));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        if (s.radius <= 1.1 && !s.hasSpikes) {
          const sz = s.radius * 1.75;
          ctx.fillRect(s.x - sz * 0.5, s.y - sz * 0.5, sz, sz);
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }

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

      // 3. Realistic Saturn & orbiting icy monochrome moon
      drawSaturn(elapsed);

      // 4. Periodic silver-white shooting stars across the dark sky
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
        trail.addColorStop(0, `rgba(255, 255, 255, ${m.life})`);
        trail.addColorStop(0.35, `rgba(212, 212, 216, ${m.life * 0.58})`);
        trail.addColorStop(1, 'rgba(161, 161, 170, 0)');
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
      data-testid="space-astronomy-canvas"
      aria-hidden="true"
      className="tb-space-canvas"
    />
  );
}

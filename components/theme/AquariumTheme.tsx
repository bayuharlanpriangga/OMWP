'use client';

import React from 'react';

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  wobble: number;
  phase: number;
}

interface ReefFish {
  x: number;
  y: number;
  vx: number;
  size: number;
  bodyColor: string;
  stripeColor: string;
  finColor: string;
  phase: number;
}

interface Mackerel {
  x: number;
  y: number;
  vx: number;
  size: number;
  phase: number;
}

interface Jellyfish {
  x: number;
  baseY: number;
  vx: number;
  r: number;
  tint: string;
  phase: number;
}

interface KelpBlade {
  x: number;
  baseY: number;
  height: number;
  width: number;
  color: string;
  phase: number;
}

export function AquariumTheme() {
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

    // Pre-rendered light halo sprite for anglerfish esca lure & bioluminescence
    const lureSprite = document.createElement('canvas');
    lureSprite.width = 96;
    lureSprite.height = 96;
    const lsCtx = lureSprite.getContext('2d');
    if (lsCtx) {
      const lg = lsCtx.createRadialGradient(48, 48, 2, 48, 48, 48);
      lg.addColorStop(0, 'rgba(254, 249, 195, 0.92)');
      lg.addColorStop(0.28, 'rgba(103, 232, 249, 0.56)');
      lg.addColorStop(0.62, 'rgba(14, 165, 233, 0.16)');
      lg.addColorStop(1, 'rgba(3, 18, 36, 0)');
      lsCtx.fillStyle = lg;
      lsCtx.fillRect(0, 0, 96, 96);
    }

    let width = 0;
    let height = 0;
    let elapsed = 0;

    let bubbles: Bubble[] = [];
    let reefFish: ReefFish[] = [];
    let mackerels: Mackerel[] = [];
    let jellies: Jellyfish[] = [];
    let kelps: KelpBlade[] = [];

    // Continuous swimmers & bottom dwellers
    let shark = { x: 0, y: 0, vx: 38, scale: 1 };
    let megalodon = { x: 0, y: 0, vx: -24, scale: 1 };
    let angler = { x: 0, y: 0, vx: 22, scale: 1 };
    let octopus = { x: 0, y: 0, vx: -16, scale: 1 };
    let snail = { x: 0, y: 0, vx: 6.5, scale: 1 };

    const buildOffscreenAquarium = (w: number, h: number) => {
      if (!bgCtx) return;
      bgCanvas.width = w;
      bgCanvas.height = h;
      const narrow = w < 640;

      // 1. Deep ocean aquarium water gradient (sunlit cerulean top -> abyssal navy floor)
      const waterGrad = bgCtx.createLinearGradient(0, 0, 0, h);
      waterGrad.addColorStop(0, '#0c5286');
      waterGrad.addColorStop(0.25, '#083a68');
      waterGrad.addColorStop(0.65, '#052242');
      waterGrad.addColorStop(1, '#021024');
      bgCtx.fillStyle = waterGrad;
      bgCtx.fillRect(0, 0, w, h);

      // 2. Soft surface refraction glow
      const surfaceGlow = bgCtx.createLinearGradient(0, 0, 0, h * 0.22);
      surfaceGlow.addColorStop(0, 'rgba(125, 211, 252, 0.28)');
      surfaceGlow.addColorStop(1, 'rgba(12, 74, 110, 0)');
      bgCtx.fillStyle = surfaceGlow;
      bgCtx.fillRect(0, 0, w, h * 0.22);

      // 3. Distant underwater reef rock ridge silhouettes
      bgCtx.fillStyle = 'rgba(4, 24, 48, 0.65)';
      bgCtx.beginPath();
      bgCtx.moveTo(0, h);
      bgCtx.lineTo(0, h * 0.8);
      bgCtx.quadraticCurveTo(w * 0.16, h * 0.72, w * 0.34, h * 0.82);
      bgCtx.quadraticCurveTo(w * 0.52, h * 0.75, w * 0.74, h * 0.83);
      bgCtx.quadraticCurveTo(w * 0.9, h * 0.72, w, h * 0.79);
      bgCtx.lineTo(w, h);
      bgCtx.closePath();
      bgCtx.fill();

      // 4. Sandy seabed floor
      const sandTop = h * 0.885;
      const sandGrad = bgCtx.createLinearGradient(0, sandTop - 16, 0, h);
      sandGrad.addColorStop(0, '#1e3a4c');
      sandGrad.addColorStop(0.35, '#2b4550');
      sandGrad.addColorStop(1, '#132634');
      bgCtx.fillStyle = sandGrad;
      bgCtx.beginPath();
      bgCtx.moveTo(0, h);
      bgCtx.lineTo(0, sandTop);
      bgCtx.quadraticCurveTo(w * 0.28, sandTop - 16, w * 0.56, sandTop + 6);
      bgCtx.quadraticCurveTo(w * 0.82, sandTop - 12, w, sandTop + 4);
      bgCtx.lineTo(w, h);
      bgCtx.closePath();
      bgCtx.fill();

      // Subtle sunlit sand highlight strip & pebbles
      bgCtx.fillStyle = 'rgba(125, 211, 252, 0.1)';
      for (let i = 0; i < 42; i++) {
        const px = ((i * 157) % w);
        const py = sandTop + 10 + ((i * 29) % Math.max(12, h - sandTop - 14));
        bgCtx.beginPath();
        bgCtx.ellipse(px, py, 2 + (i % 4), 1.2 + (i % 2), 0, 0, Math.PI * 2);
        bgCtx.fill();
      }

      // 5. Rounded aquarium stones / coral rocks on seabed
      const rocks: Array<[number, number, number, number, string]> = [
        [w * 0.08, h * 0.92, narrow ? 38 : 64, 28, '#0c2842'],
        [w * 0.14, h * 0.94, narrow ? 28 : 46, 20, '#103252'],
        [w * 0.87, h * 0.93, narrow ? 42 : 70, 30, '#0b253d'],
        [w * 0.78, h * 0.95, narrow ? 30 : 48, 20, '#113454'],
      ];
      for (const [rx, ry, rw, rh, col] of rocks) {
        bgCtx.fillStyle = col;
        bgCtx.beginPath();
        bgCtx.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2);
        bgCtx.fill();
        bgCtx.strokeStyle = 'rgba(125, 211, 252, 0.14)';
        bgCtx.lineWidth = 1.2;
        bgCtx.beginPath();
        bgCtx.arc(rx, ry, rw * 0.72, Math.PI * 1.1, Math.PI * 1.85);
        bgCtx.stroke();
      }

      // 6. Bintang Laut (Starfish) resting naturally on the seabed & rocks
      const drawStarfish = (
        sx: number,
        sy: number,
        outerR: number,
        rot: number,
        color: string,
        dotColor: string
      ) => {
        bgCtx.save();
        bgCtx.translate(sx, sy);
        bgCtx.rotate(rot);
        bgCtx.scale(1, 0.72); // Perspective resting on sandy seabed
        bgCtx.fillStyle = color;
        bgCtx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
        bgCtx.lineWidth = 1.2;
        bgCtx.beginPath();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : outerR * 0.38;
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) bgCtx.moveTo(px, py);
          else bgCtx.lineTo(px, py);
        }
        bgCtx.closePath();
        bgCtx.fill();
        bgCtx.stroke();

        // Starfish ridge dots
        bgCtx.fillStyle = dotColor;
        for (let arm = 0; arm < 5; arm++) {
          const a = (arm * Math.PI * 2) / 5 - Math.PI / 2;
          for (const d of [0.28, 0.5, 0.7]) {
            bgCtx.beginPath();
            bgCtx.arc(Math.cos(a) * outerR * d, Math.sin(a) * outerR * d, 1.5, 0, Math.PI * 2);
            bgCtx.fill();
          }
        }
        bgCtx.restore();
      };

      drawStarfish(w * 0.24, h * 0.935, narrow ? 16 : 22, 0.25, '#fb7185', '#ffe4e6');
      drawStarfish(w * 0.64, h * 0.945, narrow ? 14 : 19, -0.35, '#fb923c', '#ffedd5');
      drawStarfish(w * 0.76, h * 0.92, narrow ? 13 : 17, 0.55, '#f59e0b', '#fef3c7');
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

      buildOffscreenAquarium(w, h);
      const narrow = w < 640;

      // Seaweed / Kelp clusters ("Rumput Laut") on left, center-left stone, and right
      const kelpSpecs: Array<[number, number, number, string]> = [
        [w * 0.04, h * 0.34, 11, '#0d9488'],
        [w * 0.065, h * 0.42, 13, '#10b981'],
        [w * 0.095, h * 0.29, 10, '#14b8a6'],
        [w * 0.13, h * 0.22, 9, '#059669'],
        [w * 0.38, h * 0.16, 8, '#0f766e'],
        [w * 0.4, h * 0.21, 9, '#10b981'],
        [w * 0.85, h * 0.25, 10, '#0d9488'],
        [w * 0.89, h * 0.39, 13, '#14b8a6'],
        [w * 0.925, h * 0.44, 14, '#10b981'],
        [w * 0.96, h * 0.31, 11, '#059669'],
      ];
      kelps = kelpSpecs.map(([kx, kh, kw, col], i) => ({
        x: kx,
        baseY: h * 0.935,
        height: kh * (narrow ? 0.78 : 1),
        width: kw * (narrow ? 0.82 : 1),
        color: col,
        phase: i * 0.85,
      }));

      // Megalodon (massive ancient shark cruising deep upper-mid back)
      megalodon = {
        x: w * 0.72,
        y: h * (narrow ? 0.27 : 0.29),
        vx: -26,
        scale: narrow ? 0.72 : Math.min(1.32, w / 1060),
      };

      // Hiu (Sleek reef shark swimming mid-height)
      shark = {
        x: w * 0.25,
        y: h * (narrow ? 0.42 : 0.44),
        vx: 44,
        scale: narrow ? 0.66 : Math.min(1.08, w / 1180),
      };

      // Ikan Sungut Lampu / Anglerfish (deep zone with glowing lure in front)
      angler = {
        x: w * 0.22,
        y: h * (narrow ? 0.76 : 0.74),
        vx: 22,
        scale: narrow ? 0.74 : 1.0,
      };

      // Gurita (Octopus)
      octopus = {
        x: w * 0.76,
        y: h * (narrow ? 0.69 : 0.68),
        vx: -15,
        scale: narrow ? 0.74 : 1.0,
      };

      // Keong (Sea Snail crawling along sandy bottom)
      snail = {
        x: w * 0.48,
        y: h * 0.925,
        vx: 7.5,
        scale: narrow ? 0.8 : 1.0,
      };

      // Ubur-ubur (Bioluminescent Jellyfish)
      jellies = [
        { x: w * 0.17, baseY: h * 0.27, vx: 6, r: narrow ? 18 : 24, tint: '#7dd3fc', phase: 0.3 },
        { x: w * 0.83, baseY: h * 0.46, vx: -5, r: narrow ? 15 : 21, tint: '#a5f3fc', phase: 2.1 },
        { x: w * 0.56, baseY: h * 0.21, vx: 4.5, r: narrow ? 14 : 18, tint: '#93c5fd', phase: 4.0 },
      ];

      // Sekolah Ikan Kembung (Mackerel school with dorsal stripes & forked tails)
      const macBaseX = w * 0.52;
      const macBaseY = h * 0.56;
      const offsets: Array<[number, number, number]> = [
        [0, 0, 1],
        [-38, -18, 0.92],
        [-44, 20, 0.95],
        [-84, -4, 0.88],
        [-78, 32, 0.85],
        [40, 14, 0.9],
      ];
      mackerels = offsets.map(([ox, oy, sc], idx) => ({
        x: macBaseX + ox * (narrow ? 0.7 : 1),
        y: macBaseY + oy,
        vx: 48,
        size: (narrow ? 14 : 18) * sc,
        phase: idx * 0.9,
      }));

      // Colorful Tropical Aquarium Fish ("Ikan")
      reefFish = [
        { x: w * 0.12, y: h * 0.54, vx: 32, size: narrow ? 13 : 16, bodyColor: '#fb923c', stripeColor: '#fff7ed', finColor: '#ea580c', phase: 0.4 },
        { x: w * 0.35, y: h * 0.2, vx: -36, size: narrow ? 12 : 15, bodyColor: '#38bdf8', stripeColor: '#0f172a', finColor: '#fde047', phase: 1.8 },
        { x: w * 0.66, y: h * 0.78, vx: 29, size: narrow ? 11 : 14, bodyColor: '#facc15', stripeColor: '#0284c7', finColor: '#fef08a', phase: 3.1 },
        { x: w * 0.88, y: h * 0.62, vx: -34, size: narrow ? 12 : 15, bodyColor: '#fb7185', stripeColor: '#ffe4e6', finColor: '#f43f5e', phase: 4.4 },
      ];

      // Rising Air Bubbles
      const bubbleCount = narrow ? 24 : 42;
      bubbles = Array.from({ length: bubbleCount }, (_, i) => ({
        x: (i < 16 ? w * 0.1 + (i % 3) * 10 : Math.random() * w),
        y: Math.random() * h,
        r: 2 + (i % 4) * 1.4,
        vy: -24 - (i % 5) * 9,
        wobble: 4 + (i % 3) * 3,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const drawKelpBlade = (k: KelpBlade, t: number) => {
      const segs = 9;
      const segH = k.height / segs;
      ctx.save();
      ctx.fillStyle = k.color;
      ctx.strokeStyle = 'rgba(167, 243, 208, 0.25)';
      ctx.lineWidth = 1;

      const leftPts: Array<[number, number]> = [];
      const rightPts: Array<[number, number]> = [];
      for (let i = 0; i <= segs; i++) {
        const frac = i / segs;
        const sway = Math.sin(t * 1.65 + k.phase - frac * 2.4) * (16 * frac * frac);
        const cx = k.x + sway;
        const cy = k.baseY - i * segH;
        const halfW = k.width * (1 - frac * 0.85) * (0.75 + 0.25 * Math.sin(frac * Math.PI * 3));
        leftPts.push([cx - halfW, cy]);
        rightPts.push([cx + halfW, cy]);
      }

      ctx.beginPath();
      ctx.moveTo(leftPts[0][0], leftPts[0][1]);
      for (let i = 1; i < leftPts.length; i++) {
        ctx.lineTo(leftPts[i][0], leftPts[i][1]);
      }
      for (let i = rightPts.length - 1; i >= 0; i--) {
        ctx.lineTo(rightPts[i][0], rightPts[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const drawSharkCreature = (
      x: number,
      y: number,
      vx: number,
      scale: number,
      t: number,
      isMegalodon: boolean
    ) => {
      const dir = vx >= 0 ? 1 : -1;
      const swim = Math.sin(t * (isMegalodon ? 2.4 : 3.6) + (isMegalodon ? 1.2 : 0)) * (isMegalodon ? 8 : 6);
      const len = isMegalodon ? 128 : 74;
      const thick = isMegalodon ? 31 : 17;

      ctx.save();
      ctx.translate(x, y + swim * 0.3);
      ctx.scale(scale * dir, scale);

      // Tail fin (caudal) with articulated swim sway
      ctx.fillStyle = isMegalodon ? '#162d47' : '#254e73';
      ctx.beginPath();
      ctx.moveTo(-len * 0.72, 0);
      ctx.quadraticCurveTo(-len * 0.94, -thick * 1.25 + swim * 0.45, -len * 1.08, -thick * 1.38 + swim * 0.6);
      ctx.quadraticCurveTo(-len * 0.88, -thick * 0.2 + swim * 0.3, -len * 0.84, swim * 0.25);
      ctx.quadraticCurveTo(-len * 0.92, thick * 0.75 + swim * 0.3, -len * 1.0, thick * 0.95 + swim * 0.45);
      ctx.closePath();
      ctx.fill();

      // Tall dorsal fin
      ctx.fillStyle = isMegalodon ? '#10243b' : '#1d4466';
      ctx.beginPath();
      ctx.moveTo(-len * 0.14, -thick * 0.72);
      ctx.quadraticCurveTo(-len * 0.02, -thick * 2.05, len * 0.12, -thick * 1.9);
      ctx.quadraticCurveTo(len * 0.08, -thick * 1.1, len * 0.18, -thick * 0.78);
      ctx.closePath();
      ctx.fill();

      // Pectoral fin
      ctx.fillStyle = isMegalodon ? '#1a3654' : '#295780';
      ctx.beginPath();
      ctx.moveTo(len * 0.22, thick * 0.46);
      ctx.quadraticCurveTo(len * 0.04, thick * 1.48, -len * 0.08, thick * 1.32);
      ctx.quadraticCurveTo(len * 0.04, thick * 0.8, len * 0.04, thick * 0.52);
      ctx.closePath();
      ctx.fill();

      // Main torpedo body (counter-shaded dorsal blue & pale belly)
      ctx.beginPath();
      ctx.moveTo(len * 0.88, 0); // Sleek pointed snout
      ctx.quadraticCurveTo(len * 0.56, -thick * 0.95, 0, -thick * 0.92);
      ctx.quadraticCurveTo(-len * 0.46, -thick * 0.72, -len * 0.78, -4);
      ctx.lineTo(-len * 0.78, 5);
      ctx.quadraticCurveTo(-len * 0.45, thick * 0.65, 0, thick * 0.78);
      ctx.quadraticCurveTo(len * 0.5, thick * 0.8, len * 0.78, thick * 0.18);
      ctx.quadraticCurveTo(len * 0.84, thick * 0.08, len * 0.88, 0);
      ctx.closePath();
      const bodyGrad = ctx.createLinearGradient(0, -thick, 0, thick);
      if (isMegalodon) {
        bodyGrad.addColorStop(0, '#0f253d');
        bodyGrad.addColorStop(0.55, '#1f4266');
        bodyGrad.addColorStop(0.66, '#7b99b5');
        bodyGrad.addColorStop(1, '#c4daed');
      } else {
        bodyGrad.addColorStop(0, '#1e4a73');
        bodyGrad.addColorStop(0.55, '#3b73a3');
        bodyGrad.addColorStop(0.68, '#b6d5ec');
        bodyGrad.addColorStop(1, '#e6f3fc');
      }
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Mouth & subtle teeth line (Megalodon has fiercer jaw silhouette)
      ctx.strokeStyle = '#071424';
      ctx.lineWidth = isMegalodon ? 2.2 : 1.4;
      ctx.beginPath();
      ctx.moveTo(len * 0.74, thick * 0.22);
      ctx.quadraticCurveTo(len * 0.58, thick * 0.34, len * 0.46, thick * 0.24);
      ctx.stroke();

      // 5 gill slits
      ctx.strokeStyle = 'rgba(6, 18, 34, 0.58)';
      ctx.lineWidth = isMegalodon ? 1.8 : 1.2;
      for (let g = 0; g < 5; g++) {
        const gx = len * (0.38 - g * 0.048);
        ctx.beginPath();
        ctx.moveTo(gx, -thick * 0.16);
        ctx.quadraticCurveTo(gx - 2, thick * 0.06, gx, thick * 0.28);
        ctx.stroke();
      }

      // Eye
      ctx.fillStyle = '#040a14';
      ctx.beginPath();
      ctx.arc(len * 0.62, -thick * 0.14, isMegalodon ? 3.5 : 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
      ctx.beginPath();
      ctx.arc(len * 0.628, -thick * 0.17, 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawMackerel = (m: Mackerel, t: number) => {
      const dir = m.vx >= 0 ? 1 : -1;
      const tailWag = Math.sin(t * 7.2 + m.phase) * 3.5;
      const s = m.size;

      ctx.save();
      ctx.translate(m.x, m.y + Math.sin(t * 2.5 + m.phase) * 3);
      ctx.scale(dir, 1);

      // Forked tail
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-s * 0.9, 0);
      ctx.lineTo(-s * 1.4, -s * 0.46 + tailWag * 0.5);
      ctx.lineTo(-s * 1.15, 0);
      ctx.lineTo(-s * 1.4, s * 0.46 + tailWag * 0.5);
      ctx.closePath();
      ctx.fill();

      // Streamlined Ikan Kembung body
      const fg = ctx.createLinearGradient(0, -s * 0.4, 0, s * 0.4);
      fg.addColorStop(0, '#0f5c7a');
      fg.addColorStop(0.45, '#38bdf8');
      fg.addColorStop(0.55, '#cbd5e1');
      fg.addColorStop(1, '#f8fafc');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();

      // Characteristic Ikan Kembung dorsal vertical/wavy mackerel stripes
      ctx.strokeStyle = 'rgba(12, 46, 78, 0.68)';
      ctx.lineWidth = 1.4;
      for (let st = -3; st <= 2; st++) {
        const sx = st * (s * 0.18);
        ctx.beginPath();
        ctx.moveTo(sx, -s * 0.3);
        ctx.quadraticCurveTo(sx + 2, -s * 0.12, sx - 1, 0);
        ctx.stroke();
      }

      // Eye
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(s * 0.66, -s * 0.05, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawReefFish = (f: ReefFish, t: number) => {
      const dir = f.vx >= 0 ? 1 : -1;
      const s = f.size;
      const tailWag = Math.sin(t * 6.5 + f.phase) * 3;

      ctx.save();
      ctx.translate(f.x, f.y + Math.sin(t * 2.2 + f.phase) * 4);
      ctx.scale(dir, 1);

      // Tail fin
      ctx.fillStyle = f.finColor;
      ctx.beginPath();
      ctx.moveTo(-s * 0.72, 0);
      ctx.lineTo(-s * 1.25, -s * 0.48 + tailWag * 0.4);
      ctx.lineTo(-s * 1.25, s * 0.48 + tailWag * 0.4);
      ctx.closePath();
      ctx.fill();

      // Top dorsal fin
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.46);
      ctx.quadraticCurveTo(0, -s * 0.88, s * 0.28, -s * 0.44);
      ctx.closePath();
      ctx.fill();

      // Body
      ctx.fillStyle = f.bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.85, s * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();

      // Decorative stripe
      ctx.fillStyle = f.stripeColor;
      ctx.fillRect(-s * 0.1, -s * 0.46, s * 0.22, s * 0.92);

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s * 0.48, -s * 0.08, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(s * 0.52, -s * 0.08, 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawAnglerfish = (t: number) => {
      const dir = angler.vx >= 0 ? 1 : -1;
      const bob = Math.sin(t * 1.9) * 5;
      const lureBob = Math.sin(t * 3.4) * 3;
      const pulse = 0.76 + 0.24 * Math.sin(t * 4.5);

      ctx.save();
      ctx.translate(angler.x, angler.y + bob);
      ctx.scale(angler.scale * dir, angler.scale);

      // Tail & back dorsal fins
      ctx.fillStyle = '#162844';
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(-42, -13);
      ctx.lineTo(-37, 0);
      ctx.lineTo(-42, 13);
      ctx.closePath();
      ctx.fill();

      // Chunky deep-sea angler body
      const ag = ctx.createRadialGradient(4, -6, 4, 0, 0, 32);
      ag.addColorStop(0, '#2c4c7a');
      ag.addColorStop(0.65, '#142642');
      ag.addColorStop(1, '#091426');
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.ellipse(0, 0, 29, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lower jaw underbite with sharp tiny fang silhouettes
      ctx.fillStyle = '#0d1b30';
      ctx.beginPath();
      ctx.moveTo(10, 6);
      ctx.quadraticCurveTo(26, 17, 33, 6);
      ctx.lineTo(28, 3);
      ctx.quadraticCurveTo(18, 10, 10, 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e0f2fe';
      for (const tx of [16, 22, 28]) {
        ctx.beginPath();
        ctx.moveTo(tx - 1.5, 6.5);
        ctx.lineTo(tx, 1.5);
        ctx.lineTo(tx + 1.5, 6.5);
        ctx.closePath();
        ctx.fill();
      }

      // Pectoral side fin
      ctx.fillStyle = '#24426b';
      ctx.beginPath();
      ctx.ellipse(-4, 6, 8, 5, -0.4 + Math.sin(t * 4) * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Glowing eye
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(14, -7, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(15, -7, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Fishing rod / curved snout stalk ("moncong lampu") extending out in front
      const lureX = 48;
      const lureY = -12 + lureBob;
      ctx.strokeStyle = '#64a6d8';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(12, -16);
      ctx.bezierCurveTo(26, -38, 46, -34, lureX, lureY);
      ctx.stroke();

      // Radiant light halo around esca bulb (cached sprite blit!)
      ctx.globalAlpha = pulse;
      ctx.drawImage(lureSprite, lureX - 36, lureY - 36, 72, 72);
      ctx.globalAlpha = 1;

      // Bright bioluminescent esca bulb
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.arc(lureX, lureY, 4.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawOctopus = (t: number) => {
      const bob = Math.sin(t * 1.5) * 6;
      const tilt = (octopus.vx >= 0 ? 0.14 : -0.14) + Math.sin(t * 1.3) * 0.05;

      ctx.save();
      ctx.translate(octopus.x, octopus.y + bob);
      ctx.rotate(tilt);
      ctx.scale(octopus.scale, octopus.scale);

      // 8 undulating tentacles with subtle suction dots
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const spread = (i - 2.5) * 8;
        const sway = Math.sin(t * 3.1 + i * 0.9) * 9;
        const sway2 = Math.cos(t * 2.4 + i * 1.1) * 11;
        ctx.strokeStyle = i % 2 === 0 ? '#7c3aed' : '#9333ea';
        ctx.lineWidth = 5.2;
        ctx.beginPath();
        ctx.moveTo(spread * 0.6, 8);
        ctx.bezierCurveTo(
          spread + sway * 0.4,
          24,
          spread * 1.25 + sway,
          38,
          spread * 1.1 + sway2,
          52
        );
        ctx.stroke();

        // Tiny suction cup highlights
        ctx.fillStyle = '#ddd6fe';
        ctx.beginPath();
        ctx.arc(spread * 0.95 + sway * 0.6, 30, 1.3, 0, Math.PI * 2);
        ctx.arc(spread * 1.1 + sway * 0.85, 42, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mantle head
      const og = ctx.createRadialGradient(-5, -14, 3, 0, -8, 24);
      og.addColorStop(0, '#c084fc');
      og.addColorStop(0.65, '#7e22ce');
      og.addColorStop(1, '#4c1d95');
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.ellipse(0, -10, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Expressive octopus eyes
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.ellipse(-6.5, 1, 3.2, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(6.5, 1, 3.2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-7.5, -0.5, 2, 3);
      ctx.fillRect(5.5, -0.5, 2, 3);

      ctx.restore();
    };

    const drawJellyfish = (j: Jellyfish, y: number, t: number) => {
      const pulse = Math.sin(t * 2.6 + j.phase);
      const squash = 1 + pulse * 0.14;
      const stretch = 1 - pulse * 0.1;

      ctx.save();
      ctx.translate(j.x, y);

      // Trailing translucent tentacles
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.52)';
      ctx.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) {
        const tx = i * (j.r * 0.28);
        const wave = Math.sin(t * 3.2 + j.phase + i) * 7;
        ctx.beginPath();
        ctx.moveTo(tx, 2);
        ctx.quadraticCurveTo(tx + wave, j.r * 0.9, tx - wave * 0.6, j.r * 1.9);
        ctx.stroke();
      }

      // Glowing dome bell
      ctx.scale(squash, stretch);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.34)';
      ctx.strokeStyle = j.tint;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, j.r, Math.PI, 0);
      ctx.quadraticCurveTo(0, j.r * 0.28, -j.r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner bioluminescent core
      ctx.fillStyle = 'rgba(224, 242, 254, 0.48)';
      ctx.beginPath();
      ctx.ellipse(0, -j.r * 0.36, j.r * 0.45, j.r * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawSeaSnail = (t: number) => {
      const dir = snail.vx >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(snail.x, snail.y);
      ctx.scale(snail.scale * dir, snail.scale);

      // Soft muscular foot gliding along seabed
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.ellipse(2, 6, 17, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cute eyestalks
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(13, 3);
      ctx.lineTo(17 + Math.sin(t * 2) * 1.2, -5);
      ctx.moveTo(15, 4);
      ctx.lineTo(20 + Math.cos(t * 2) * 1.2, -3);
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(17 + Math.sin(t * 2) * 1.2, -5.5, 1.4, 0, Math.PI * 2);
      ctx.arc(20 + Math.cos(t * 2) * 1.2, -3.5, 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Spiraled conch / keong shell
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(-2, -3, 12, 10, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spiral whorl lines
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(-2, -3, 6.5, 0, Math.PI * 1.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-2, -3, 2.8, 0, Math.PI * 1.8);
      ctx.stroke();

      ctx.restore();
    };

    const drawFrame = (dt: number) => {
      if (width <= 0 || height <= 0) return;
      elapsed += dt;
      const t = prefersReducedMotion ? 1.2 : elapsed;

      // 1. Pre-rendered water depth, reef silhouette, sand, stones & starfish
      if (bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0);
      } else {
        ctx.fillStyle = '#041426';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Gentle drifting caustic sunbeam shafts from aquarium surface
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const beamX = width * (0.14 + i * 0.24) + Math.sin(t * 0.45 + i * 1.4) * 28;
        const beamW = Math.max(45, width * 0.085);
        ctx.fillStyle = 'rgba(125, 211, 252, 0.055)';
        ctx.beginPath();
        ctx.moveTo(beamX, 0);
        ctx.lineTo(beamX + beamW, 0);
        ctx.lineTo(beamX + beamW * 1.9 + 55, height * 0.88);
        ctx.lineTo(beamX - beamW * 0.35 + 55, height * 0.88);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 3. Megalodon cruising majestic deep background
      if (dt > 0) {
        megalodon.x += megalodon.vx * dt;
        if (megalodon.x < -190) megalodon.x = width + 190;
        if (megalodon.x > width + 190) megalodon.x = -190;
      }
      drawSharkCreature(megalodon.x, megalodon.y, megalodon.vx, megalodon.scale, t, true);

      // 4. Swaying Rumput Laut (Seaweed / Kelp)
      for (const k of kelps) {
        drawKelpBlade(k, t);
      }

      // 5. Hiu (Reef Shark)
      if (dt > 0) {
        shark.x += shark.vx * dt;
        if (shark.x > width + 120) shark.x = -120;
        if (shark.x < -120) shark.x = width + 120;
      }
      drawSharkCreature(shark.x, shark.y, shark.vx, shark.scale, t, false);

      // 6. Ubur-ubur (Jellyfish) pulsing & bobbing
      for (const j of jellies) {
        if (dt > 0) {
          j.x += j.vx * dt;
          if (j.x > width + 40) j.x = -40;
          if (j.x < -40) j.x = width + 40;
        }
        const jy = j.baseY + Math.sin(t * 1.35 + j.phase) * 14;
        drawJellyfish(j, jy, t);
      }

      // 7. Ikan Kembung school
      for (const m of mackerels) {
        if (dt > 0) {
          m.x += m.vx * dt;
          if (m.x > width + 55) m.x = -55;
        }
        drawMackerel(m, t);
      }

      // 8. Colorful Reef Aquarium Fish ("Ikan")
      for (const f of reefFish) {
        if (dt > 0) {
          f.x += f.vx * dt;
          if (f.x > width + 45) f.x = -45;
          if (f.x < -45) f.x = width + 45;
        }
        drawReefFish(f, t);
      }

      // 9. Gurita (Octopus) gliding softly
      if (dt > 0) {
        octopus.x += octopus.vx * dt;
        if (octopus.x < width * 0.45) octopus.vx = Math.abs(octopus.vx);
        if (octopus.x > width * 0.88) octopus.vx = -Math.abs(octopus.vx);
      }
      drawOctopus(t);

      // 10. Anglerfish ("Ikan yang didepannya ada moncong lampunya")
      if (dt > 0) {
        angler.x += angler.vx * dt;
        if (angler.x > width * 0.56) angler.vx = -Math.abs(angler.vx);
        if (angler.x < width * 0.14) angler.vx = Math.abs(angler.vx);
      }
      drawAnglerfish(t);

      // 11. Keong (Sea Snail) on sandy bottom
      if (dt > 0) {
        snail.x += snail.vx * dt;
        if (snail.x > width * 0.62) snail.vx = -Math.abs(snail.vx);
        if (snail.x < width * 0.34) snail.vx = Math.abs(snail.vx);
      }
      drawSeaSnail(t);

      // 12. Rising Aquarium Air Bubbles
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.72)';
      ctx.fillStyle = 'rgba(186, 230, 253, 0.24)';
      ctx.lineWidth = 1.1;
      for (const b of bubbles) {
        if (dt > 0) {
          b.y += b.vy * dt;
          b.x += Math.sin(t * 2.5 + b.phase) * b.wobble * dt;
          if (b.y < -12) {
            b.y = height * 0.94;
            b.x = Math.random() < 0.38 ? width * (0.08 + Math.random() * 0.1) : Math.random() * width;
          }
        }
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
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
      data-testid="aquarium-ocean-canvas"
      aria-hidden="true"
      className="tb-aquarium-canvas"
    />
  );
}

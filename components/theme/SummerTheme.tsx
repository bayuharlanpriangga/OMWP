'use client';

import React from 'react';

interface BreezeRibbon {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  phase: number;
}

interface HeronBird {
  x: number;
  y: number;
  vx: number;
  scale: number;
  flapSpeed: number;
  phase: number;
}

interface Sparkle {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

export function SummerTheme() {
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
    let breezes: BreezeRibbon[] = [];
    let flyingHerons: HeronBird[] = [];
    let sparkles: Sparkle[] = [];

    const getLayout = (w: number, h: number) => {
      const narrow = w < 640;
      const horizonY = h * (narrow ? 0.34 : 0.37);
      const shoreY = h * (narrow ? 0.56 : 0.58);

      // Sun in upper-left/center-left sunny yellow sky
      const sunX = w * (narrow ? 0.22 : 0.18);
      const sunY = h * (narrow ? 0.14 : 0.16);
      const sunR = Math.max(30, Math.min(58, Math.min(w, h) * 0.068));

      // Palm trees framing left and right beach edges
      const leftPalmX = w * (narrow ? 0.05 : 0.06);
      const rightPalmX = w * (narrow ? 0.96 : 0.94);

      // Swim ring floating on ocean water (clear of centered slide card)
      const ringX = w * (narrow ? 0.78 : 0.885);
      const ringY = horizonY + (shoreY - horizonY) * 0.54;

      // Wading bangau near shoreline (clear on left shore)
      const waderX = w * (narrow ? 0.26 : 0.135);
      const waderY = shoreY - h * 0.015;

      // Drink stand ("spot penjual minuman") on left-mid beach
      const standX = w * (narrow ? 0.18 : 0.135);
      const standY = h * (narrow ? 0.73 : 0.73);
      const standScale = narrow ? 0.74 : Math.max(0.84, Math.min(1.12, w / 1280));

      // Beach umbrella + lounger mat + drink table on right-mid beach
      const umbX = w * (narrow ? 0.75 : 0.815);
      const umbY = h * (narrow ? 0.72 : 0.71);
      const umbScale = narrow ? 0.74 : Math.max(0.86, Math.min(1.14, w / 1260));

      // Surfboard rack ("tempat untuk alat selancar") on upper-right sand near shore
      const rackX = w * (narrow ? 0.89 : 0.915);
      const rackY = shoreY + h * 0.09;
      const rackScale = narrow ? 0.72 : Math.max(0.82, Math.min(1.06, w / 1280));

      // Scattered items on beach sand — far apart from each other
      const waterGunX = w * (narrow ? 0.3 : 0.33);
      const waterGunY = h * (narrow ? 0.88 : 0.88);

      const gogglesX = w * (narrow ? 0.67 : 0.65);
      const gogglesY = h * (narrow ? 0.86 : 0.85);

      const shellX = w * (narrow ? 0.5 : 0.49);
      const shellY = h * (narrow ? 0.92 : 0.91);

      return {
        narrow,
        horizonY,
        shoreY,
        sunX,
        sunY,
        sunR,
        leftPalmX,
        rightPalmX,
        ringX,
        ringY,
        waderX,
        waderY,
        standX,
        standY,
        standScale,
        umbX,
        umbY,
        umbScale,
        rackX,
        rackY,
        rackScale,
        waterGunX,
        waterGunY,
        gogglesX,
        gogglesY,
        shellX,
        shellY,
      };
    };

    const buildStaticBeach = () => {
      if (!bgCtx) return;
      bgCanvas.width = width;
      bgCanvas.height = height;
      const L = getLayout(width, height);

      // 1. Sunny Golden-Yellow Sky
      const skyGrad = bgCtx.createLinearGradient(0, 0, 0, L.horizonY);
      skyGrad.addColorStop(0, '#fef08a');
      skyGrad.addColorStop(0.52, '#fef9c3');
      skyGrad.addColorStop(0.86, '#fde68a');
      skyGrad.addColorStop(1, '#bae6fd');
      bgCtx.fillStyle = skyGrad;
      bgCtx.fillRect(0, 0, width, L.horizonY + 4);

      // Sun halo & sun disc
      const sunHalo = bgCtx.createRadialGradient(
        L.sunX,
        L.sunY,
        L.sunR * 0.4,
        L.sunX,
        L.sunY,
        L.sunR * 4.5
      );
      sunHalo.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      sunHalo.addColorStop(0.35, 'rgba(250, 204, 21, 0.35)');
      sunHalo.addColorStop(1, 'rgba(254, 249, 195, 0)');
      bgCtx.fillStyle = sunHalo;
      bgCtx.fillRect(0, 0, width, L.horizonY + 30);

      bgCtx.fillStyle = '#facc15';
      bgCtx.beginPath();
      bgCtx.arc(L.sunX, L.sunY, L.sunR, 0, Math.PI * 2);
      bgCtx.fill();

      bgCtx.fillStyle = '#fef08a';
      bgCtx.beginPath();
      bgCtx.arc(L.sunX - L.sunR * 0.14, L.sunY - L.sunR * 0.14, L.sunR * 0.68, 0, Math.PI * 2);
      bgCtx.fill();

      // Soft warm clouds
      const drawCloud = (cx: number, cy: number, s: number) => {
        bgCtx.fillStyle = 'rgba(255, 251, 235, 0.78)';
        bgCtx.beginPath();
        bgCtx.arc(cx, cy, 20 * s, 0, Math.PI * 2);
        bgCtx.arc(cx + 22 * s, cy - 5 * s, 24 * s, 0, Math.PI * 2);
        bgCtx.arc(cx + 46 * s, cy, 18 * s, 0, Math.PI * 2);
        bgCtx.arc(cx + 22 * s, cy + 7 * s, 20 * s, 0, Math.PI * 2);
        bgCtx.fill();
      };
      drawCloud(width * 0.45, height * 0.11, L.narrow ? 0.75 : 1.05);
      drawCloud(width * 0.77, height * 0.16, L.narrow ? 0.68 : 0.92);

      // 2. Ocean Water base ("air laut")
      const seaGrad = bgCtx.createLinearGradient(0, L.horizonY, 0, L.shoreY + 24);
      seaGrad.addColorStop(0, '#0284c7');
      seaGrad.addColorStop(0.5, '#0ea5e9');
      seaGrad.addColorStop(0.85, '#38bdf8');
      seaGrad.addColorStop(1, '#7dd3fc');
      bgCtx.fillStyle = seaGrad;
      bgCtx.fillRect(0, L.horizonY, width, L.shoreY - L.horizonY + 28);

      // Horizon sun reflection strip
      const reflGrad = bgCtx.createLinearGradient(0, L.horizonY, 0, L.shoreY);
      reflGrad.addColorStop(0, 'rgba(254, 240, 138, 0.5)');
      reflGrad.addColorStop(1, 'rgba(254, 240, 138, 0.05)');
      bgCtx.fillStyle = reflGrad;
      bgCtx.beginPath();
      bgCtx.moveTo(L.sunX - L.sunR * 1.1, L.horizonY);
      bgCtx.lineTo(L.sunX + L.sunR * 1.1, L.horizonY);
      bgCtx.lineTo(L.sunX + L.sunR * 2.5, L.shoreY);
      bgCtx.lineTo(L.sunX - L.sunR * 2.5, L.shoreY);
      bgCtx.closePath();
      bgCtx.fill();

      // 3. Golden-Yellow Sandy Beach ("pantai kuning hangat")
      const sandGrad = bgCtx.createLinearGradient(0, L.shoreY - 10, 0, height);
      sandGrad.addColorStop(0, '#fde68a');
      sandGrad.addColorStop(0.28, '#fcd34d');
      sandGrad.addColorStop(0.7, '#facc15');
      sandGrad.addColorStop(1, '#eab308');
      bgCtx.fillStyle = sandGrad;
      bgCtx.beginPath();
      bgCtx.moveTo(0, L.shoreY + 8);
      bgCtx.quadraticCurveTo(width * 0.28, L.shoreY - 10, width * 0.56, L.shoreY + 6);
      bgCtx.quadraticCurveTo(width * 0.8, L.shoreY + 18, width, L.shoreY - 4);
      bgCtx.lineTo(width, height);
      bgCtx.lineTo(0, height);
      bgCtx.closePath();
      bgCtx.fill();

      // Wet sand edge near shoreline
      bgCtx.fillStyle = 'rgba(217, 119, 6, 0.14)';
      bgCtx.beginPath();
      bgCtx.moveTo(0, L.shoreY + 16);
      bgCtx.quadraticCurveTo(width * 0.28, L.shoreY - 2, width * 0.56, L.shoreY + 14);
      bgCtx.quadraticCurveTo(width * 0.8, L.shoreY + 26, width, L.shoreY + 4);
      bgCtx.lineTo(width, L.shoreY + 26);
      bgCtx.quadraticCurveTo(width * 0.8, L.shoreY + 42, width * 0.56, L.shoreY + 30);
      bgCtx.quadraticCurveTo(width * 0.28, L.shoreY + 14, 0, L.shoreY + 32);
      bgCtx.closePath();
      bgCtx.fill();

      // Subtle warm sand ripples/speckles
      bgCtx.fillStyle = 'rgba(180, 83, 9, 0.12)';
      for (let i = 0; i < 42; i++) {
        const sx = ((i * 193) % 997) / 997 * width;
        const sy = L.shoreY + 36 + (((i * 317) % 883) / 883) * (height - L.shoreY - 44);
        bgCtx.beginPath();
        bgCtx.ellipse(sx, sy, 6 + (i % 4) * 3, 1.5, 0, 0, Math.PI * 2);
        bgCtx.fill();
      }

      // 4. Palm Tree Trunks ("pohon kelapa")
      const drawPalmTrunk = (bx: number, by: number, tx: number, ty: number) => {
        bgCtx.save();
        bgCtx.strokeStyle = '#78350f';
        bgCtx.lineWidth = L.narrow ? 11 : 15;
        bgCtx.lineCap = 'round';
        bgCtx.beginPath();
        bgCtx.moveTo(bx, by);
        bgCtx.quadraticCurveTo((bx + tx) * 0.5 + (tx > bx ? -18 : 18), (by + ty) * 0.5, tx, ty);
        bgCtx.stroke();

        // Trunk segments highlight
        bgCtx.strokeStyle = '#b45309';
        bgCtx.lineWidth = L.narrow ? 4 : 6;
        bgCtx.setLineDash([7, 9]);
        bgCtx.beginPath();
        bgCtx.moveTo(bx, by);
        bgCtx.quadraticCurveTo((bx + tx) * 0.5 + (tx > bx ? -18 : 18), (by + ty) * 0.5, tx, ty);
        bgCtx.stroke();
        bgCtx.setLineDash([]);
        bgCtx.restore();
      };

      const lPalmTopX = L.leftPalmX + (L.narrow ? 34 : 52);
      const lPalmTopY = height * 0.24;
      drawPalmTrunk(L.leftPalmX - 8, height * 0.76, lPalmTopX, lPalmTopY);

      const rPalmTopX = L.rightPalmX - (L.narrow ? 32 : 48);
      const rPalmTopY = height * 0.22;
      drawPalmTrunk(L.rightPalmX + 8, height * 0.74, rPalmTopX, rPalmTopY);

      // 5. Surfboard Rack ("tempat untuk alat selancar")
      bgCtx.save();
      bgCtx.translate(L.rackX, L.rackY);
      bgCtx.scale(L.rackScale, L.rackScale);
      // Shadow
      bgCtx.fillStyle = 'rgba(146, 64, 14, 0.22)';
      bgCtx.beginPath();
      bgCtx.ellipse(0, 32, 42, 7, 0, 0, Math.PI * 2);
      bgCtx.fill();

      // Rack posts & crossbar
      bgCtx.fillStyle = '#92400e';
      bgCtx.fillRect(-34, -22, 6, 54);
      bgCtx.fillRect(28, -22, 6, 54);
      bgCtx.fillStyle = '#b45309';
      bgCtx.fillRect(-38, 18, 76, 6);
      bgCtx.fillRect(-38, -8, 76, 5);

      // 3 Surfboards resting on rack
      const drawSurfboard = (ox: number, rot: number, body: string, stripe: string) => {
        bgCtx.save();
        bgCtx.translate(ox, 20);
        bgCtx.rotate(rot);
        bgCtx.fillStyle = body;
        bgCtx.beginPath();
        bgCtx.moveTo(0, -68);
        bgCtx.quadraticCurveTo(13, -38, 10, 12);
        bgCtx.lineTo(-10, 12);
        bgCtx.quadraticCurveTo(-13, -38, 0, -68);
        bgCtx.closePath();
        bgCtx.fill();
        bgCtx.fillStyle = stripe;
        bgCtx.fillRect(-2, -62, 4, 72);
        bgCtx.restore();
      };
      drawSurfboard(-18, -0.07, '#fef08a', '#f59e0b');
      drawSurfboard(0, 0.02, '#fb923c', '#fffbeb');
      drawSurfboard(18, 0.08, '#38bdf8', '#facc15');
      bgCtx.restore();

      // 6. Drink Stand ("spot penjual minuman") on left beach
      bgCtx.save();
      bgCtx.translate(L.standX, L.standY);
      bgCtx.scale(L.standScale, L.standScale);
      // Sand shadow
      bgCtx.fillStyle = 'rgba(146, 64, 14, 0.24)';
      bgCtx.beginPath();
      bgCtx.ellipse(0, 44, 68, 11, 0, 0, Math.PI * 2);
      bgCtx.fill();

      // Wooden counter & posts
      bgCtx.fillStyle = '#92400e';
      bgCtx.fillRect(-48, -56, 7, 98);
      bgCtx.fillRect(41, -56, 7, 98);
      bgCtx.fillStyle = '#b45309';
      bgCtx.fillRect(-52, 4, 104, 38);
      bgCtx.fillStyle = '#d97706';
      bgCtx.fillRect(-56, -2, 112, 8);
      // Striped front panel
      bgCtx.fillStyle = '#fef08a';
      bgCtx.fillRect(-44, 11, 88, 22);
      bgCtx.fillStyle = '#facc15';
      for (let sx = -44; sx < 44; sx += 16) {
        bgCtx.fillRect(sx, 11, 8, 22);
      }

      // Sunny yellow awning roof
      bgCtx.beginPath();
      bgCtx.moveTo(-64, -52);
      bgCtx.lineTo(64, -52);
      bgCtx.lineTo(54, -78);
      bgCtx.lineTo(-54, -78);
      bgCtx.closePath();
      bgCtx.fillStyle = '#facc15';
      bgCtx.fill();
      bgCtx.fillStyle = '#fffbeb';
      for (let i = -2; i <= 2; i += 2) {
        bgCtx.fillRect(i * 19 - 8, -78, 16, 26);
      }
      // Scalloped trim
      for (let sx = -56; sx <= 56; sx += 16) {
        bgCtx.fillStyle = sx % 32 === 0 ? '#f59e0b' : '#fffbeb';
        bgCtx.beginPath();
        bgCtx.arc(sx, -52, 8, 0, Math.PI);
        bgCtx.fill();
      }
      // Sign board
      bgCtx.fillStyle = '#78350f';
      bgCtx.fillRect(-30, -45, 60, 15);
      bgCtx.fillStyle = '#fef08a';
      bgCtx.font = 'bold 8px sans-serif';
      bgCtx.textAlign = 'center';
      bgCtx.fillText('FRESH JUICE', 0, -35);

      // Pitcher of yellow lemonade on counter
      bgCtx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      bgCtx.fillRect(-38, -28, 22, 26);
      bgCtx.fillStyle = '#facc15';
      bgCtx.fillRect(-36, -22, 18, 18);
      bgCtx.fillStyle = '#eab308';
      bgCtx.beginPath();
      bgCtx.arc(-34, -22, 4, 0, Math.PI * 2);
      bgCtx.fill();
      bgCtx.restore();

      // 7. Beach Lounger Mat ("matras untuk rebahan") + Table legs under umbrella
      bgCtx.save();
      bgCtx.translate(L.umbX, L.umbY);
      bgCtx.scale(L.umbScale, L.umbScale);

      // Soft umbrella shade on sand
      bgCtx.fillStyle = 'rgba(146, 64, 14, 0.2)';
      bgCtx.beginPath();
      bgCtx.ellipse(-10, 42, 78, 16, 0, 0, Math.PI * 2);
      bgCtx.fill();

      // Lounger Mat ("matras untuk rebahan") on sand right beside table
      bgCtx.save();
      bgCtx.translate(22, 34);
      bgCtx.rotate(-0.08);
      bgCtx.fillStyle = '#fffbeb';
      bgCtx.strokeStyle = '#eab308';
      bgCtx.lineWidth = 2;
      bgCtx.beginPath();
      bgCtx.roundRect(-38, -11, 76, 22, 6);
      bgCtx.fill();
      bgCtx.stroke();
      // Yellow stripes on mat
      bgCtx.fillStyle = '#facc15';
      bgCtx.fillRect(-26, -10, 12, 20);
      bgCtx.fillRect(0, -10, 12, 20);
      // Rolled pillow
      bgCtx.fillStyle = '#f59e0b';
      bgCtx.beginPath();
      bgCtx.roundRect(22, -9, 13, 18, 5);
      bgCtx.fill();
      bgCtx.restore();

      // Umbrella pole
      bgCtx.strokeStyle = '#92400e';
      bgCtx.lineWidth = 5;
      bgCtx.beginPath();
      bgCtx.moveTo(-4, 38);
      bgCtx.lineTo(-4, -54);
      bgCtx.stroke();

      // Small beach table under umbrella ("meja dibawah tenda payung")
      bgCtx.fillStyle = '#92400e';
      bgCtx.fillRect(-38, 18, 4, 22);
      bgCtx.fillRect(-22, 18, 4, 22);
      bgCtx.fillStyle = '#fef3c7';
      bgCtx.strokeStyle = '#d97706';
      bgCtx.lineWidth = 2;
      bgCtx.beginPath();
      bgCtx.roundRect(-52, 11, 48, 8, 4);
      bgCtx.fill();
      bgCtx.stroke();
      bgCtx.restore();

      // 8. Scattered Beach Toys & Props (placed far apart!)
      // (A) Water blaster / penembak mainan air on left-center foreground sand
      bgCtx.save();
      bgCtx.translate(L.waterGunX, L.waterGunY);
      bgCtx.rotate(-0.24);
      const wgScale = L.narrow ? 0.78 : 1;
      bgCtx.scale(wgScale, wgScale);
      // Shadow
      bgCtx.fillStyle = 'rgba(146, 64, 14, 0.22)';
      bgCtx.beginPath();
      bgCtx.ellipse(0, 10, 28, 6, 0, 0, Math.PI * 2);
      bgCtx.fill();
      // Handle & body
      bgCtx.fillStyle = '#f97316';
      bgCtx.beginPath();
      bgCtx.roundRect(-18, 0, 9, 16, 3);
      bgCtx.fill();
      bgCtx.fillStyle = '#facc15';
      bgCtx.beginPath();
      bgCtx.roundRect(-22, -10, 38, 12, 5);
      bgCtx.fill();
      bgCtx.strokeStyle = '#b45309';
      bgCtx.lineWidth = 1.2;
      bgCtx.stroke();
      // Water tank on top
      bgCtx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      bgCtx.beginPath();
      bgCtx.roundRect(-14, -18, 22, 9, 4);
      bgCtx.fill();
      // Barrel nozzle
      bgCtx.fillStyle = '#0ea5e9';
      bgCtx.fillRect(15, -7, 9, 6);
      bgCtx.restore();

      // (B) Swimming goggles ("kacamata renang") on right-center sand (far from water gun & rack)
      bgCtx.save();
      bgCtx.translate(L.gogglesX, L.gogglesY);
      bgCtx.rotate(0.32);
      const ggScale = L.narrow ? 0.8 : 1;
      bgCtx.scale(ggScale, ggScale);
      // Shadow
      bgCtx.fillStyle = 'rgba(146, 64, 14, 0.2)';
      bgCtx.beginPath();
      bgCtx.ellipse(0, 6, 22, 6, 0, 0, Math.PI * 2);
      bgCtx.fill();
      // Elastic strap curled on sand
      bgCtx.strokeStyle = '#eab308';
      bgCtx.lineWidth = 3;
      bgCtx.beginPath();
      bgCtx.moveTo(-16, 0);
      bgCtx.bezierCurveTo(-26, -12, 18, -22, 16, 0);
      bgCtx.stroke();
      // Twin goggles frames & sky-blue lenses
      bgCtx.fillStyle = '#facc15';
      bgCtx.beginPath();
      bgCtx.roundRect(-17, -6, 15, 11, 5);
      bgCtx.roundRect(2, -6, 15, 11, 5);
      bgCtx.fill();
      bgCtx.fillStyle = '#38bdf8';
      bgCtx.beginPath();
      bgCtx.roundRect(-14.5, -4, 10, 7, 3.5);
      bgCtx.roundRect(4.5, -4, 10, 7, 3.5);
      bgCtx.fill();
      // Lens shine
      bgCtx.fillStyle = 'rgba(255, 255, 255, 0.68)';
      bgCtx.fillRect(-12, -2.5, 4, 2);
      bgCtx.fillRect(7, -2.5, 4, 2);
      bgCtx.restore();

      // (C) Little coral starfish & shell in center sand
      bgCtx.save();
      bgCtx.translate(L.shellX, L.shellY);
      bgCtx.scale(1, 0.72);
      bgCtx.fillStyle = '#fb923c';
      bgCtx.beginPath();
      for (let k = 0; k < 10; k++) {
        const ang = (k * Math.PI) / 5 - 0.2;
        const rad = k % 2 === 0 ? 11 : 4.6;
        if (k === 0) bgCtx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        else bgCtx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      bgCtx.closePath();
      bgCtx.fill();
      bgCtx.restore();
    };

    const drawPalmCanopy = (
      tx: number,
      ty: number,
      sway: number,
      scale: number
    ) => {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);

      // Coconut cluster
      ctx.fillStyle = '#713f12';
      ctx.beginPath();
      ctx.arc(-6, 6, 6.5, 0, Math.PI * 2);
      ctx.arc(6, 7, 6.5, 0, Math.PI * 2);
      ctx.arc(0, 11, 6.2, 0, Math.PI * 2);
      ctx.fill();

      // Swaying palm fronds
      const frondAngles = [-2.55, -2.05, -1.35, -0.55, 0.15, 0.75];
      frondAngles.forEach((baseA, idx) => {
        const ang = baseA + sway * (0.85 + (idx % 2) * 0.28);
        ctx.save();
        ctx.rotate(ang);
        ctx.fillStyle = idx % 2 === 0 ? '#16a34a' : '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(38, -18, 84, 8);
        ctx.quadraticCurveTo(42, 6, 0, 4);
        ctx.closePath();
        ctx.fill();

        // Leaf rib
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 1);
        ctx.quadraticCurveTo(38, -8, 76, 6);
        ctx.stroke();
        ctx.restore();
      });

      ctx.restore();
    };

    const drawSloshingYellowGlass = (
      gx: number,
      gy: number,
      gw: number,
      gh: number,
      sloshAngle: number,
      bobPhase: number,
      strawColor: string
    ) => {
      ctx.save();
      ctx.translate(gx, gy);

      // Straw sticking out
      ctx.strokeStyle = strawColor;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(gw * 0.15, -gh + 4);
      ctx.lineTo(gw * 0.48, -gh - 9);
      ctx.stroke();

      // Lemon slice on rim
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(-gw * 0.45, -gh + 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-gw * 0.45, -gh + 2, 2.7, 0, Math.PI * 2);
      ctx.fill();

      // Glass interior clip so liquid & ice cubes slosh cleanly inside the cup
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-gw * 0.5, -gh);
      ctx.lineTo(gw * 0.5, -gh);
      ctx.lineTo(gw * 0.38, 0);
      ctx.lineTo(-gw * 0.38, 0);
      ctx.closePath();
      ctx.clip();

      // Glass tint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(-gw, -gh, gw * 2, gh);

      // Animated tilted/sloshing yellow beverage ("air minuman kuning sedikit bergoyang")
      ctx.save();
      ctx.translate(0, -gh * 0.58);
      ctx.rotate(sloshAngle);
      const liqGrad = ctx.createLinearGradient(0, -4, 0, gh);
      liqGrad.addColorStop(0, '#fef08a');
      liqGrad.addColorStop(0.35, '#facc15');
      liqGrad.addColorStop(1, '#f59e0b');
      ctx.fillStyle = liqGrad;
      ctx.fillRect(-gw * 1.4, 0, gw * 2.8, gh * 1.4);

      // Sparkling liquid meniscus line
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillRect(-gw * 1.4, -1, gw * 2.8, 2);

      // Bobbing translucent ice cubes inside yellow drink ("es nya juga sedikit mengguncang")
      const ice1Y = 2 + Math.sin(bobPhase) * 1.6;
      const ice2Y = 4 + Math.cos(bobPhase + 1.3) * 1.5;
      ctx.save();
      ctx.translate(-gw * 0.16, ice1Y);
      ctx.rotate(sloshAngle * 1.6 + 0.18);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctx.fillRect(-2.6, -2.6, 5.2, 5.2);
      ctx.restore();

      ctx.save();
      ctx.translate(gw * 0.15, ice2Y);
      ctx.rotate(-sloshAngle * 1.4 - 0.22);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.76)';
      ctx.fillRect(-2.4, -2.4, 4.8, 4.8);
      ctx.restore();

      ctx.restore();
      ctx.restore();

      // Glass outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-gw * 0.5, -gh);
      ctx.lineTo(-gw * 0.38, 0);
      ctx.lineTo(gw * 0.38, 0);
      ctx.lineTo(gw * 0.5, -gh);
      ctx.stroke();

      ctx.restore();
    };

    const drawFlyingHeron = (hBird: HeronBird, tm: number) => {
      const flap = Math.sin(tm * hBird.flapSpeed + hBird.phase);
      const dir = hBird.vx >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(hBird.x, hBird.y + Math.sin(tm * 2.1 + hBird.phase) * 4);
      ctx.scale(hBird.scale * dir, hBird.scale);

      // Trailing long legs
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-10, 3);
      ctx.lineTo(-28, 7);
      ctx.moveTo(-10, 5);
      ctx.lineTo(-26, 10);
      ctx.stroke();

      // Back wing
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.quadraticCurveTo(4, -22 + flap * 16, -18, -16 + flap * 20);
      ctx.quadraticCurveTo(-8, -4, -2, 2);
      ctx.fill();

      // Elegant white body & curved S-neck
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-2, 2, 13, 5.2, -0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(8, 1);
      ctx.bezierCurveTo(15, -5, 13, -10, 21, -8);
      ctx.stroke();

      // Head & long orange-yellow beak
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(21.5, -8, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(23.5, -9);
      ctx.lineTo(34, -7.5);
      ctx.lineTo(23.5, -6.5);
      ctx.closePath();
      ctx.fill();

      // Front wing
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.quadraticCurveTo(2, -24 + flap * 22, -21, -18 + flap * 26);
      ctx.quadraticCurveTo(-10, -2, -4, 3);
      ctx.fill();

      ctx.restore();
    };

    const handleResize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      canvas.width = width;
      canvas.height = height;

      breezes = Array.from({ length: width < 640 ? 4 : 7 }, (_, i) => ({
        x: Math.random() * width,
        y: height * (0.14 + i * 0.09),
        len: 65 + Math.random() * 85,
        speed: 62 + Math.random() * 55,
        alpha: 0.22 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
      }));

      flyingHerons = [
        {
          x: width * 0.35,
          y: height * 0.14,
          vx: 38,
          scale: width < 640 ? 0.72 : 1,
          flapSpeed: 5.4,
          phase: 0.4,
        },
        {
          x: width * 0.72,
          y: height * 0.21,
          vx: -34,
          scale: width < 640 ? 0.65 : 0.86,
          flapSpeed: 6.1,
          phase: 2.3,
        },
      ];

      const L = getLayout(width, height);
      sparkles = Array.from({ length: width < 640 ? 14 : 24 }, () => ({
        x: Math.random() * width,
        y: L.horizonY + 8 + Math.random() * (L.shoreY - L.horizonY - 14),
        r: 1.4 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        speed: 2.2 + Math.random() * 2.5,
      }));

      buildStaticBeach();
    };

    const drawFrame = (dt: number) => {
      elapsed += dt;
      const tm = prefersReducedMotion ? 1.2 : elapsed;
      const L = getLayout(width, height);
      const breeze = Math.sin(tm * 1.4) * 0.055 + Math.sin(tm * 2.7 + 0.6) * 0.025;

      if (bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0);
      }

      // 1. Sea Sparkles
      sparkles.forEach((sp) => {
        const alpha = 0.2 + 0.65 * Math.max(0, Math.sin(tm * sp.speed + sp.phase));
        ctx.fillStyle = `rgba(254, 249, 195, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Animated Rolling Ocean Waves + Seafoam ("ombak")
      const waveBands = 3;
      for (let b = 0; b < waveBands; b++) {
        const baseY = L.horizonY + (L.shoreY - L.horizonY) * (0.34 + b * 0.31);
        const amp = 4 + b * 2.5;
        const offset = Math.sin(tm * (1.2 + b * 0.22) + b) * (5 + b * 3);
        ctx.strokeStyle =
          b === waveBands - 1
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(224, 242, 254, 0.56)';
        ctx.lineWidth = b === waveBands - 1 ? 4.5 : 2.5;
        ctx.beginPath();
        for (let wx = 0; wx <= width; wx += 28) {
          const wy =
            baseY +
            offset +
            Math.sin(wx * 0.016 + tm * (1.7 + b * 0.3) + b * 1.4) * amp;
          if (wx === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }
        ctx.stroke();
      }

      // 3. Swim Ring floating on Ocean Waves ("ban untuk berenang di atas air laut")
      const ringBob = Math.sin(tm * 2.1) * 5;
      const ringTilt = Math.sin(tm * 1.55) * 0.1;
      const ringScale = L.narrow ? 0.78 : 1;
      ctx.save();
      ctx.translate(L.ringX + Math.sin(tm * 0.7) * 8, L.ringY + ringBob);
      ctx.rotate(ringTilt);
      ctx.scale(ringScale, ringScale * 0.65);

      // Water ripple shadow under ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 6, 28 + Math.sin(tm * 2.4) * 3, 24, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Main yellow swim ring
      ctx.lineWidth = 11;
      ctx.strokeStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 19, 0, Math.PI * 2);
      ctx.stroke();

      // Red/white sunny stripes on ring
      ctx.strokeStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(0, 0, 19, -0.3, 0.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 19, Math.PI - 0.3, Math.PI + 0.55);
      ctx.stroke();

      ctx.strokeStyle = '#fffbeb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 19, 1.3, 1.85);
      ctx.stroke();
      ctx.restore();

      // 4. Wading Heron ("bangau") near shoreline
      const headBob = Math.sin(tm * 1.6) * 2.5;
      const wScale = L.narrow ? 0.78 : 1;
      ctx.save();
      ctx.translate(L.waderX, L.waderY);
      ctx.scale(wScale, wScale);
      // Legs
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(-6, 18);
      ctx.moveTo(4, -2);
      ctx.lineTo(5, 18);
      ctx.stroke();
      // Body
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, -6, 14, 7.5, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Neck & head
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(10, -8);
      ctx.bezierCurveTo(15, -18, 9, -28 + headBob, 15, -32 + headBob);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, -32 + headBob, 4, 0, Math.PI * 2);
      ctx.fill();
      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(19, -33.5 + headBob);
      ctx.lineTo(31, -30 + headBob);
      ctx.lineTo(19, -30 + headBob);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 5. Flying Herons ("burung bangau") in Sky
      flyingHerons.forEach((hb) => {
        if (dt > 0 && !prefersReducedMotion) {
          hb.x += hb.vx * dt;
          if (hb.vx > 0 && hb.x > width + 60) hb.x = -60;
          if (hb.vx < 0 && hb.x < -60) hb.x = width + 60;
        }
        drawFlyingHeron(hb, tm);
      });

      // 6. Swaying Palm Canopies ("pohon kelapa tertiup angin")
      drawPalmCanopy(
        L.leftPalmX + (L.narrow ? 34 : 52),
        height * 0.24,
        breeze,
        L.narrow ? 0.72 : 1.04
      );
      drawPalmCanopy(
        L.rightPalmX - (L.narrow ? 32 : 48),
        height * 0.22,
        -breeze * 0.9,
        L.narrow ? 0.72 : 1.02
      );

      // 7. Swaying Beach Umbrella Canopy + Sloshing Yellow Drinks under Umbrella
      ctx.save();
      ctx.translate(L.umbX, L.umbY);
      ctx.scale(L.umbScale, L.umbScale);

      // Umbrella top swaying gently in breeze
      ctx.save();
      ctx.translate(-4, -52);
      ctx.rotate(breeze * 0.65);
      // Striped canopy panels
      const segments = [
        { x0: -64, x1: -36, c: '#facc15' },
        { x0: -36, x1: -12, c: '#fffbeb' },
        { x0: -12, x1: 12, c: '#eab308' },
        { x0: 12, x1: 36, c: '#fffbeb' },
        { x0: 36, x1: 64, c: '#facc15' },
      ];
      segments.forEach((seg) => {
        ctx.fillStyle = seg.c;
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(seg.x0, 8);
        ctx.quadraticCurveTo((seg.x0 + seg.x1) * 0.5, 14, seg.x1, 8);
        ctx.closePath();
        ctx.fill();
      });
      // Finial knob
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, -29, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Yellow fresh drinks with sloshing liquid & bobbing ice on table under umbrella
      const sloshA = Math.sin(tm * 3.1) * 0.14 + breeze * 0.7;
      const sloshB = Math.sin(tm * 3.1 + 0.9) * 0.14 - breeze * 0.5;
      drawSloshingYellowGlass(-38, 11, 13, 18, sloshA, tm * 3.4, '#fb7185');
      drawSloshingYellowGlass(-18, 11, 12, 16, sloshB, tm * 3.4 + 1.4, '#38bdf8');
      ctx.restore();

      // Also animated sloshing yellow drink cup on the drink stand counter!
      ctx.save();
      ctx.translate(L.standX, L.standY);
      ctx.scale(L.standScale, L.standScale);
      drawSloshingYellowGlass(14, -2, 13, 18, Math.sin(tm * 2.9 + 0.4) * 0.13, tm * 3.2, '#ef4444');
      drawSloshingYellowGlass(34, -2, 12, 16, Math.sin(tm * 2.9 + 1.5) * 0.13, tm * 3.2 + 1.1, '#22c55e');
      ctx.restore();

      // 8. Soft Sea Breeze Ribbons ("angin")
      breezes.forEach((bz) => {
        if (dt > 0 && !prefersReducedMotion) {
          bz.x += bz.speed * dt;
          if (bz.x > width + bz.len + 20) bz.x = -bz.len - 20;
        }
        ctx.strokeStyle = `rgba(255, 251, 235, ${bz.alpha.toFixed(2)})`;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const yOff = Math.sin(tm * 1.8 + bz.phase) * 5;
        ctx.moveTo(bz.x, bz.y + yOff);
        ctx.quadraticCurveTo(
          bz.x + bz.len * 0.5,
          bz.y - 8 + yOff,
          bz.x + bz.len,
          bz.y + 2 + yOff
        );
        ctx.stroke();
      });
    };

    handleResize();
    drawFrame(0);
    window.addEventListener('resize', handleResize);

    if (prefersReducedMotion) {
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    let rafId = 0;
    let lastTs = 0;
    const loop = (ts: number) => {
      if (ts - lastTs >= 42) {
        const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0.042;
        lastTs = ts;
        drawFrame(dt);
      }
      rafId = window.requestAnimationFrame(loop);
    };
    rafId = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="tb-summer-canvas"
      aria-hidden="true"
    />
  );
}

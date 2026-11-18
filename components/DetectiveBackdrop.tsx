'use client';

import React from 'react';

interface FlyingPaper {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  w: number;
  h: number;
  fold: number;
  phase: number;
  alpha: number;
}

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  phase: number;
}

interface WindWisp {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  phase: number;
}

export function DetectiveBackdrop() {
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
    let flyingPapers: FlyingPaper[] = [];
    let dustMotes: DustMote[] = [];
    let windWisps: WindWisp[] = [];
    let spawnCooldown = 1.1;

    const getLayout = (w: number, h: number) => {
      const narrow = w < 640;

      // Window on upper-left wall casting diagonal golden light beam onto the desk
      const winX = w * (narrow ? 0.04 : 0.06);
      const winY = h * (narrow ? 0.09 : 0.11);
      const winW = Math.max(76, Math.min(148, w * (narrow ? 0.22 : 0.125)));
      const winH = Math.max(116, Math.min(220, h * 0.3));

      // Corkboard / Evidence connection board centered-right on back wall
      const boardW = Math.max(190, Math.min(390, w * (narrow ? 0.56 : 0.34)));
      const boardH = Math.max(115, Math.min(205, h * 0.27));
      const boardX = w * (narrow ? 0.36 : 0.34);
      const boardY = h * (narrow ? 0.1 : 0.11);

      // Coat rack on right side of back wall
      const rackX = w * (narrow ? 0.9 : 0.87);
      const rackTopY = h * 0.16;
      const rackBaseY = h * 0.72;

      // Wide cluttered mahogany/mocha desk in the foreground
      const deskY = h * (narrow ? 0.68 : 0.65);

      // Open laptop showing Criminal Case style suspect profile
      const laptopX = w * (narrow ? 0.45 : 0.48);
      const laptopY = deskY + h * 0.015;
      const laptopW = Math.max(115, Math.min(185, w * (narrow ? 0.33 : 0.155)));
      const laptopH = laptopW * 0.64;

      // File stacks (left & right of laptop)
      const leftStackX = w * (narrow ? 0.14 : 0.22);
      const rightStackX = w * (narrow ? 0.78 : 0.73);

      // Magnifying glass & fountain pen on center-right desk
      const magX = laptopX + laptopW * 0.85;
      const magY = deskY + h * 0.135;
      const penX = leftStackX + w * 0.09;
      const penY = deskY + h * 0.145;

      return {
        narrow,
        winX,
        winY,
        winW,
        winH,
        boardX,
        boardY,
        boardW,
        boardH,
        rackX,
        rackTopY,
        rackBaseY,
        deskY,
        laptopX,
        laptopY,
        laptopW,
        laptopH,
        leftStackX,
        rightStackX,
        magX,
        magY,
        penX,
        penY,
      };
    };

    const spawnPaper = (w: number, h: number, fromLeftStack = true): FlyingPaper => {
      const L = getLayout(w, h);
      const startX = fromLeftStack
        ? L.leftStackX + (Math.random() - 0.5) * 32
        : L.rightStackX + (Math.random() - 0.5) * 28;
      const startY = L.deskY - 12 + Math.random() * 14;
      return {
        x: startX,
        y: startY,
        vx: 72 + Math.random() * 75,
        vy: -(48 + Math.random() * 54),
        rot: (Math.random() - 0.5) * 0.6,
        vrot: (Math.random() - 0.5) * 2.6,
        w: 22 + Math.random() * 14,
        h: 28 + Math.random() * 15,
        fold: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.92,
      };
    };

    const buildOffscreenRoom = (w: number, h: number) => {
      if (!roomCtx) return;
      roomCanvas.width = w;
      roomCanvas.height = h;
      const L = getLayout(w, h);

      // 1. Rich warm dark mocha study wall backdrop
      const wallGrad = roomCtx.createLinearGradient(0, 0, 0, L.deskY);
      wallGrad.addColorStop(0, '#140c08');
      wallGrad.addColorStop(0.55, '#241610');
      wallGrad.addColorStop(1, '#1b100b');
      roomCtx.fillStyle = wallGrad;
      roomCtx.fillRect(0, 0, w, h);

      // Subtle vertical wood-panel wainscoting lines
      roomCtx.strokeStyle = 'rgba(15, 8, 5, 0.45)';
      roomCtx.lineWidth = 1.5;
      const panelStep = Math.max(46, Math.round(w / 22));
      for (let px = 0; px < w; px += panelStep) {
        roomCtx.beginPath();
        roomCtx.moveTo(px, 0);
        roomCtx.lineTo(px, L.deskY);
        roomCtx.stroke();
      }

      // Chair rail molding behind desk
      roomCtx.fillStyle = '#2d1b12';
      roomCtx.fillRect(0, L.deskY - 22, w, 12);
      roomCtx.fillStyle = 'rgba(212, 163, 115, 0.14)';
      roomCtx.fillRect(0, L.deskY - 22, w, 2);

      // 2. Study window frame on left wall (moonlit dusk sky + blinds)
      roomCtx.fillStyle = '#0f0805';
      roomCtx.fillRect(L.winX - 7, L.winY - 7, L.winW + 14, L.winH + 14);
      const skyGrad = roomCtx.createLinearGradient(
        L.winX,
        L.winY,
        L.winX,
        L.winY + L.winH
      );
      skyGrad.addColorStop(0, '#4f3a2c');
      skyGrad.addColorStop(0.55, '#8f6a46');
      skyGrad.addColorStop(1, '#c99963');
      roomCtx.fillStyle = skyGrad;
      roomCtx.fillRect(L.winX, L.winY, L.winW, L.winH);

      // Window mullions & slightly parted venetian slats
      roomCtx.fillStyle = 'rgba(24, 14, 9, 0.55)';
      for (let sy = L.winY + 12; sy < L.winY + L.winH * 0.52; sy += 13) {
        roomCtx.fillRect(L.winX, sy, L.winW, 4);
      }
      roomCtx.fillStyle = '#2a1910';
      roomCtx.fillRect(L.winX + L.winW * 0.5 - 3, L.winY, 6, L.winH);
      roomCtx.fillRect(L.winX, L.winY + L.winH * 0.52 - 3, L.winW, 6);

      // 3. Cork Evidence Board ("Papan Hubung Pola") on back wall
      roomCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      roomCtx.fillRect(L.boardX + 6, L.boardY + 8, L.boardW, L.boardH);
      roomCtx.fillStyle = '#4b2e1e';
      roomCtx.fillRect(L.boardX - 7, L.boardY - 7, L.boardW + 14, L.boardH + 14);
      roomCtx.strokeStyle = '#8c5a3c';
      roomCtx.lineWidth = 2;
      roomCtx.strokeRect(
        L.boardX - 7,
        L.boardY - 7,
        L.boardW + 14,
        L.boardH + 14
      );
      const corkGrad = roomCtx.createLinearGradient(
        L.boardX,
        L.boardY,
        L.boardX + L.boardW,
        L.boardY + L.boardH
      );
      corkGrad.addColorStop(0, '#7c5338');
      corkGrad.addColorStop(0.5, '#6d472f');
      corkGrad.addColorStop(1, '#583824');
      roomCtx.fillStyle = corkGrad;
      roomCtx.fillRect(L.boardX, L.boardY, L.boardW, L.boardH);

      // Pinned suspect photos & clue cards on the corkboard
      const pins = [
        { x: L.boardX + L.boardW * 0.16, y: L.boardY + L.boardH * 0.26, w: 38, h: 46, photo: true },
        { x: L.boardX + L.boardW * 0.48, y: L.boardY + L.boardH * 0.22, w: 42, h: 50, photo: true },
        { x: L.boardX + L.boardW * 0.8, y: L.boardY + L.boardH * 0.28, w: 36, h: 44, photo: false },
        { x: L.boardX + L.boardW * 0.28, y: L.boardY + L.boardH * 0.68, w: 46, h: 32, photo: false },
        { x: L.boardX + L.boardW * 0.68, y: L.boardY + L.boardH * 0.72, w: 44, h: 36, photo: true },
      ];

      // Red connection strings between clues on board
      roomCtx.strokeStyle = 'rgba(214, 48, 49, 0.86)';
      roomCtx.lineWidth = 1.6;
      const links: Array<[number, number]> = [
        [0, 1],
        [1, 2],
        [0, 3],
        [1, 3],
        [1, 4],
        [2, 4],
        [3, 4],
      ];
      for (const [a, b] of links) {
        roomCtx.beginPath();
        roomCtx.moveTo(pins[a].x, pins[a].y);
        const mx = (pins[a].x + pins[b].x) * 0.5;
        const my = (pins[a].y + pins[b].y) * 0.5 + 8;
        roomCtx.quadraticCurveTo(mx, my, pins[b].x, pins[b].y);
        roomCtx.stroke();
      }

      pins.forEach((p, idx) => {
        roomCtx.save();
        roomCtx.translate(p.x, p.y);
        roomCtx.rotate((idx % 2 === 0 ? -1 : 1) * 0.06);
        roomCtx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        roomCtx.fillRect(-p.w * 0.5 + 2, -p.h * 0.5 + 3, p.w, p.h);
        roomCtx.fillStyle = p.photo ? '#f2e5d5' : '#e6ccb2';
        roomCtx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
        if (p.photo) {
          roomCtx.fillStyle = '#2d1c14';
          roomCtx.fillRect(-p.w * 0.38, -p.h * 0.34, p.w * 0.76, p.h * 0.56);
          roomCtx.fillStyle = '#8b6346';
          roomCtx.beginPath();
          roomCtx.arc(0, -p.h * 0.14, p.w * 0.16, 0, Math.PI * 2);
          roomCtx.fill();
          roomCtx.fillRect(-p.w * 0.2, p.h * 0.02, p.w * 0.4, p.h * 0.16);
        } else {
          roomCtx.fillStyle = 'rgba(65, 39, 24, 0.55)';
          roomCtx.fillRect(-p.w * 0.34, -p.h * 0.18, p.w * 0.68, 2.5);
          roomCtx.fillRect(-p.w * 0.34, -p.h * 0.02, p.w * 0.52, 2.5);
          roomCtx.fillRect(-p.w * 0.34, p.h * 0.14, p.w * 0.6, 2.5);
        }
        // Red push-pin
        roomCtx.fillStyle = '#dc2626';
        roomCtx.beginPath();
        roomCtx.arc(0, -p.h * 0.4, 3.2, 0, Math.PI * 2);
        roomCtx.fill();
        roomCtx.restore();
      });

      // 4. Wooden coat rack stand (coat itself is drawn animated so it sways in the wind)
      roomCtx.strokeStyle = '#3b2214';
      roomCtx.lineWidth = 7;
      roomCtx.lineCap = 'round';
      roomCtx.beginPath();
      roomCtx.moveTo(L.rackX, L.rackTopY);
      roomCtx.lineTo(L.rackX, L.rackBaseY);
      roomCtx.stroke();
      // Hook crossbar & brass knob
      roomCtx.fillStyle = '#b08968';
      roomCtx.beginPath();
      roomCtx.arc(L.rackX, L.rackTopY, 5, 0, Math.PI * 2);
      roomCtx.fill();

      // 5. Large Mahogany / Mocha Detective Desk Surface
      const deskGrad = roomCtx.createLinearGradient(0, L.deskY, 0, h);
      deskGrad.addColorStop(0, '#5a3622');
      deskGrad.addColorStop(0.18, '#462818');
      deskGrad.addColorStop(0.65, '#331c10');
      deskGrad.addColorStop(1, '#1e0f08');
      roomCtx.fillStyle = deskGrad;
      roomCtx.fillRect(0, L.deskY, w, h - L.deskY);

      // Desk front bevel highlight & subtle wood grain
      roomCtx.fillStyle = '#7a4d32';
      roomCtx.fillRect(0, L.deskY, w, 4);
      roomCtx.strokeStyle = 'rgba(20, 10, 5, 0.28)';
      roomCtx.lineWidth = 1.2;
      for (let gy = L.deskY + 18; gy < h; gy += 22) {
        roomCtx.beginPath();
        roomCtx.moveTo(0, gy);
        roomCtx.bezierCurveTo(w * 0.33, gy + 5, w * 0.66, gy - 4, w, gy + 2);
        roomCtx.stroke();
      }

      // Leather desk blotter pad under laptop/work zone
      const padW = L.laptopW * 1.65;
      const padH = Math.max(70, h * 0.16);
      const padX = L.laptopX - padW * 0.42;
      const padY = L.deskY + 14;
      roomCtx.fillStyle = '#24140d';
      roomCtx.fillRect(padX, padY, padW, padH);
      roomCtx.strokeStyle = 'rgba(212, 163, 115, 0.35)';
      roomCtx.lineWidth = 1.2;
      roomCtx.strokeRect(padX + 4, padY + 4, padW - 8, padH - 8);

      // 6. Messy File Stacks ("Tumpukan Berkas") on left & right of desk
      const drawFileStack = (sx: number, sy: number, count: number) => {
        for (let i = 0; i < count; i++) {
          const fw = 76 - (i % 3) * 4;
          const fh = 11;
          const ox = ((i * 7) % 13) - 6;
          const oy = sy - i * 8;
          roomCtx.fillStyle = 'rgba(0, 0, 0, 0.34)';
          roomCtx.fillRect(sx - fw * 0.5 + ox + 2, oy + 2, fw, fh);
          roomCtx.fillStyle = i % 2 === 0 ? '#c89f72' : '#dfc19c';
          roomCtx.fillRect(sx - fw * 0.5 + ox, oy, fw, fh);
          // Folder tab & white paper edge lines
          roomCtx.fillStyle = '#f5ebe0';
          roomCtx.fillRect(sx - fw * 0.45 + ox, oy + 2, fw * 0.88, 3);
          if (i === count - 1) {
            // Red "CONFIDENTIAL" stamp bar on top dossier
            roomCtx.fillStyle = 'rgba(185, 28, 28, 0.78)';
            roomCtx.fillRect(sx - 18 + ox, oy + 5, 34, 4);
          }
        }
      };
      drawFileStack(L.leftStackX, L.deskY + 26, 7);
      drawFileStack(L.leftStackX + 54, L.deskY + 34, 4);
      drawFileStack(L.rightStackX, L.deskY + 28, 6);

      // Ceramic mocha coffee mug on desk corner
      const mugX = L.rightStackX - 58;
      const mugY = L.deskY + 36;
      roomCtx.fillStyle = '#d4a373';
      roomCtx.beginPath();
      roomCtx.ellipse(mugX, mugY, 13, 6, 0, 0, Math.PI * 2);
      roomCtx.fill();
      roomCtx.fillStyle = '#8c5a3c';
      roomCtx.fillRect(mugX - 13, mugY, 26, 22);
      roomCtx.beginPath();
      roomCtx.ellipse(mugX, mugY + 22, 13, 5, 0, 0, Math.PI * 2);
      roomCtx.fill();
      roomCtx.fillStyle = '#26140b';
      roomCtx.beginPath();
      roomCtx.ellipse(mugX, mugY + 1, 10, 4, 0, 0, Math.PI * 2);
      roomCtx.fill();
    };

    const resetParticles = (w: number, h: number) => {
      dustMotes = Array.from({ length: 34 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.82,
        vx: 8 + Math.random() * 14,
        vy: -4 + Math.random() * 10,
        r: 1 + Math.random() * 2,
        alpha: 0.16 + Math.random() * 0.34,
        phase: Math.random() * Math.PI * 2,
      }));
      windWisps = Array.from({ length: 5 }, (_, i) => ({
        x: Math.random() * w,
        y: h * (0.2 + i * 0.12),
        len: 75 + Math.random() * 90,
        speed: 140 + Math.random() * 90,
        alpha: 0.08 + Math.random() * 0.09,
        phase: i * 1.3,
      }));
      flyingPapers = [spawnPaper(w, h, true)];
    };

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      canvas.width = width;
      canvas.height = height;
      buildOffscreenRoom(width, height);
      resetParticles(width, height);
    };

    const drawFrame = (dt: number) => {
      elapsed += dt;
      const tm = prefersReducedMotion ? 1.2 : elapsed;
      const L = getLayout(width, height);

      // Periodic wind gust wave (0..1)
      const gustWave = Math.max(
        0,
        Math.sin(tm * 0.85) * 0.55 + Math.sin(tm * 1.9 + 0.7) * 0.45
      );
      const gust = Math.pow(gustWave, 1.4);

      // 1. Static study room & desk
      if (roomCtx) {
        ctx.drawImage(roomCanvas, 0, 0);
      }

      // 2. Hanging Detective Trench Coat & Fedora on coat rack (sways with wind gust!)
      const coatSway =
        Math.sin(tm * 2.1) * 0.045 + gust * (0.14 + Math.sin(tm * 5.2) * 0.035);
      ctx.save();
      ctx.translate(L.rackX, L.rackTopY + 6);
      ctx.rotate(coatSway);
      // Trench coat shoulders & flowing coat body
      ctx.fillStyle = '#6f4e37';
      ctx.beginPath();
      ctx.moveTo(-20, 4);
      ctx.quadraticCurveTo(0, -4, 20, 4);
      ctx.lineTo(31, 128);
      ctx.quadraticCurveTo(8, 134, -2, 128);
      ctx.lineTo(-28, 124);
      ctx.closePath();
      ctx.fill();
      // Lapels & belt
      ctx.fillStyle = '#533825';
      ctx.beginPath();
      ctx.moveTo(-12, 4);
      ctx.lineTo(-2, 42);
      ctx.lineTo(-16, 48);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, 4);
      ctx.lineTo(2, 42);
      ctx.lineTo(16, 48);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3d2719';
      ctx.fillRect(-22, 58, 45, 7);
      // Fedora hat hanging at top peg
      ctx.fillStyle = '#4a3121';
      ctx.beginPath();
      ctx.ellipse(0, -5, 22, 5, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-12, -6);
      ctx.lineTo(-8, -22);
      ctx.lineTo(8, -22);
      ctx.lineTo(12, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(-11, -10, 22, 3);
      ctx.restore();

      // 3. Fluttering papers on the desk (curling/rustling in the wind)
      const deskSheets = [
        { x: L.leftStackX + 86, y: L.deskY + 42, w: 32, h: 42, rot: -0.18 },
        { x: L.laptopX - 38, y: L.deskY + 62, w: 28, h: 36, rot: 0.24 },
        { x: L.rightStackX - 18, y: L.deskY + 58, w: 30, h: 38, rot: -0.1 },
      ];
      deskSheets.forEach((sh, i) => {
        const flutter = Math.sin(tm * 4.8 + i * 1.7) * (0.04 + gust * 0.14);
        const lift = gust * (2 + (i % 2) * 2.5);
        ctx.save();
        ctx.translate(sh.x, sh.y - lift);
        ctx.rotate(sh.rot + flutter);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(-sh.w * 0.5 + 2, -sh.h * 0.5 + 3, sh.w, sh.h);
        ctx.fillStyle = '#f3e6d3';
        ctx.fillRect(-sh.w * 0.5, -sh.h * 0.5, sh.w, sh.h);
        ctx.fillStyle = 'rgba(110, 74, 48, 0.45)';
        ctx.fillRect(-sh.w * 0.36, -sh.h * 0.25, sh.w * 0.72, 2);
        ctx.fillRect(-sh.w * 0.36, -sh.h * 0.05, sh.w * 0.62, 2);
        ctx.fillRect(-sh.w * 0.36, sh.h * 0.15, sh.w * 0.5, 2);
        ctx.restore();
      });

      // 4. Open Laptop showing Criminal Case-style Suspect Portrait
      ctx.save();
      ctx.translate(L.laptopX, L.laptopY);
      const sw = L.laptopW;
      const sh = L.laptopH;
      // Screen lid
      ctx.fillStyle = '#1f140f';
      ctx.fillRect(-sw * 0.5, -sh, sw, sh);
      ctx.strokeStyle = '#8c5a3c';
      ctx.lineWidth = 2;
      ctx.strokeRect(-sw * 0.5, -sh, sw, sh);
      // Glowing Criminal Case UI screen
      const scrPad = 6;
      const scW = sw - scrPad * 2;
      const scH = sh - scrPad * 2;
      const scX = -sw * 0.5 + scrPad;
      const scY = -sh + scrPad;
      const scrGrad = ctx.createLinearGradient(scX, scY, scX, scY + scH);
      scrGrad.addColorStop(0, '#2e1d14');
      scrGrad.addColorStop(1, '#1a0f0a');
      ctx.fillStyle = scrGrad;
      ctx.fillRect(scX, scY, scW, scH);

      // Top bar "CASE FILE #07 - SUSPECT"
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(scX, scY, scW, 13);
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('CASE FILE // SUSPECT', scX + 5, scY + 9);

      // Mugshot height ruler lines behind suspect
      const mugX = scX + 6;
      const mugY = scY + 17;
      const mugW = scW * 0.44;
      const mugH = scH - 22;
      ctx.fillStyle = '#dfd0be';
      ctx.fillRect(mugX, mugY, mugW, mugH);
      ctx.strokeStyle = 'rgba(60, 35, 20, 0.32)';
      ctx.lineWidth = 0.8;
      for (let ry = mugY + 6; ry < mugY + mugH; ry += 7) {
        ctx.beginPath();
        ctx.moveTo(mugX, ry);
        ctx.lineTo(mugX + mugW, ry);
        ctx.stroke();
      }
      // Suspect face silhouette & features inside mugshot
      const faceCx = mugX + mugW * 0.5;
      const faceCy = mugY + mugH * 0.46;
      ctx.fillStyle = '#291810';
      // Coat collar & shoulders
      ctx.beginPath();
      ctx.moveTo(faceCx - mugW * 0.36, mugY + mugH);
      ctx.quadraticCurveTo(faceCx, mugY + mugH * 0.65, faceCx + mugW * 0.36, mugY + mugH);
      ctx.fill();
      // Face oval
      ctx.fillStyle = '#c89f7d';
      ctx.beginPath();
      ctx.ellipse(faceCx, faceCy, mugW * 0.22, mugH * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fedora brim shadow across brow + intense eyes
      ctx.fillStyle = '#1f120c';
      ctx.beginPath();
      ctx.ellipse(faceCx, faceCy - mugH * 0.14, mugW * 0.34, 4, -0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(faceCx - mugW * 0.2, faceCy - mugH * 0.34, mugW * 0.4, mugH * 0.2);
      ctx.fillStyle = '#140b07';
      ctx.fillRect(faceCx - 6, faceCy - 2, 4, 2.2);
      ctx.fillRect(faceCx + 2, faceCy - 2, 4, 2.2);
      // Evidence number placard at chest
      ctx.fillStyle = '#1c120d';
      ctx.fillRect(faceCx - 12, mugY + mugH - 13, 24, 9);
      ctx.fillStyle = '#f5ebe0';
      ctx.font = 'bold 6px monospace';
      ctx.fillText('409-B', faceCx - 10, mugY + mugH - 6);

      // Right side suspect dossier lines & pulsing "MATCH" badge
      const infoX = mugX + mugW + 8;
      const infoW = scW - mugW - 20;
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(infoX, mugY + 3, infoW * 0.85, 4);
      ctx.fillStyle = 'rgba(245, 235, 224, 0.55)';
      ctx.fillRect(infoX, mugY + 12, infoW * 0.92, 3);
      ctx.fillRect(infoX, mugY + 19, infoW * 0.72, 3);
      ctx.fillRect(infoX, mugY + 26, infoW * 0.8, 3);
      const pulse = 0.65 + 0.35 * Math.sin(tm * 3.2);
      ctx.fillStyle = `rgba(217, 119, 6, ${pulse})`;
      ctx.fillRect(infoX, mugY + mugH - 15, infoW * 0.75, 11);
      ctx.fillStyle = '#1c120d';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('MATCH 94%', infoX + 4, mugY + mugH - 7);

      // Laptop keyboard base (perspective trapezoid)
      ctx.fillStyle = '#2d1c14';
      ctx.beginPath();
      ctx.moveTo(-sw * 0.5, 0);
      ctx.lineTo(sw * 0.5, 0);
      ctx.lineTo(sw * 0.62, 24);
      ctx.lineTo(-sw * 0.62, 24);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#180e0a';
      ctx.fillRect(-sw * 0.42, 4, sw * 0.84, 12);
      ctx.restore();

      // 5. Magnifying Glass ("Kaca Pembesar") & Fountain Pen ("Pulpen") on desk
      const lightBob = gust * Math.sin(tm * 6.5) * 1.4;
      // Magnifying glass resting over clue paper
      ctx.save();
      ctx.translate(L.magX, L.magY);
      ctx.rotate(-0.42 + gust * 0.025);
      // Handle (polished walnut + brass ferrule)
      ctx.fillStyle = '#2c180e';
      ctx.fillRect(14, -3.5, 34, 7);
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(11, -4, 5, 8);
      // Brass rim & glowing glass lens
      ctx.fillStyle = 'rgba(245, 235, 224, 0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4a373';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-3, -3, 10, Math.PI * 1.1, Math.PI * 1.65);
      ctx.stroke();
      ctx.restore();

      // Fountain pen & small brass inkwell/notepad (trembles slightly in wind)
      ctx.save();
      ctx.translate(L.penX + lightBob * 0.6, L.penY);
      ctx.rotate(0.28 + gust * 0.03 * Math.sin(tm * 7));
      ctx.fillStyle = '#1a0f0a';
      ctx.fillRect(-20, -2.5, 34, 5);
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(8, -2.5, 6, 5);
      ctx.beginPath();
      ctx.moveTo(14, -2.5);
      ctx.lineTo(22, 0);
      ctx.lineTo(14, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 6. Volumetric Window Sunlight Shafts ("Sorot Cahaya dari Jendela ke Meja")
      ctx.save();
      const beamPulse = 0.92 + 0.08 * Math.sin(tm * 0.9);
      const beamGrad = ctx.createLinearGradient(
        L.winX + L.winW * 0.4,
        L.winY,
        L.laptopX + 160,
        height
      );
      beamGrad.addColorStop(0, `rgba(246, 213, 165, ${0.22 * beamPulse})`);
      beamGrad.addColorStop(0.55, `rgba(212, 163, 115, ${0.12 * beamPulse})`);
      beamGrad.addColorStop(1, 'rgba(212, 163, 115, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(L.winX, L.winY);
      ctx.lineTo(L.winX + L.winW, L.winY + 10);
      ctx.lineTo(L.laptopX + 220, height);
      ctx.lineTo(L.leftStackX - 80, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 7. Drifting Dust Motes inside the Sunlight Shaft
      for (const m of dustMotes) {
        if (dt > 0) {
          m.x += (m.vx + gust * 45) * dt;
          m.y += m.vy * dt;
          if (m.x > width + 10) m.x = -10;
          if (m.y < 0) m.y = height * 0.8;
          if (m.y > height * 0.85) m.y = 10;
        }
        const twinkle = 0.65 + 0.35 * Math.sin(tm * 2.4 + m.phase);
        ctx.fillStyle = `rgba(245, 222, 185, ${m.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 8. Soft Wind Gust Wisps
      if (gust > 0.18) {
        for (const wisp of windWisps) {
          if (dt > 0) {
            wisp.x += wisp.speed * (0.6 + gust) * dt;
            if (wisp.x > width + wisp.len) wisp.x = -wisp.len;
          }
          ctx.strokeStyle = `rgba(245, 235, 224, ${wisp.alpha * gust})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(wisp.x, wisp.y + Math.sin(tm * 3 + wisp.phase) * 6);
          ctx.quadraticCurveTo(
            wisp.x + wisp.len * 0.5,
            wisp.y - 8 + Math.sin(tm * 3 + wisp.phase) * 6,
            wisp.x + wisp.len,
            wisp.y + Math.sin(tm * 3 + wisp.phase) * 4
          );
          ctx.stroke();
        }
      }

      // 9. Flying Case-File Papers Blown Off the Desk Stacks
      if (dt > 0 && !prefersReducedMotion) {
        spawnCooldown -= dt * (0.7 + gust * 1.4);
        if (spawnCooldown <= 0 && flyingPapers.length < 5) {
          flyingPapers.push(spawnPaper(width, height, Math.random() > 0.25));
          spawnCooldown = 1.6 + Math.random() * 1.8;
        }
      }

      for (let i = flyingPapers.length - 1; i >= 0; i--) {
        const p = flyingPapers[i];
        if (dt > 0) {
          p.x += (p.vx + gust * 95) * dt;
          p.y += (p.vy + Math.sin(tm * 3.4 + p.phase) * 28) * dt;
          p.vy += 12 * dt; // slight floaty gravity after upward gust lift
          p.rot += p.vrot * dt;
          p.fold += 4.2 * dt;
        }
        const scaleY = 0.55 + 0.45 * Math.abs(Math.cos(p.fold));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, scaleY);
        ctx.fillStyle = `rgba(245, 235, 220, ${p.alpha})`;
        ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
        ctx.strokeStyle = `rgba(140, 90, 60, ${p.alpha * 0.45})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
        ctx.fillStyle = `rgba(90, 54, 34, ${p.alpha * 0.5})`;
        ctx.fillRect(-p.w * 0.34, -p.h * 0.22, p.w * 0.68, 2);
        ctx.fillRect(-p.w * 0.34, -p.h * 0.04, p.w * 0.54, 2);
        ctx.fillRect(-p.w * 0.34, p.h * 0.14, p.w * 0.62, 2);
        ctx.restore();

        if (p.x > width + 80 || p.y < -80 || p.y > height + 80) {
          flyingPapers.splice(i, 1);
        }
      }
    };

    resize();
    drawFrame(0);
    window.addEventListener('resize', resize);

    let rafId = 0;
    let lastTime = 0;
    if (!prefersReducedMotion) {
      const tick = (now: number) => {
        if (!lastTime) lastTime = now;
        const dt = (now - lastTime) / 1000;
        if (dt >= 0.04) {
          lastTime = now;
          drawFrame(Math.min(0.1, dt));
        }
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="tb-detective-canvas"
      aria-hidden="true"
    />
  );
}

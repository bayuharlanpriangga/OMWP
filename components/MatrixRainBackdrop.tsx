'use client';

import React from 'react';

const MATRIX_GLYPHS =
  '01{}[]()<>=;:/\\*+->$_&|~^アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF';

interface MatrixState {
  width: number;
  height: number;
  fontSize: number;
  drops: number[];
  speeds: number[];
  columnChars: string[];
}

export function MatrixRainBackdrop() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const state: MatrixState = {
      width: 0,
      height: 0,
      fontSize: 16,
      drops: [],
      speeds: [],
      columnChars: [],
    };

    const randomGlyph = () =>
      MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];

    const drawStep = (advance: boolean) => {
      if (state.width <= 0 || state.height <= 0) return;

      ctx.fillStyle = 'rgba(3, 8, 4, 0.085)';
      ctx.fillRect(0, 0, state.width, state.height);

      ctx.font = `500 ${state.fontSize}px var(--font-hacker), var(--font-mono), ui-monospace, monospace`;
      ctx.textBaseline = 'top';

      const colCount = state.drops.length;
      for (let i = 0; i < colCount; i++) {
        const x = i * state.fontSize;
        const row = Math.floor(state.drops[i]);
        const y = row * state.fontSize;

        if (advance) {
          state.columnChars[i] = randomGlyph();
        }
        const ch = state.columnChars[i] || randomGlyph();

        // Subtle phosphor lead glyph highlight
        if (Math.random() > 0.84) {
          ctx.fillStyle = '#dcffe8';
        } else if (i % 5 === 0) {
          ctx.fillStyle = '#39ff14';
        } else {
          ctx.fillStyle = '#00ff66';
        }

        ctx.fillText(ch, x, y);

        if (advance) {
          if (y > state.height && Math.random() > 0.972) {
            state.drops[i] = -Math.random() * 6;
          } else {
            state.drops[i] += state.speeds[i];
          }
        }
      }
    };

    const initSize = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;

      state.width = w;
      state.height = h;
      state.fontSize = w < 640 ? 14 : 16;

      canvas.width = Math.max(1, Math.floor(w));
      canvas.height = Math.max(1, Math.floor(h));
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const cols = Math.max(1, Math.ceil(w / state.fontSize));
      const rows = Math.max(8, Math.ceil(h / state.fontSize));

      state.drops = Array.from({ length: cols }, () => Math.random() * rows);
      state.speeds = Array.from(
        { length: cols },
        () => 0.55 + Math.random() * 0.65
      );
      state.columnChars = Array.from({ length: cols }, () => randomGlyph());

      ctx.fillStyle = '#030804';
      ctx.fillRect(0, 0, w, h);

      // Pre-warm trails so streams look immediately alive on mount
      for (let i = 0; i < 24; i++) {
        drawStep(true);
      }
    };

    initSize();

    let resizeTimer: number | null = null;
    const handleResize = () => {
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(initSize, 120);
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
      if (now - lastTick >= 55) {
        lastTick = now;
        drawStep(true);
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
      data-testid="matrix-rain-canvas"
      aria-hidden="true"
      className="tb-matrix-canvas"
    />
  );
}

'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import type { ThemeId } from '@/lib/deck-types';
import { THEME_ORDER, THEME_SWATCHES } from '@/lib/theme/theme-data';

interface ThemeModalProps {
  open: boolean;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  onClose: () => void;
}

export function ThemeModal({
  open,
  currentTheme,
  onSelectTheme,
  onClose,
}: ThemeModalProps) {
  const [hoveredTheme, setHoveredTheme] = React.useState<ThemeId | null>(null);
  const [clickedTheme, setClickedTheme] = React.useState<ThemeId | null>(null);
  const closeTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!open) return null;

  const handleChoose = (id: ThemeId) => {
    setClickedTheme(id);
    onSelectTheme(id);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setClickedTheme(null);
      onClose();
    }, 320);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pilih tema presentasi"
        className="modal-card max-w-[460px]"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold m-0">Tema</h2>
          <button
            type="button"
            className="pbtn sm"
            onClick={onClose}
            aria-label="Tutup modal tema"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2 max-h-[calc(88vh-135px)] overflow-y-auto px-0.5 py-0.5 pr-1">
          {THEME_ORDER.map((id) => {
            const visual = THEME_SWATCHES[id];
            const active = currentTheme === id;
            const isEngaged = hoveredTheme === id || clickedTheme === id;
            const isBrutal = id === 'brutal';
            const isDefault = id === 'default';
            const isCyberpunk = id === 'cyberpunk';
            const isHacker = id === 'hacker';
            const isAstronomi = id === 'astronomi';
            const isGhost = id === 'ghost';
            const isHalloween = id === 'halloween';
            const isAquarium = id === 'aquarium';
            const isDetective = id === 'detective';
            const isSummer = id === 'summer';
            const isPixel = id === 'pixel';
            const isDino = id === 'dino';
            const isZodiac = id === 'zodiac';
            const isTarot = id === 'tarot';
            const isJoker = id === 'joker';
            const isAi = id === 'ai';

            return (
              <button
                key={id}
                type="button"
                aria-label={visual.name}
                aria-pressed={active}
                onMouseEnter={() => setHoveredTheme(id)}
                onMouseLeave={() =>
                  setHoveredTheme((prev) => (prev === id ? null : prev))
                }
                onFocus={() => setHoveredTheme(id)}
                onBlur={() =>
                  setHoveredTheme((prev) => (prev === id ? null : prev))
                }
                onClick={() => handleChoose(id)}
                className={`w-full flex items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors ${
                  isDefault
                    ? `bg-[#EEF1F4] text-[#0D0D0D] border rounded-[2px] ${
                        active
                          ? 'border-[#0D0D0D] ring-1 ring-[#0D0D0D]'
                          : 'border-[#4F7A99] hover:border-[#0D0D0D]'
                      }`
                    : isBrutal
                      ? 'bg-[#fff4d6] text-[#111111] border-[3px] border-[#111111] rounded-[10px] shadow-[4px_4px_0_#111111]'
                      : isCyberpunk
                        ? `bg-[#090612] text-[#f3e8ff] border rounded-[4px] ${
                            active
                              ? 'border-[#a855f7] shadow-[0_0_16px_rgba(168,85,247,0.38)]'
                              : 'border-[#a855f7]/55 hover:border-[#c084fc]'
                          }`
                        : isHacker
                          ? `bg-[#030804] text-[#d9ffe5] border rounded-[4px] ${
                              active
                                ? 'border-[#00ff66] shadow-[0_0_16px_rgba(0,255,102,0.32)]'
                                : 'border-[#00ff66]/55 hover:border-[#00ff66]'
                            }`
                          : isAstronomi
                            ? `bg-[#050507] text-[#f4f4f5] border rounded-[4px] ${
                                active
                                  ? 'border-[#ffffff] shadow-[0_0_16px_rgba(255,255,255,0.22)]'
                                  : 'border-[#a1a1aa]/50 hover:border-[#e4e4e7]'
                              }`
                            : isGhost
                              ? `bg-[#080405] text-[#f4eaea] border rounded-[4px] ${
                                  active
                                    ? 'border-[#ef4444] shadow-[0_0_16px_rgba(220,38,38,0.42)]'
                                    : 'border-[#dc2626]/55 hover:border-[#ef4444]'
                                }`
                              : isHalloween
                                ? `bg-[#09060d] text-[#fff4e8] border rounded-[4px] ${
                                    active
                                      ? 'border-[#f97316] shadow-[0_0_16px_rgba(249,115,22,0.42)]'
                                      : 'border-[#f97316]/55 hover:border-[#fb923c]'
                                  }`
                                : isAquarium
                                  ? `bg-[#04182e] text-[#e0f2fe] border rounded-[6px] ${
                                      active
                                        ? 'border-[#38bdf8] shadow-[0_0_16px_rgba(14,165,233,0.46)]'
                                        : 'border-[#0ea5e9]/55 hover:border-[#38bdf8]'
                                    }`
                                  : isDetective
                                    ? `bg-[#1c120d] text-[#f5ebe0] border rounded-[4px] ${
                                        active
                                          ? 'border-[#d4a373] shadow-[0_0_16px_rgba(212,163,115,0.42)]'
                                          : 'border-[#a67c52]/60 hover:border-[#d4a373]'
                                      }`
                                    : isSummer
                                      ? `bg-[#fef9c3] text-[#422006] border-[1.5px] rounded-[8px] ${
                                          active
                                            ? 'border-[#ca8a04] shadow-[0_0_16px_rgba(250,204,21,0.52)]'
                                            : 'border-[#eab308]/80 hover:border-[#ca8a04]'
                                        }`
                                      : isPixel
                                        ? `bg-[#0b183d] text-[#fefce8] border-2 rounded-none shadow-[3px_3px_0_#facc15] ${
                                            active
                                              ? 'border-[#fde047] bg-[#132b6b]'
                                              : 'border-[#facc15]/80 hover:border-[#fde047]'
                                          }`
                                        : isDino
                                          ? `bg-[#e5e7eb] text-[#18181b] border-2 rounded-none shadow-[3px_3px_0_#52525b] ${
                                              active
                                                ? 'border-[#18181b] bg-[#d4d4d8]'
                                                : 'border-[#52525b] hover:border-[#18181b]'
                                            }`
                                          : isZodiac
                                            ? `bg-[#091026] text-[#faf6eb] border rounded-[6px] ${
                                                active
                                                  ? 'border-[#d4af37] shadow-[0_0_16px_rgba(212,175,55,0.34)]'
                                                  : 'border-[#d4af37]/55 hover:border-[#facc15]'
                                              }`
                                            : isTarot
                                              ? `bg-[#12071b] text-[#f5ecda] border rounded-[6px] ${
                                                  active
                                                    ? 'border-[#e3b96c] shadow-[0_0_16px_rgba(201,152,70,0.38)]'
                                                    : 'border-[#c99846]/55 hover:border-[#e3b96c]'
                                                }`
                                              : isJoker
                                                ? `bg-[#12040c] text-[#fff1f7] border rounded-[6px] ${
                                                    active
                                                      ? 'border-[#ff1f8e] shadow-[0_0_18px_rgba(255,31,142,0.48)]'
                                                      : 'border-[#ff1f8e]/55 hover:border-[#ff66b2]'
                                                  }`
                                                : isAi
                                                  ? `bg-[#ffffff] text-[#0f172a] border rounded-[6px] ${
                                                      active
                                                        ? 'border-[#0f172a] ring-1 ring-[#0f172a] shadow-[0_6px_18px_rgba(15,23,42,0.12)]'
                                                        : 'border-[#cbd5e1] hover:border-[#4d6bfe]'
                                                    }`
                                                  : 'bg-[#f4f6f9] text-[#14243d] border border-[#c5ccd8] border-t-[3px] border-t-[#14243d] rounded-[6px] shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isDefault ? (
                    <span className="inline-flex items-center gap-2.5">
                      <motion.span
                        aria-hidden="true"
                        className="w-3.5 h-3.5 shrink-0"
                        style={{
                          backgroundColor: active || isEngaged ? '#0D0D0D' : '#4F7A99',
                          clipPath:
                            'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                        }}
                        animate={
                          clickedTheme === id
                            ? { rotate: 90, scale: 1.15 }
                            : isEngaged
                              ? { rotate: 45, scale: 1.08 }
                              : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span
                        className="inline-block text-xl font-semibold tracking-tight"
                        style={{
                          fontFamily:
                            'var(--font-orias-serif), Georgia, serif',
                        }}
                      >
                        {visual.name}
                      </span>
                    </span>
                  ) : isBrutal ? (
                    <motion.span
                      className="inline-block text-xl font-bold tracking-tight"
                      style={{
                        fontFamily: 'var(--font-brutal), system-ui, sans-serif',
                      }}
                      whileTap={{ scale: 0.9, rotate: 3, y: 1 }}
                      animate={
                        clickedTheme === id
                          ? { scale: 1.16, rotate: -3, y: -3 }
                          : isEngaged
                            ? { scale: 1.08, rotate: -2, y: -2 }
                            : { scale: 1, rotate: 0, y: 0 }
                      }
                      transition={{
                        type: 'spring',
                        stiffness: 560,
                        damping: 9,
                      }}
                    >
                      {visual.name}
                    </motion.span>
                  ) : isCyberpunk ? (
                    <motion.span
                      className="relative inline-block text-xl font-bold tracking-wider"
                      style={{
                        fontFamily:
                          'var(--font-cyber-display), system-ui, sans-serif',
                        textShadow: isEngaged || active
                          ? '0 0 10px rgba(168, 85, 247, 0.72)'
                          : 'none',
                      }}
                      animate={
                        clickedTheme === id
                          ? { x: [0, -2, 2, 0], scale: 1.04 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1 }
                      }
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {visual.name}
                      <motion.span
                        aria-hidden="true"
                        className="block h-[2px] origin-left mt-0.5"
                        style={{
                          background:
                            'linear-gradient(90deg, #a855f7 0%, #ff2a85 100%)',
                        }}
                        initial={false}
                        animate={{ scaleX: isEngaged || active ? 1 : 0 }}
                        transition={{
                          duration: 0.26,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </motion.span>
                  ) : isHacker ? (
                    <motion.span
                      className="relative inline-flex items-center gap-1.5 text-xl font-bold tracking-tight"
                      style={{
                        fontFamily:
                          'var(--font-hacker), var(--font-mono), ui-monospace, monospace',
                        color: '#00ff66',
                        textShadow:
                          isEngaged || active
                            ? '0 0 10px rgba(0, 255, 102, 0.65)'
                            : 'none',
                      }}
                      animate={
                        clickedTheme === id
                          ? { x: [0, 3, 0], scale: 1.04 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1 }
                      }
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <span>{visual.name}</span>
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-2 h-4 bg-[#00ff66]"
                        animate={{
                          opacity: isEngaged || active ? [1, 0.2, 1] : 0.4,
                        }}
                        transition={{
                          duration: 0.9,
                          repeat: isEngaged || active ? Infinity : 0,
                          ease: 'linear',
                        }}
                      />
                    </motion.span>
                  ) : isAstronomi ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-xl font-semibold tracking-wide"
                      style={{
                        fontFamily:
                          'var(--font-astro-display), var(--font-orias-sans), system-ui, sans-serif',
                        color: '#f4f4f5',
                        textShadow:
                          isEngaged || active
                            ? '0 0 12px rgba(255, 255, 255, 0.36)'
                            : 'none',
                      }}
                      animate={
                        clickedTheme === id
                          ? { scale: 1.05 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1 }
                      }
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="relative inline-block w-3.5 h-3.5 rounded-full shrink-0"
                        style={{
                          background:
                            'radial-gradient(circle at 35% 35%, #f5e9ce, #dfc28d 55%, #3f3220 100%)',
                          boxShadow:
                            active || isEngaged
                              ? '0 0 0 2px rgba(255, 255, 255, 0.65)'
                              : '0 0 0 1.5px rgba(212, 212, 216, 0.45)',
                        }}
                        animate={
                          clickedTheme === id
                            ? { rotate: 180, scale: 1.15 }
                            : isEngaged
                              ? { rotate: 24, scale: 1.08 }
                              : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isGhost ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-xl font-bold tracking-wider"
                      style={{
                        fontFamily:
                          'var(--font-ghost-display), var(--font-serif), Georgia, serif',
                        color: '#f4eaea',
                        textShadow:
                          isEngaged || active
                            ? '0 0 12px rgba(220, 38, 38, 0.72)'
                            : 'none',
                      }}
                      animate={
                        clickedTheme === id
                          ? { x: [0, -2, 2, 0], scale: 1.04 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1 }
                      }
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3 h-3 rounded-full shrink-0 bg-[#dc2626]"
                        style={{
                          boxShadow:
                            active || isEngaged
                              ? '0 0 10px rgba(239, 68, 68, 0.9)'
                              : '0 0 4px rgba(220, 38, 38, 0.5)',
                        }}
                        animate={{
                          opacity: isEngaged || active ? [1, 0.35, 1] : 0.75,
                        }}
                        transition={{
                          duration: 1.4,
                          repeat: isEngaged || active ? Infinity : 0,
                          ease: 'easeInOut',
                        }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isHalloween ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-xl tracking-wider"
                      style={{
                        fontFamily:
                          'var(--font-halloween-display), var(--font-ghost-display), Georgia, serif',
                        color: '#fff4e8',
                        textShadow:
                          isEngaged || active
                            ? '0 0 12px rgba(249, 115, 22, 0.78)'
                            : 'none',
                      }}
                      animate={
                        clickedTheme === id
                          ? { scale: 1.06, rotate: -1.5 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1, rotate: 0 }
                      }
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3.5 h-3 rounded-full shrink-0 bg-[#f97316]"
                        style={{
                          boxShadow:
                            active || isEngaged
                              ? '0 0 10px rgba(251, 146, 60, 0.92)'
                              : '0 0 4px rgba(249, 115, 22, 0.5)',
                        }}
                        animate={{
                          scale: isEngaged || active ? [1, 1.12, 1] : 1,
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: isEngaged || active ? Infinity : 0,
                          ease: 'easeInOut',
                        }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isAquarium ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-xl font-semibold tracking-wide"
                      style={{
                        fontFamily:
                          'var(--font-aquarium-display), var(--font-orias-sans), system-ui, sans-serif',
                        color: '#e0f2fe',
                        textShadow:
                          isEngaged || active
                            ? '0 0 12px rgba(56, 189, 248, 0.72)'
                            : 'none',
                      }}
                      animate={
                        clickedTheme === id
                          ? { scale: 1.05, y: -1 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1, y: 0 }
                      }
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3.5 h-3.5 rounded-full shrink-0"
                        style={{
                          background:
                            'radial-gradient(circle at 32% 32%, #e0f2fe, #38bdf8 55%, #0284c7 100%)',
                          boxShadow:
                            active || isEngaged
                              ? '0 0 10px rgba(56, 189, 248, 0.92)'
                              : '0 0 4px rgba(14, 165, 233, 0.5)',
                        }}
                        animate={{
                          y: isEngaged || active ? [0, -2, 0] : 0,
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: isEngaged || active ? Infinity : 0,
                          ease: 'easeInOut',
                        }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isDetective ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-xl font-semibold tracking-wide"
                      style={{
                        fontFamily:
                          'var(--font-ghost-display), var(--font-serif), Georgia, serif',
                        color: '#f5ebe0',
                        textShadow:
                          isEngaged || active
                            ? '0 0 12px rgba(212, 163, 115, 0.65)'
                            : 'none',
                      }}
                      animate={
                        clickedTheme === id
                          ? { scale: 1.05 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1 }
                      }
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3.5 h-3.5 rounded-full shrink-0 border-2 border-[#d4a373] bg-[#5a3622]"
                        animate={
                          clickedTheme === id
                            ? { rotate: 45, scale: 1.15 }
                            : isEngaged
                              ? { scale: 1.1 }
                              : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isSummer ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-xl font-semibold tracking-wide"
                      style={{
                        fontFamily:
                          'var(--font-aquarium-display), var(--font-orias-sans), system-ui, sans-serif',
                        color: '#422006',
                        textShadow:
                          isEngaged || active
                            ? '0 0 10px rgba(250, 204, 21, 0.72)'
                            : 'none',
                      }}
                      animate={
                        clickedTheme === id
                          ? { scale: 1.05, y: -1 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1, y: 0 }
                      }
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3.5 h-3.5 rounded-full shrink-0 border border-[#ca8a04]"
                        style={{
                          background:
                            'radial-gradient(circle at 35% 35%, #fef9c3, #facc15 62%, #f59e0b 100%)',
                          boxShadow:
                            active || isEngaged
                              ? '0 0 10px rgba(250, 204, 21, 0.9)'
                              : '0 0 4px rgba(234, 179, 8, 0.5)',
                        }}
                        animate={
                          clickedTheme === id
                            ? { scale: 1.2 }
                            : isEngaged
                              ? { rotate: 45, scale: 1.1 }
                              : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isPixel ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-lg font-bold tracking-wide"
                      style={{
                        fontFamily:
                          'var(--font-pixel), var(--font-mono), ui-monospace, monospace',
                        color: '#fef08a',
                      }}
                      animate={
                        clickedTheme === id
                          ? { y: [0, -4, 0] }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, y: 0 }
                      }
                      transition={{ duration: 0.22, ease: 'linear' }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3.5 h-3.5 shrink-0 border-2 border-[#b45309] bg-[#facc15] shadow-[2px_2px_0_#1d4ed8]"
                        animate={
                          isEngaged || active
                            ? { y: [0, -2, 0] }
                            : { y: 0 }
                        }
                        transition={{
                          duration: 0.7,
                          repeat: isEngaged || active ? Infinity : 0,
                          ease: 'linear',
                        }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isDino ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-lg font-bold tracking-wide"
                      style={{
                        fontFamily:
                          'var(--font-pixel), var(--font-mono), ui-monospace, monospace',
                        color: '#27272a',
                      }}
                      animate={
                        clickedTheme === id
                          ? { y: [0, -5, 0] }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, y: 0 }
                      }
                      transition={{ duration: 0.22, ease: 'linear' }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3.5 h-3.5 shrink-0 border-2 border-[#27272a] bg-[#535353] shadow-[2px_2px_0_#9ca3af]"
                        animate={
                          isEngaged || active
                            ? { y: [0, -3, 0] }
                            : { y: 0 }
                        }
                        transition={{
                          duration: 0.6,
                          repeat: isEngaged || active ? Infinity : 0,
                          ease: 'linear',
                        }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isZodiac ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-xl font-semibold tracking-wider"
                      style={{
                        fontFamily:
                          'var(--font-ghost-display), var(--font-serif), Georgia, serif',
                        color: '#faf6eb',
                        textShadow:
                          isEngaged || active
                            ? '0 0 12px rgba(212, 175, 55, 0.58)'
                            : 'none',
                      }}
                      animate={
                        clickedTheme === id
                          ? { scale: 1.05 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1 }
                      }
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3.5 h-3.5 shrink-0"
                        style={{
                          backgroundColor: '#e5c158',
                          clipPath:
                            'polygon(50% 0%, 64% 36%, 100% 50%, 64% 64%, 50% 100%, 36% 64%, 0% 50%, 36% 36%)',
                        }}
                        animate={
                          clickedTheme === id
                            ? { rotate: 180, scale: 1.2 }
                            : isEngaged || active
                              ? { rotate: 45, scale: 1.08 }
                              : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isTarot ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-xl font-semibold tracking-wider"
                      style={{
                        fontFamily:
                          'var(--font-ghost-display), var(--font-serif), Georgia, serif',
                        color: '#f5ecda',
                        textShadow:
                          isEngaged || active
                            ? '0 0 12px rgba(201, 152, 70, 0.65)'
                            : 'none',
                      }}
                      animate={
                        clickedTheme === id
                          ? { scale: 1.05 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1 }
                      }
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3 h-4 shrink-0 border border-[#e3b96c] rounded-[2px]"
                        style={{
                          background:
                            'linear-gradient(155deg, #8b2c4e 0%, #381d52 60%, #160922 100%)',
                          boxShadow:
                            active || isEngaged
                              ? '0 0 8px rgba(227, 185, 108, 0.72)'
                              : 'none',
                        }}
                        animate={
                          clickedTheme === id
                            ? { rotateY: 180, scale: 1.15 }
                            : isEngaged || active
                              ? { rotate: -8, scale: 1.08 }
                              : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isJoker ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-xl font-bold italic tracking-wider"
                      style={{
                        fontFamily:
                          'var(--font-joker-display), var(--font-serif), Georgia, serif',
                        color: '#fff1f7',
                        textShadow:
                          isEngaged || active
                            ? '0 0 12px rgba(255, 31, 142, 0.85)'
                            : '0 0 6px rgba(255, 31, 142, 0.35)',
                      }}
                      animate={
                        clickedTheme === id
                          ? { scale: 1.06, rotate: -2 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1, rotate: 0 }
                      }
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3.5 h-3.5 shrink-0"
                        style={{
                          background:
                            'linear-gradient(135deg, #ff1f8e 0%, #ff66b2 55%, #fff1f7 100%)',
                          clipPath:
                            'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                          boxShadow:
                            active || isEngaged
                              ? '0 0 10px rgba(255, 31, 142, 0.85)'
                              : 'none',
                        }}
                        animate={
                          clickedTheme === id
                            ? { rotate: 180, scale: 1.25 }
                            : isEngaged || active
                              ? { rotate: 45, scale: 1.12 }
                              : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : isAi ? (
                    <motion.span
                      className="relative inline-flex items-center gap-2 text-xl font-semibold tracking-wide"
                      style={{
                        fontFamily:
                          'var(--font-astro-display), var(--font-orias-sans), system-ui, sans-serif',
                        color: '#0f172a',
                      }}
                      animate={
                        clickedTheme === id
                          ? { scale: 1.05 }
                          : isEngaged
                            ? { x: 2 }
                            : { x: 0, scale: 1 }
                      }
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <motion.span
                        aria-hidden="true"
                        className="inline-block w-3.5 h-3.5 shrink-0"
                        style={{
                          background:
                            'linear-gradient(135deg, #4285f4 0%, #d97757 38%, #10a37f 72%, #4d6bfe 100%)',
                          clipPath:
                            'polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)',
                        }}
                        animate={
                          clickedTheme === id
                            ? { rotate: 180, scale: 1.2 }
                            : isEngaged || active
                              ? { rotate: 45, scale: 1.1 }
                              : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span>{visual.name}</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      className="relative inline-block text-xl font-semibold"
                      style={{
                        fontFamily: 'var(--font-serif), Georgia, serif',
                      }}
                      animate={
                        clickedTheme === id
                          ? { opacity: [0.65, 1], y: [3, 0], letterSpacing: '0.025em' }
                          : isEngaged
                            ? { y: -1.5, letterSpacing: '0.025em' }
                            : { y: 0, letterSpacing: '0em' }
                      }
                      transition={{
                        duration: 0.42,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {visual.name}
                      <motion.span
                        aria-hidden="true"
                        className="block h-[2px] bg-[#b08d3c] origin-left mt-0.5"
                        initial={false}
                        animate={{ scaleX: isEngaged || active ? 1 : 0 }}
                        transition={{
                          duration: 0.38,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </motion.span>
                  )}

                  {active && (
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 shrink-0 ${
                        isDefault
                          ? 'bg-[#D4A72C] text-[#0D0D0D] border border-[#0D0D0D] rounded-[2px]'
                          : isBrutal
                            ? 'bg-[#ff6b35] text-[#111111] border-2 border-[#111111] rounded-full'
                            : isCyberpunk
                              ? 'bg-[#a855f7] text-[#090612] rounded-[3px]'
                              : isHacker
                                ? 'bg-[#00ff66] text-[#030804] rounded-[3px]'
                                : isAstronomi
                                  ? 'bg-[#ffffff] text-[#050507] rounded-[3px]'
                                  : isGhost
                                    ? 'bg-[#dc2626] text-[#fff5f5] rounded-[3px]'
                                    : isHalloween
                                      ? 'bg-[#f97316] text-[#09060d] rounded-[3px]'
                                      : isAquarium
                                        ? 'bg-[#38bdf8] text-[#04182e] rounded-full'
                                        : isDetective
                                          ? 'bg-[#d4a373] text-[#1c120d] rounded-[3px]'
                                          : isSummer
                                            ? 'bg-[#facc15] text-[#422006] border border-[#ca8a04] rounded-full'
                                            : isPixel
                                              ? 'bg-[#facc15] text-[#08122e] border border-[#fde047] rounded-none'
                                              : isDino
                                                ? 'bg-[#3f3f46] text-[#f4f4f5] border border-[#18181b] rounded-none'
                                                : isZodiac
                                                  ? 'bg-[#d4af37] text-[#070b1a] rounded-[3px]'
                                                  : isTarot
                                                    ? 'bg-[#c99846] text-[#0c0611] rounded-[3px]'
                                                    : isJoker
                                                      ? 'bg-[#ff1f8e] text-[#12040c] rounded-[3px]'
                                                      : isAi
                                                        ? 'bg-[#0f172a] text-[#ffffff] rounded-[3px]'
                                                        : 'bg-[#14243d] text-[#ffffff] rounded-full'
                      }`}
                      aria-hidden="true"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-1.5 shrink-0"
                  aria-hidden="true"
                >
                  {visual.colors.map((hex) => (
                    <span
                      key={hex}
                      className={`w-5 h-5 block ${
                        isDefault
                          ? 'rounded-[2px] border border-[#4F7A99]'
                          : isBrutal
                            ? 'rounded-[4px] border-2 border-[#111111]'
                            : isCyberpunk
                              ? 'rounded-[2px] border border-[#a855f7]/60'
                              : isHacker
                                ? 'rounded-[2px] border border-[#00ff66]/60'
                                : isAstronomi
                                  ? 'rounded-[2px] border border-[#a1a1aa]/60'
                                  : isGhost
                                    ? 'rounded-[2px] border border-[#dc2626]/65'
                                    : isHalloween
                                      ? 'rounded-[2px] border border-[#f97316]/65'
                                      : isAquarium
                                        ? 'rounded-full border border-[#38bdf8]/65'
                                        : isDetective
                                          ? 'rounded-[2px] border border-[#d4a373]/65'
                                          : isSummer
                                            ? 'rounded-full border border-[#ca8a04]/70'
                                            : isPixel
                                              ? 'rounded-none border border-[#facc15]/85'
                                              : isDino
                                                ? 'rounded-none border border-[#52525b]'
                                                : isZodiac
                                                  ? 'rounded-full border border-[#d4af37]/65'
                                                  : isTarot
                                                    ? 'rounded-[3px] border border-[#c99846]/65'
                                                    : isJoker
                                                      ? 'rounded-[2px] border border-[#ff1f8e]/75'
                                                      : isAi
                                                        ? 'rounded-[3px] border border-[#cbd5e1]'
                                                        : 'rounded-[3px] border border-[#c5ccd8]'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end mt-4">
          <button type="button" className="pbtn sm" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

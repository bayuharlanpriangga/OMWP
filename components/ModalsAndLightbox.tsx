'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check, KeyRound, Star, X } from 'lucide-react';
import {
  getSelectedModelForProvider,
  groupDetectedKeys,
  type AiProviderId,
  type ByokKeyEntry,
} from '@/lib/ai-providers';
import type { PresenterPrefs, ThemeId } from '@/lib/deck-types';
import { ProviderIcon } from './ProviderBadge';
import { ProviderModelModal } from './ProviderModelModal';

interface ThemeModalProps {
  open: boolean;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  onClose: () => void;
}

const THEME_SWATCHES: Record<
  ThemeId,
  {
    name: string;
    colors: string[];
  }
> = {
  default: {
    name: 'Default',
    colors: ['#EEF1F4', '#FFFFFF', '#A9C6DC', '#D4A72C', '#0D0D0D'],
  },
  brutal: {
    name: 'Brutalis',
    colors: ['#fff4d6', '#ffd23f', '#ff6b35', '#2ec4b6', '#111111'],
  },
  auditor: {
    name: 'Auditor',
    colors: ['#f4f6f9', '#ffffff', '#14243d', '#b08d3c', '#1b2430'],
  },
  cyberpunk: {
    name: 'Cyberpunk',
    colors: ['#070a14', '#0b1224', '#00e5ff', '#ff2a85', '#fcee0a'],
  },
  hacker: {
    name: 'Hacker',
    colors: ['#030804', '#06150b', '#00ff66', '#16a34a', '#d9ffe5'],
  },
  astronomi: {
    name: 'Astronomi',
    colors: ['#03060e', '#080e1c', '#7dd3fc', '#f5c451', '#eef4ff'],
  },
};

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

  const themes: ThemeId[] = [
    'default',
    'brutal',
    'auditor',
    'cyberpunk',
    'hacker',
    'astronomi',
  ];

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
        <div className="flex items-center justify-between mb-4">
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

        <div className="space-y-3">
          {themes.map((id) => {
            const visual = THEME_SWATCHES[id];
            const active = currentTheme === id;
            const isEngaged = hoveredTheme === id || clickedTheme === id;
            const isBrutal = id === 'brutal';
            const isDefault = id === 'default';
            const isCyberpunk = id === 'cyberpunk';
            const isHacker = id === 'hacker';
            const isAstronomi = id === 'astronomi';

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
                className={`w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors ${
                  isDefault
                    ? `bg-[#EEF1F4] text-[#0D0D0D] border rounded-[2px] ${
                        active
                          ? 'border-[#0D0D0D] ring-1 ring-[#0D0D0D]'
                          : 'border-[#4F7A99] hover:border-[#0D0D0D]'
                      }`
                    : isBrutal
                      ? 'bg-[#fff4d6] text-[#111111] border-[3px] border-[#111111] rounded-[10px] shadow-[4px_4px_0_#111111]'
                      : isCyberpunk
                        ? `bg-[#070a14] text-[#e6f1ff] border rounded-[4px] ${
                            active
                              ? 'border-[#00e5ff] shadow-[0_0_16px_rgba(0,229,255,0.35)]'
                              : 'border-[#00e5ff]/55 hover:border-[#00e5ff]'
                          }`
                        : isHacker
                          ? `bg-[#030804] text-[#d9ffe5] border rounded-[4px] ${
                              active
                                ? 'border-[#00ff66] shadow-[0_0_16px_rgba(0,255,102,0.32)]'
                                : 'border-[#00ff66]/55 hover:border-[#00ff66]'
                            }`
                          : isAstronomi
                            ? `bg-[#03060e] text-[#eef4ff] border rounded-[4px] ${
                                active
                                  ? 'border-[#f5c451] shadow-[0_0_16px_rgba(125,211,252,0.28)]'
                                  : 'border-[#7dd3fc]/45 hover:border-[#7dd3fc]'
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
                          ? '0 0 10px rgba(0, 229, 255, 0.7)'
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
                            'linear-gradient(90deg, #00e5ff 0%, #ff2a85 100%)',
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
                        color: '#eef4ff',
                        textShadow:
                          isEngaged || active
                            ? '0 0 12px rgba(125, 211, 252, 0.55)'
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
                            'radial-gradient(circle at 35% 35%, #bae6fd, #38bdf8 60%, #0b162c 100%)',
                          boxShadow:
                            active || isEngaged
                              ? '0 0 0 2px rgba(245, 196, 81, 0.55)'
                              : '0 0 0 1.5px rgba(125, 211, 252, 0.4)',
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
                              ? 'bg-[#00e5ff] text-[#070a14] rounded-[3px]'
                              : isHacker
                                ? 'bg-[#00ff66] text-[#030804] rounded-[3px]'
                                : isAstronomi
                                  ? 'bg-[#f5c451] text-[#03060e] rounded-[3px]'
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
                              ? 'rounded-[2px] border border-[#00e5ff]/60'
                              : isHacker
                                ? 'rounded-[2px] border border-[#00ff66]/60'
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

        <div className="flex justify-end mt-5">
          <button type="button" className="pbtn sm" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

interface PreferencesModalProps {
  open: boolean;
  prefs: PresenterPrefs;
  byokKeys: ByokKeyEntry[];
  onOpenApiKeys: () => void;
  onChangePreferredProvider: (provider: AiProviderId | null) => void;
  onChangePreferredModel: (provider: AiProviderId, model: string | null) => void;
  onClose: () => void;
}

export function PreferencesModal({
  open,
  prefs,
  byokKeys,
  onOpenApiKeys,
  onChangePreferredProvider,
  onChangePreferredModel,
  onClose,
}: PreferencesModalProps) {
  const [modelModalProvider, setModelModalProvider] =
    React.useState<AiProviderId | null>(null);

  const groupedKeys = React.useMemo(
    () => groupDetectedKeys(byokKeys),
    [byokKeys]
  );

  if (!open) return null;

  const preferredProvider = prefs.preferredProvider ?? null;
  const activeGroup = modelModalProvider
    ? groupedKeys.find((g) => g.provider === modelModalProvider) || null
    : null;

  const handleClosePrefs = () => {
    setModelModalProvider(null);
    onClose();
  };

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClosePrefs();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pengaturan Presentasi dan Orias AI"
          className="modal-card max-w-[460px]"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-xl font-bold m-0">Pengaturan Orias AI</h2>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                className="pbtn sm w-7 h-7 !p-0"
                onClick={onOpenApiKeys}
                aria-label="Kelola API Key"
                title="Kelola API Key"
              >
                <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="pbtn sm w-7 h-7 !p-0"
                onClick={handleClosePrefs}
                aria-label="Tutup pengaturan"
                title="Tutup"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2.5">
              {groupedKeys.length === 0 ? (
                <p className="text-sm opacity-75 m-0">Tidak ada api key</p>
              ) : (
                <>
                  <div className="text-xs font-bold uppercase tracking-wide opacity-80">
                    Api Key
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {groupedKeys.map((group) => {
                      const isPreferred = preferredProvider === group.provider;
                      const activeModel = getSelectedModelForProvider(
                        group.provider,
                        prefs.preferredModels
                      );
                      return (
                        <button
                          key={group.provider}
                          type="button"
                          onClick={() => setModelModalProvider(group.provider)}
                          title={`${group.meta.name} (${activeModel}) — Klik untuk memilih model`}
                          className={`inline-flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border-2 text-left transition-colors ${
                            isPreferred
                              ? 'border-[var(--acc)] bg-black/5'
                              : 'border-current/15 hover:border-current/35'
                          }`}
                        >
                          <ProviderIcon
                            provider={group.provider}
                            count={group.count}
                          />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1 text-xs font-semibold leading-tight">
                              <span>{group.meta.name}</span>
                              {isPreferred && (
                                <Star
                                  className="w-3 h-3 fill-[var(--acc)] text-[var(--acc)] shrink-0"
                                  aria-label="Prioritas"
                                />
                              )}
                            </span>
                            <span className="block text-[10px] font-mono opacity-70 truncate max-w-[145px]">
                              {activeModel}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                className="pbtn sm on"
                onClick={handleClosePrefs}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeGroup && (
        <ProviderModelModal
          key={activeGroup.provider}
          open={true}
          provider={activeGroup.provider}
          apiKey={activeGroup.entries[0]?.key ?? ''}
          selectedModel={getSelectedModelForProvider(
            activeGroup.provider,
            prefs.preferredModels
          )}
          isPreferredProvider={preferredProvider === activeGroup.provider}
          hasMultipleProviders={groupedKeys.length > 1}
          onSelectModel={onChangePreferredModel}
          onTogglePreferredProvider={(prov) =>
            onChangePreferredProvider(preferredProvider === prov ? null : prov)
          }
          onClose={() => setModelModalProvider(null)}
        />
      )}
    </>
  );
}

export function ImageLightbox({
  image,
  onClose,
}: {
  image: { src: string; alt: string } | null;
  onClose: () => void;
}) {
  if (!image) return null;
  return (
    <div
      className="fixed inset-0 bg-black/88 z-50 grid place-items-center p-4 cursor-zoom-out"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || 'Pratinjau gambar'}
      onClick={onClose}
    >
      <button
        type="button"
        className="pbtn sm fixed top-4 right-4"
        onClick={onClose}
        aria-label="Tutup pratinjau gambar"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt || 'Gambar presentasi'}
        className="max-w-full max-h-[90vh] object-contain rounded-lg"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

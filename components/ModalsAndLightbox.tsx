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

  const themes: ThemeId[] = ['default', 'brutal', 'auditor'];

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
            <div className="ec space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide opacity-80">
                  Ringkasan API Key Terdeteksi
                </span>
                {groupedKeys.length > 0 && (
                  <span className="text-[11px] opacity-70">
                    Klik ikon untuk pilih model
                  </span>
                )}
              </div>

              {groupedKeys.length === 0 ? (
                <p className="text-xs opacity-75 m-0">
                  Belum ada API key terdeteksi. Klik ikon kunci di kanan atas
                  untuk menambahkan API key.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
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
              )}
            </div>

            <div className="pt-2 border-t border-current/15 text-xs opacity-75 space-y-1">
              <p className="font-bold m-0">Pintasan Keyboard (Mode Tampil):</p>
              <p className="m-0">
                <kbd className="font-mono">←</kbd> /{' '}
                <kbd className="font-mono">→</kbd> atau{' '}
                <kbd className="font-mono">Spasi</kbd> : Pindah slide ·{' '}
                <kbd className="font-mono">Esc</kbd> : Tutup modal/panel
              </p>
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

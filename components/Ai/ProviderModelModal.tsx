'use client';

import React from 'react';
import { Check, Loader2, Search, Star, X } from 'lucide-react';
import {
  fetchProviderModelsDirectClient,
  PROVIDER_META,
  verifyModelDirectClient,
  type AiProviderId,
  type ProviderModelCheckResult,
} from '@/lib/ai/ai-providers';
import { ProviderIcon } from './ProviderBadge';

interface ProviderModelModalProps {
  open: boolean;
  provider: AiProviderId | null;
  apiKey: string;
  selectedModel: string;
  isPreferredProvider: boolean;
  hasMultipleProviders: boolean;
  onSelectModel: (provider: AiProviderId, model: string | null) => void;
  onTogglePreferredProvider: (provider: AiProviderId) => void;
  onClose: () => void;
}

type ModelCheckState = 'idle' | 'checking' | 'valid' | 'invalid';

export function ProviderModelModal({
  open,
  provider,
  apiKey,
  selectedModel,
  isPreferredProvider,
  hasMultipleProviders,
  onSelectModel,
  onTogglePreferredProvider,
  onClose,
}: ProviderModelModalProps) {
  const initialMeta = provider ? PROVIDER_META[provider] : null;
  const initialIsPreset = initialMeta
    ? initialMeta.presetModels.includes(selectedModel)
    : true;

  const [liveModels, setLiveModels] = React.useState<string[]>([]);
  const [loadingList, setLoadingList] = React.useState(() =>
    Boolean(open && provider && apiKey.trim())
  );
  const [filterText, setFilterText] = React.useState('');
  const [customInput, setCustomInput] = React.useState(() =>
    initialIsPreset ? '' : selectedModel
  );
  const [checkState, setCheckState] = React.useState<ModelCheckState>('idle');
  const [checkFeedback, setCheckFeedback] = React.useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const resetTimerRef = React.useRef<number | null>(null);
  const verifyAbortRef = React.useRef<AbortController | null>(null);

  const clearPendingCheck = React.useCallback(() => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    if (verifyAbortRef.current) {
      verifyAbortRef.current.abort();
      verifyAbortRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => clearPendingCheck();
  }, [clearPendingCheck]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  // Fetch live provider models on mount
  React.useEffect(() => {
    if (!open || !provider || !apiKey.trim()) return;

    const controller = new AbortController();
    let active = true;

    (async () => {
      try {
        const res = await fetch('/api/ai/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
          signal: controller.signal,
        });
        const contentType = res.headers.get('content-type') || '';
        let models: string[] = [];
        if (
          res.status === 404 ||
          res.status === 405 ||
          !contentType.includes('application/json')
        ) {
          models = await fetchProviderModelsDirectClient(
            provider,
            apiKey.trim(),
            controller.signal
          );
        } else {
          const data = (await res.json()) as { models?: unknown };
          if (Array.isArray(data.models)) {
            models = data.models.filter(
              (m): m is string => typeof m === 'string' && m.trim().length > 0
            );
          }
        }
        if (active) setLiveModels(models);
      } catch {
        // Silently keep preset list if live fetch fails or aborts
      } finally {
        if (active) setLoadingList(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [open, provider, apiKey]);

  if (!open || !provider) return null;

  const meta = PROVIDER_META[provider];

  // Combine recommended presets + active custom selection + live models without duplicates
  const combinedModels = Array.from(
    new Set([
      ...meta.presetModels,
      ...(selectedModel ? [selectedModel] : []),
      ...liveModels,
    ])
  );

  const normalizedFilter = filterText.trim().toLowerCase();
  const visibleModels = normalizedFilter
    ? combinedModels.filter((m) => m.toLowerCase().includes(normalizedFilter))
    : combinedModels;

  const handleVerifyCustomModel = async () => {
    const trimmed = customInput.trim();
    if (!trimmed || checkState === 'checking') return;

    clearPendingCheck();
    setCheckState('checking');
    setCheckFeedback(null);

    const controller = new AbortController();
    verifyAbortRef.current = controller;

    try {
      const res = await fetch('/api/ai/verify-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          model: trimmed,
        }),
        signal: controller.signal,
      });
      const contentType = res.headers.get('content-type') || '';
      const result: ProviderModelCheckResult =
        res.status === 404 ||
        res.status === 405 ||
        !contentType.includes('application/json')
          ? await verifyModelDirectClient(
              provider,
              apiKey.trim(),
              trimmed,
              controller.signal
            )
          : ((await res.json()) as ProviderModelCheckResult);

      if (result.valid) {
        const resolved = result.resolvedModel || trimmed;
        setCustomInput(resolved);
        onSelectModel(
          provider,
          resolved === meta.defaultModel ? null : resolved
        );
        setCheckState('valid');
        setCheckFeedback({
          ok: true,
          message:
            resolved !== trimmed
              ? `Tersedia sebagai ${resolved} dan dipilih.`
              : `Model ${resolved} tersedia dan dipilih.`,
        });
      } else {
        setCheckState('invalid');
        setCheckFeedback({
          ok: false,
          message:
            result.error ||
            `Model "${trimmed}" tidak tersedia di ${meta.name}.`,
        });
      }

      resetTimerRef.current = window.setTimeout(() => {
        setCheckState('idle');
        resetTimerRef.current = null;
      }, 1800);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setCheckState('invalid');
      setCheckFeedback({
        ok: false,
        message: `Gagal memeriksa model di ${meta.name}.`,
      });
      resetTimerRef.current = window.setTimeout(() => {
        setCheckState('idle');
        resetTimerRef.current = null;
      }, 1800);
    } finally {
      if (verifyAbortRef.current === controller) {
        verifyAbortRef.current = null;
      }
    }
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
        aria-label={`Pilih model ${meta.name}`}
        className="modal-card max-w-[460px]"
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ProviderIcon provider={provider} size="sm" />
            <h2 className="text-lg font-bold m-0 truncate">
              Model {meta.name}
            </h2>
          </div>
          <button
            type="button"
            className="pbtn sm w-7 h-7 !p-0 shrink-0"
            onClick={onClose}
            aria-label={`Tutup pemilihan model ${meta.name}`}
            title="Tutup"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3.5">
          {hasMultipleProviders && (
            <button
              type="button"
              onClick={() => onTogglePreferredProvider(provider)}
              aria-pressed={isPreferredProvider}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-colors ${
                isPreferredProvider
                  ? 'border-[var(--acc)] bg-black/5'
                  : 'border-current/15 hover:border-current/35'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Star
                  className={`w-3.5 h-3.5 ${
                    isPreferredProvider
                      ? 'fill-[var(--acc)] text-[var(--acc)]'
                      : 'opacity-65'
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {isPreferredProvider
                    ? 'Provider Prioritas Utama'
                    : 'Jadikan Provider Prioritas'}
                </span>
              </span>
              <span className="text-[11px] opacity-70">
                {isPreferredProvider ? 'Aktif' : 'Opsional'}
              </span>
            </button>
          )}

          {/* Available Models List */}
          <div className="ec space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide opacity-80">
                Daftar Model {meta.name}
              </span>
              {loadingList && (
                <span className="inline-flex items-center gap-1 text-[11px] opacity-70">
                  <Loader2
                    className="w-3 h-3 animate-spin"
                    aria-hidden="true"
                  />
                  Memuat…
                </span>
              )}
            </div>

            {combinedModels.length > 7 && (
              <input
                type="text"
                className="pinput text-xs py-1.5"
                placeholder="Cari model dari daftar…"
                aria-label="Filter daftar model"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            )}

            <div className="max-h-[190px] overflow-y-auto space-y-1.5 pr-1">
              {visibleModels.length === 0 ? (
                <div className="text-xs opacity-70 py-3 text-center">
                  Tidak ada model yang cocok dengan filter.
                </div>
              ) : (
                visibleModels.map((modelId) => {
                  const isActive = selectedModel === modelId;
                  const isDefault = modelId === meta.defaultModel;
                  const isRecommended = meta.presetModels.includes(modelId);
                  return (
                    <button
                      key={modelId}
                      type="button"
                      onClick={() => {
                        onSelectModel(
                          provider,
                          isDefault ? null : modelId
                        );
                        setCheckFeedback(null);
                        setCheckState('idle');
                      }}
                      aria-pressed={isActive}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border text-left text-xs transition-colors ${
                        isActive
                          ? 'border-[var(--acc)] bg-black/5 font-semibold'
                          : 'border-current/15 hover:border-current/35'
                      }`}
                    >
                      <span className="font-mono truncate min-w-0">
                        {modelId}
                      </span>
                      <span className="inline-flex items-center gap-1.5 shrink-0">
                        {isDefault ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 font-semibold">
                            Default
                          </span>
                        ) : isRecommended ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 opacity-75">
                            Rekomendasi
                          </span>
                        ) : null}
                        {isActive && (
                          <Check
                            className="w-3.5 h-3.5 text-[var(--acc)]"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Custom Model Name + Magnifying Glass Verification */}
          <div className="ec space-y-2">
            <label
              htmlFor="custom-model-input"
              className="block text-xs font-bold uppercase tracking-wide opacity-80"
            >
              Nama Model Kustom
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <input
                  id="custom-model-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  className="pinput pr-10 font-mono text-xs"
                  placeholder={`cth. ${meta.defaultModel}`}
                  value={customInput}
                  onChange={(e) => {
                    clearPendingCheck();
                    setCheckState('idle');
                    setCheckFeedback(null);
                    setCustomInput(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleVerifyCustomModel();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleVerifyCustomModel()}
                  disabled={!customInput.trim() || checkState === 'checking'}
                  aria-label={
                    checkState === 'checking'
                      ? 'Memeriksa ketersediaan model'
                      : checkState === 'valid'
                        ? 'Model tersedia'
                        : checkState === 'invalid'
                          ? 'Model tidak tersedia'
                          : 'Cek ketersediaan model ke provider'
                  }
                  title="Cek validitas model ke provider"
                  className="absolute right-1.5 w-7 h-7 inline-flex items-center justify-center rounded hover:bg-black/10 disabled:opacity-35 disabled:hover:bg-transparent transition-colors"
                >
                  {checkState === 'checking' ? (
                    <Loader2
                      className="w-4 h-4 animate-spin text-[var(--acc)]"
                      aria-hidden="true"
                    />
                  ) : checkState === 'invalid' ? (
                    <X
                      className="w-4 h-4 text-rose-600"
                      aria-hidden="true"
                    />
                  ) : checkState === 'valid' ? (
                    <Check
                      className="w-4 h-4 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <Search className="w-4 h-4 opacity-80" aria-hidden="true" />
                  )}
                </button>
              </div>

              <button
                type="button"
                className="pbtn sm shrink-0"
                disabled={!customInput.trim()}
                onClick={() => {
                  const trimmed = customInput.trim();
                  if (!trimmed) return;
                  onSelectModel(
                    provider,
                    trimmed === meta.defaultModel ? null : trimmed
                  );
                  setCheckFeedback({
                    ok: true,
                    message: `Model kustom diterapkan: ${trimmed}`,
                  });
                }}
              >
                Pakai
              </button>
            </div>

            {checkFeedback && (
              <p
                className={`text-[11px] font-medium m-0 ${
                  checkFeedback.ok ? 'text-emerald-700' : 'text-rose-600'
                }`}
                aria-live="polite"
              >
                {checkFeedback.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] opacity-75 truncate font-mono">
              Aktif: {selectedModel}
            </span>
            <button type="button" className="pbtn sm on shrink-0" onClick={onClose}>
              Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

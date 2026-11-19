'use client';

import React from 'react';
import { KeyRound, Star, X } from 'lucide-react';
import {
  getSelectedModelForProvider,
  groupDetectedKeys,
  type AiProviderId,
  type ByokKeyEntry,
} from '@/lib/ai/ai-providers';
import type { PresenterPrefs } from '@/lib/deck-types';
import { ProviderIcon } from './ProviderBadge';
import { ProviderModelModal } from './ProviderModelModal';

interface ProviderModalProps {
  open: boolean;
  prefs: PresenterPrefs;
  byokKeys: ByokKeyEntry[];
  onOpenApiKeys: () => void;
  onChangePreferredProvider: (provider: AiProviderId | null) => void;
  onChangePreferredModel: (provider: AiProviderId, model: string | null) => void;
  onClose: () => void;
}

export function ProviderModal({
  open,
  prefs,
  byokKeys,
  onOpenApiKeys,
  onChangePreferredProvider,
  onChangePreferredModel,
  onClose,
}: ProviderModalProps) {
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

  const handleClose = () => {
    setModelModalProvider(null);
    onClose();
  };

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Provider AI"
          className="modal-card max-w-[460px]"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-xl font-bold m-0">Provider AI</h2>
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
                onClick={handleClose}
                aria-label="Tutup Provider AI"
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
                onClick={handleClose}
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

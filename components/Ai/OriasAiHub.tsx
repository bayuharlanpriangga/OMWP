'use client';

import React from 'react';
import { uid } from '@/lib/page/page-presentation';
import type { ChatMessage, PresenterPrefs, ThemeId } from '@/lib/deck-types';
import type { ByokKeyEntry } from '@/lib/ai/ai-providers';
import { ApiKeysModal } from './ApiKeysModal';
import { OriasAi } from './OriasAi';
import { ProviderModal } from './ProviderModal';

interface OriasAiHubProps {
  open: boolean;
  miniOpen: boolean;
  busy: boolean;
  activeTerm: string | null;
  messages: ChatMessage[];
  theme: ThemeId;
  prefs: PresenterPrefs;
  byokKeys: ByokKeyEntry[];
  prefsModalOpen: boolean;
  apiKeysModalOpen: boolean;
  onToggleOpen: () => void;
  onExpandFromMini: () => void;
  onCloseMini: () => void;
  onClose: () => void;
  onClear: () => void;
  onSendQuestion: (q: string, term?: string) => void;
  onOpenPrefs: () => void;
  onClosePrefs: () => void;
  onOpenApiKeys: () => void;
  onCloseApiKeys: () => void;
  onSavePrefs: (updater: (prev: PresenterPrefs) => PresenterPrefs) => void;
  onChangeByokKeys: React.Dispatch<React.SetStateAction<ByokKeyEntry[]>>;
}

export function OriasAiHub({
  open,
  miniOpen,
  busy,
  activeTerm,
  messages,
  theme,
  prefs,
  byokKeys,
  prefsModalOpen,
  apiKeysModalOpen,
  onToggleOpen,
  onExpandFromMini,
  onCloseMini,
  onClose,
  onClear,
  onSendQuestion,
  onOpenPrefs,
  onClosePrefs,
  onOpenApiKeys,
  onCloseApiKeys,
  onSavePrefs,
  onChangeByokKeys,
}: OriasAiHubProps) {
  return (
    <>
      <OriasAi
        open={open}
        miniOpen={miniOpen}
        busy={busy}
        activeTerm={activeTerm}
        messages={messages}
        theme={theme}
        onToggleOpen={onToggleOpen}
        onExpandFromMini={onExpandFromMini}
        onCloseMini={onCloseMini}
        onClose={onClose}
        onClear={onClear}
        onOpenPrefs={onOpenPrefs}
        onSendQuestion={onSendQuestion}
      />

      <ProviderModal
        open={prefsModalOpen}
        prefs={prefs}
        byokKeys={byokKeys}
        onOpenApiKeys={() => {
          if (byokKeys.length === 0) {
            onChangeByokKeys([{ id: uid(), key: '', status: 'idle' }]);
          }
          onOpenApiKeys();
        }}
        onChangePreferredProvider={(provider) =>
          onSavePrefs((prev) => ({ ...prev, preferredProvider: provider }))
        }
        onChangePreferredModel={(provider, model) =>
          onSavePrefs((prev) => {
            const nextModels = { ...(prev.preferredModels || {}) };
            if (model && model.trim()) {
              nextModels[provider] = model.trim();
            } else {
              delete nextModels[provider];
            }
            return { ...prev, preferredModels: nextModels };
          })
        }
        onClose={onClosePrefs}
      />

      <ApiKeysModal
        open={apiKeysModalOpen}
        entries={byokKeys}
        includeInExport={Boolean(prefs.includeKeysInExport)}
        onToggleIncludeInExport={(next) =>
          onSavePrefs((prev) => ({ ...prev, includeKeysInExport: next }))
        }
        onChangeEntries={onChangeByokKeys}
        onClose={onCloseApiKeys}
      />
    </>
  );
}

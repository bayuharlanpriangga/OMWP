'use client';

import React from 'react';
import {
  createDefaultDeck,
  getDeckDisplayTitle,
  loadAndNormalizeDeck,
} from '@/lib/logic/logic-presentation-app';
import type { Deck, PresenterPrefs } from '@/lib/deck-types';
import type { ByokKeyEntry } from '@/lib/ai/ai-providers';

const DECK_STORAGE_KEY = 'opres.deck';
const DUMMY_CLEARED_KEY = 'opres.dummyCleared';
const PREFS_STORAGE_KEY = 'opres.prefs';
const BYOK_STORAGE_KEY = 'opres.byokKeys';

const DEFAULT_PREFS: PresenterPrefs = {
  preferredProvider: null,
  includeKeysInExport: false,
};

export function triggerFileDownload(
  filename: string,
  content: string,
  mime: string
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useDeckStorage(showToast: (msg: string) => void) {
  const [deck, setDeck] = React.useState<Deck>(() => createDefaultDeck());
  const [hydrated, setHydrated] = React.useState(false);
  const [prefs, setPrefs] = React.useState<PresenterPrefs>(DEFAULT_PREFS);
  const [byokKeys, setByokKeys] = React.useState<ByokKeyEntry[]>([]);
  const storageWarnedRef = React.useRef<number>(0);

  React.useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const dummyCleared = window.localStorage.getItem(DUMMY_CLEARED_KEY);
        const rawDeck = window.localStorage.getItem(DECK_STORAGE_KEY);
        if (rawDeck) {
          const parsed = loadAndNormalizeDeck(JSON.parse(rawDeck));
          const isLegacyDummy =
            !dummyCleared &&
            parsed &&
            parsed.title === 'Konsep Biaya dalam Akuntansi Manajemen' &&
            parsed.slides.some((s) => s.id.startsWith('default-slide-'));
          if (isLegacyDummy) {
            window.localStorage.removeItem(DECK_STORAGE_KEY);
          } else if (parsed) {
            setDeck(parsed);
          }
        }
        if (!dummyCleared) {
          window.localStorage.setItem(DUMMY_CLEARED_KEY, '1');
        }
        const rawPrefs = window.localStorage.getItem(PREFS_STORAGE_KEY);
        if (rawPrefs) {
          const parsedPrefs = JSON.parse(rawPrefs) as Partial<PresenterPrefs>;
          const cleanModels: NonNullable<PresenterPrefs['preferredModels']> = {};
          if (
            parsedPrefs.preferredModels &&
            typeof parsedPrefs.preferredModels === 'object'
          ) {
            for (const [k, v] of Object.entries(parsedPrefs.preferredModels)) {
              if (typeof v === 'string' && v.trim()) {
                cleanModels[k as keyof typeof cleanModels] = v.trim();
              }
            }
          }
          setPrefs({
            preferredProvider: parsedPrefs.preferredProvider ?? null,
            preferredModels: cleanModels,
            includeKeysInExport: Boolean(parsedPrefs.includeKeysInExport),
          });
        }
        const rawByok = window.localStorage.getItem(BYOK_STORAGE_KEY);
        if (rawByok) {
          const parsedByok = JSON.parse(rawByok);
          if (Array.isArray(parsedByok)) {
            setByokKeys(
              parsedByok.filter(
                (item): item is ByokKeyEntry =>
                  item &&
                  typeof item.id === 'string' &&
                  typeof item.key === 'string'
              )
            );
          }
        }
      } catch {
        // Ignore invalid localStorage state
      } finally {
        if (active) setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      const toStore = byokKeys.map((entry) => ({
        ...entry,
        status: entry.status === 'checking' ? 'idle' : entry.status,
      }));
      window.localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Ignore storage errors
    }
  }, [byokKeys, hydrated]);

  React.useEffect(() => {
    document.documentElement.dataset.theme = deck.theme || 'default';
    document.title = getDeckDisplayTitle(deck) || 'Presentasi Interaktif';
    if (!hydrated) return;
    try {
      window.localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
    } catch {
      if (Date.now() - storageWarnedRef.current > 5000) {
        storageWarnedRef.current = Date.now();
        showToast(
          'Penyimpanan browser penuh. Simpan JSON atau Export HTML agar tidak hilang.'
        );
      }
    }
  }, [deck, hydrated, showToast]);

  const savePrefs = React.useCallback(
    (updater: (prev: PresenterPrefs) => PresenterPrefs) => {
      setPrefs((prev) => {
        const next = updater(prev);
        try {
          window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
    },
    []
  );

  return {
    deck,
    setDeck,
    prefs,
    savePrefs,
    byokKeys,
    setByokKeys,
  };
}

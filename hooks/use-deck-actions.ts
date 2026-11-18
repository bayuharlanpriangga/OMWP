'use client';

import React from 'react';
import {
  addBlockToSlide,
  buildStandaloneHtml,
  createDefaultDeck,
  deleteBlockInSlide,
  duplicateSlide,
  getDeckDisplayTitle,
  getSlideTitle,
  loadAndNormalizeDeck,
  slugifyTitle,
  uid,
  updateBlockInSlide,
} from '@/lib/logic/logic-presentation-app';
import { importDeckFromHtml } from '@/lib/html-import';
import { orderByokKeysForRequest, type ByokKeyEntry } from '@/lib/ai-providers';
import type { Block, Deck, PresenterPrefs, Slide } from '@/lib/deck-types';
import type { ConfirmDialogState } from '@/components/ConfirmDialog';
import { triggerFileDownload } from './use-deck-storage';

export function useDeckActions({
  deck,
  setDeck,
  safeSlideIndex,
  currentSlide,
  setSlideIndex,
  updateCurrentSlide,
  selectedBlockId,
  setSelectedBlockId,
  setOpenBlockIds,
  prefs,
  byokKeys,
  showToast,
  setConfirmState,
}: {
  deck: Deck;
  setDeck: React.Dispatch<React.SetStateAction<Deck>>;
  safeSlideIndex: number;
  currentSlide: Slide;
  setSlideIndex: React.Dispatch<React.SetStateAction<number>>;
  updateCurrentSlide: (updater: (s: Slide) => Slide) => void;
  selectedBlockId: string | null;
  setSelectedBlockId: React.Dispatch<React.SetStateAction<string | null>>;
  setOpenBlockIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  prefs: PresenterPrefs;
  byokKeys: ByokKeyEntry[];
  showToast: (msg: string) => void;
  setConfirmState: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>;
}) {
  const addSlide = React.useCallback(() => {
    const newSlide: Slide = {
      id: uid(),
      name: '',
      headerTitle: '',
      bg: '',
      vc: false,
      blocks: [],
    };
    setDeck((prev) => {
      const slides = [...prev.slides];
      slides.splice(safeSlideIndex + 1, 0, newSlide);
      return { ...prev, slides };
    });
    setSlideIndex(safeSlideIndex + 1);
    setSelectedBlockId(null);
  }, [safeSlideIndex, setDeck, setSelectedBlockId, setSlideIndex]);

  const duplicateCurrentSlide = React.useCallback(() => {
    const copy = duplicateSlide(currentSlide);
    setDeck((prev) => {
      const slides = [...prev.slides];
      slides.splice(safeSlideIndex + 1, 0, copy);
      return { ...prev, slides };
    });
    setSlideIndex(safeSlideIndex + 1);
  }, [currentSlide, safeSlideIndex, setDeck, setSlideIndex]);

  const deleteCurrentSlide = React.useCallback(() => {
    if (deck.slides.length < 2) {
      showToast('Minimal harus ada satu slide.');
      return;
    }
    setConfirmState({
      title: 'Hapus slide?',
      message: `Slide "${getSlideTitle(currentSlide)}" akan dihapus permanen.`,
      onConfirm: () => {
        setDeck((prev) => ({
          ...prev,
          slides: prev.slides.filter((_, i) => i !== safeSlideIndex),
        }));
        setSlideIndex((i) => Math.max(0, Math.min(i, deck.slides.length - 2)));
        setConfirmState(null);
      },
    });
  }, [
    currentSlide,
    deck.slides.length,
    safeSlideIndex,
    setConfirmState,
    setDeck,
    setSlideIndex,
    showToast,
  ]);

  const moveCurrentSlide = React.useCallback(
    (delta: -1 | 1) => {
      const target = safeSlideIndex + delta;
      if (target < 0 || target >= deck.slides.length) return;
      setDeck((prev) => {
        const slides = [...prev.slides];
        const [item] = slides.splice(safeSlideIndex, 1);
        slides.splice(target, 0, item);
        return { ...prev, slides };
      });
      setSlideIndex(target);
    },
    [deck.slides.length, safeSlideIndex, setDeck, setSlideIndex]
  );

  const updateBlock = React.useCallback(
    (blockId: string, updater: (b: Block) => Block) => {
      updateCurrentSlide((s) => updateBlockInSlide(s, blockId, updater));
    },
    [updateCurrentSlide]
  );

  const addBlock = React.useCallback(
    (block: Block, ownerId?: string) => {
      updateCurrentSlide((s) => addBlockToSlide(s, block, ownerId));
    },
    [updateCurrentSlide]
  );

  const deleteBlock = React.useCallback(
    (blockId: string, hasChildren: boolean) => {
      const runDelete = () => {
        updateCurrentSlide((s) => deleteBlockInSlide(s, blockId));
        if (selectedBlockId === blockId) setSelectedBlockId(null);
      };
      if (hasChildren) {
        setConfirmState({
          title: 'Hapus container?',
          message: 'Container beserta seluruh isi di dalamnya akan dihapus.',
          onConfirm: () => {
            runDelete();
            setConfirmState(null);
          },
        });
      } else {
        runDelete();
      }
    },
    [selectedBlockId, setConfirmState, setSelectedBlockId, updateCurrentSlide]
  );

  const exportHtml = React.useCallback(() => {
    const exportedKeys = prefs.includeKeysInExport
      ? orderByokKeysForRequest(
          byokKeys,
          prefs.preferredProvider,
          prefs.preferredModels
        )
      : undefined;
    triggerFileDownload(
      `${slugifyTitle(getDeckDisplayTitle(deck))}.html`,
      buildStandaloneHtml(deck, exportedKeys),
      'text/html'
    );
    showToast(
      exportedKeys && exportedKeys.length > 0
        ? 'File HTML final beserta API key berhasil diunduh.'
        : 'File HTML final berhasil diunduh.'
    );
  }, [byokKeys, deck, prefs, showToast]);

  const exportJson = React.useCallback(() => {
    triggerFileDownload(
      `${slugifyTitle(getDeckDisplayTitle(deck))}.json`,
      JSON.stringify(deck, null, 2),
      'application/json'
    );
    showToast('File JSON berhasil diunduh.');
  }, [deck, showToast]);

  const importJsonFile = React.useCallback(
    async (file: File) => {
      try {
        const parsed = loadAndNormalizeDeck(JSON.parse(await file.text()));
        if (!parsed) throw new Error('Invalid');
        setDeck(parsed);
        setSlideIndex(0);
        setSelectedBlockId(null);
        setOpenBlockIds(new Set());
        showToast('Presentasi JSON berhasil dimuat.');
      } catch {
        showToast('File JSON tidak valid.');
      }
    },
    [setDeck, setOpenBlockIds, setSelectedBlockId, setSlideIndex, showToast]
  );

  const importHtmlText = React.useCallback(
    (htmlText: string) => {
      const result = importDeckFromHtml(htmlText);
      if (!result) {
        showToast('HTML tidak berisi slide atau konten yang dapat diimpor.');
        return false;
      }
      setDeck(result.deck);
      setSlideIndex(0);
      setSelectedBlockId(null);
      setOpenBlockIds(new Set());
      showToast(
        `Presentasi HTML berhasil dimuat (${result.slideCount} slide, ${result.blockCount} blok).`
      );
      return true;
    },
    [setDeck, setOpenBlockIds, setSelectedBlockId, setSlideIndex, showToast]
  );

  const resetDeck = React.useCallback(() => {
    setConfirmState({
      title: 'Kosongkan presentasi?',
      message:
        'Seluruh isi dan slide presentasi saat ini akan dihapus menjadi kosongan.',
      onConfirm: () => {
        setDeck(createDefaultDeck());
        setSlideIndex(0);
        setSelectedBlockId(null);
        setOpenBlockIds(new Set());
        setConfirmState(null);
        showToast('Presentasi dikosongkan.');
      },
    });
  }, [
    setConfirmState,
    setDeck,
    setOpenBlockIds,
    setSelectedBlockId,
    setSlideIndex,
    showToast,
  ]);

  return {
    addSlide,
    duplicateCurrentSlide,
    deleteCurrentSlide,
    moveCurrentSlide,
    updateBlock,
    addBlock,
    deleteBlock,
    exportHtml,
    exportJson,
    importJsonFile,
    importHtmlText,
    resetDeck,
  };
}

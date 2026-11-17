'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import cyberpunkCityBg from '@/src/assets/images/cyberpunk_purple_city_1794952180578.jpg';
import {
  addBlockToSlide,
  buildSlideAiContext,
  buildStandaloneHtml,
  clamp,
  createDefaultDeck,
  deleteBlockInSlide,
  duplicateSlide,
  findBlockInSlide,
  getSlideTitle,
  loadAndNormalizeDeck,
  moveBlockInParent,
  slugifyTitle,
  stripMarkup,
  syncSlideModals,
  uid,
  updateBlockInSlide,
} from '@/lib/deck-logic';
import { importDeckFromHtml } from '@/lib/html-import';
import type {
  Block,
  ChatMessage,
  Deck,
  PresenterPrefs,
  Slide,
  TextAlign,
  TextSize,
  ThemeId,
  WorkspaceMode,
} from '@/lib/deck-types';
import {
  explainWithByokClient,
  orderByokKeysForRequest,
  type ByokKeyEntry,
} from '@/lib/ai-providers';
import { ApiKeysModal } from './ApiKeysModal';
import { AiAssistant } from './AiAssistant';
import { LayoutInspector } from './LayoutInspector';
import { GhostBackdrop } from './GhostBackdrop';
import { HalloweenBackdrop } from './HalloweenBackdrop';
import { MatrixRainBackdrop } from './MatrixRainBackdrop';
import { SpaceBackdrop } from './SpaceBackdrop';
import {
  ImageLightbox,
  PreferencesModal,
  ThemeModal,
} from './ModalsAndLightbox';
import { PopupModal } from './PopupModal';
import { SlideCanvas, type SlideCanvasHandle } from './SlideCanvas';
import { SlideEditor } from './SlideEditor';
import { TopBar } from './TopBar';

const DECK_STORAGE_KEY = 'opres.deck';
const DUMMY_CLEARED_KEY = 'opres.dummyCleared';
const PREFS_STORAGE_KEY = 'opres.prefs';
const BYOK_STORAGE_KEY = 'opres.byokKeys';

const DEFAULT_PREFS: PresenterPrefs = {
  preferredProvider: null,
  includeKeysInExport: false,
};

function triggerDownload(filename: string, content: string, mime: string) {
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

export function PresentationApp() {
  const [deck, setDeck] = React.useState<Deck>(() => createDefaultDeck());
  const [hydrated, setHydrated] = React.useState(false);
  const [prefs, setPrefs] = React.useState<PresenterPrefs>(DEFAULT_PREFS);
  const [mode, setMode] = React.useState<WorkspaceMode>('present');
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [slideDirection, setSlideDirection] = React.useState<
    'next' | 'prev' | null
  >(null);
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(
    null
  );
  const [openBlockIds, setOpenBlockIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [activeModalId, setActiveModalId] = React.useState<string | null>(null);
  const [themeModalOpen, setThemeModalOpen] = React.useState(false);
  const [prefsModalOpen, setPrefsModalOpen] = React.useState(false);
  const [apiKeysModalOpen, setApiKeysModalOpen] = React.useState(false);
  const [byokKeys, setByokKeys] = React.useState<ByokKeyEntry[]>([]);
  const [lightboxImage, setLightboxImage] = React.useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [confirmState, setConfirmState] = React.useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // AI Assistant state
  const [aiOpen, setAiOpen] = React.useState(false);
  const [miniAiOpen, setMiniAiOpen] = React.useState(false);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [activeTerm, setActiveTerm] = React.useState<string | null>(null);
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const aiCacheRef = React.useRef<Map<string, string>>(new Map());
  const toastTimerRef = React.useRef<number | null>(null);
  const storageWarnedRef = React.useRef<number>(0);
  const touchRef = React.useRef<{ x: number; y: number } | null>(null);
  const canvasActionRef = React.useRef<SlideCanvasHandle | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  // Load persisted deck and preferences after mount
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

  // Persist BYOK keys locally in browser
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

  // Persist deck to localStorage & sync document theme/title
  React.useEffect(() => {
    document.documentElement.dataset.theme = deck.theme || 'default';
    document.title = deck.title || 'Presentasi Interaktif';
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

  // Fullscreen listener
  React.useEffect(() => {
    const onFs = () => {
      const on = Boolean(document.fullscreenElement);
      setIsFullscreen(on);
      if (on) showToast('Tekan ESC untuk keluar dari layar penuh');
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [showToast]);

  // Theme click burst FX
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const target = (e.target as HTMLElement | null)?.closest(
        '.pbtn, .term, .ch, .pres-fab'
      ) as HTMLElement | null;
      if (!target || (target as HTMLButtonElement).disabled) return;

      let x = e.clientX;
      let y = e.clientY;
      if (!e.detail) {
        const rect = target.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }

      const theme = document.documentElement.dataset.theme || 'default';
      const fx = document.createElement('span');
      fx.className = `fx fx-${theme}`;
      fx.style.left = `${x}px`;
      fx.style.top = `${y}px`;

      if (theme === 'brutal') {
        const colors = ['var(--acc)', 'var(--acc2)', 'var(--acc3)'];
        let html = '<b></b>';
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
          const dist = 30 + Math.random() * 16;
          const dx = (Math.cos(angle) * dist).toFixed(1);
          const dy = (Math.sin(angle) * dist).toFixed(1);
          html += `<i style="--dx:${dx}px;--dy:${dy}px;--c:${colors[i % 3]}"></i>`;
        }
        fx.innerHTML = html;
      }
      document.body.appendChild(fx);
      window.setTimeout(() => fx.remove(), 650);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const safeSlideIndex = clamp(slideIndex, 0, Math.max(0, deck.slides.length - 1));
  const currentSlide = deck.slides[safeSlideIndex];

  const goSlide = React.useCallback(
    (delta: number) => {
      setSlideIndex((prev) => {
        const next = clamp(prev + delta, 0, deck.slides.length - 1);
        if (next === prev) return prev;
        setSlideDirection(next > prev ? 'next' : 'prev');
        setActiveModalId(null);
        setSelectedBlockId(null);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return next;
      });
    },
    [deck.slides.length]
  );

  const selectSlide = (idx: number) => {
    const next = clamp(idx, 0, deck.slides.length - 1);
    if (next !== safeSlideIndex) {
      setSlideDirection(next > safeSlideIndex ? 'next' : 'prev');
    }
    setSlideIndex(next);
    setActiveModalId(null);
    setSelectedBlockId(null);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard navigation in present mode
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
          return;
        }
        if (confirmState) {
          setConfirmState(null);
          return;
        }
        if (activeModalId) {
          setActiveModalId(null);
          return;
        }
        if (themeModalOpen) {
          setThemeModalOpen(false);
          return;
        }
        if (apiKeysModalOpen) {
          setApiKeysModalOpen(false);
          return;
        }
        if (prefsModalOpen) {
          setPrefsModalOpen(false);
          return;
        }
        if (aiOpen) {
          setAiOpen(false);
          return;
        }
        if (miniAiOpen) {
          setMiniAiOpen(false);
          return;
        }
      }

      if (mode !== 'present') return;
      if (
        activeModalId ||
        themeModalOpen ||
        apiKeysModalOpen ||
        prefsModalOpen ||
        lightboxImage ||
        confirmState
      ) {
        return;
      }
      const tag = (document.activeElement as HTMLElement | null)?.tagName || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (e.key === ' ' && tag === 'BUTTON') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goSlide(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goSlide(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    mode,
    goSlide,
    activeModalId,
    themeModalOpen,
    apiKeysModalOpen,
    prefsModalOpen,
    lightboxImage,
    aiOpen,
    miniAiOpen,
    confirmState,
  ]);

  // AI Query Handler
  const sendAiQuestion = React.useCallback(
    async (question: string, cacheTerm?: string) => {
      const slideContext = buildSlideAiContext(deck, currentSlide, cacheTerm);
      const cacheKey = `${currentSlide.id}|${slideContext.slideText.slice(0, 140)}|${cacheTerm || ''}`;
      const userMsg: ChatMessage = { id: uid(), role: 'user', text: question };

      if (cacheTerm && aiCacheRef.current.has(cacheKey)) {
        const cachedReply = aiCacheRef.current.get(cacheKey)!;
        setChatMessages((prev) => [
          ...prev,
          userMsg,
          { id: uid(), role: 'assistant', text: cachedReply, animate: true },
        ]);
        return;
      }

      const historySnapshot = [
        ...chatMessages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-8)
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.text,
          })),
        { role: 'user' as const, content: question },
      ];

      setChatMessages((prev) => [...prev, userMsg]);
      setAiBusy(true);

      const activeByokKeys = orderByokKeysForRequest(
        byokKeys,
        prefs.preferredProvider,
        prefs.preferredModels
      );

      try {
        const res = await fetch('/api/ai/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: historySnapshot,
            slideContext,
            byokKeys: activeByokKeys,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        let replyText = '';
        if (
          res.status === 404 ||
          res.status === 405 ||
          !contentType.includes('application/json')
        ) {
          if (activeByokKeys.length === 0) {
            throw new Error(
              'Pada mode statis (GitHub Pages), tambahkan API key di Pengaturan Orias AI (ikon kunci) untuk memakai Orias AI.'
            );
          }
          const sys = [
            `Kamu adalah Orias AI, asisten cerdas dalam presentasi "${slideContext.deckTitle}" (Slide ${slideContext.slideNumber || 1} dari ${slideContext.totalSlides || 1}).`,
            slideContext.deckOverview
              ? `Alur presentasi:\n${slideContext.deckOverview}`
              : '',
            slideContext.slideContentOutline
              ? `Materi lengkap slide aktif:\n${slideContext.slideContentOutline}`
              : slideContext.slideText,
            slideContext.surroundingContext
              ? `Konteks spesifik:\n${slideContext.surroundingContext}`
              : '',
            'Pahami topik yang sedang dibahas secara menyeluruh. Jika istilah singkat atau implisit, tafsirkan sesuai konteks di atas. Jawab dalam bahasa Indonesia yang jelas (~100-150 kata).',
          ]
            .filter(Boolean)
            .join('\n\n');
          replyText = await explainWithByokClient(
            activeByokKeys,
            sys,
            historySnapshot
          );
        } else {
          const data = (await res.json()) as { reply?: string; error?: string };
          if (!res.ok || !data.reply) {
            throw new Error(data.error || `HTTP ${res.status}`);
          }
          replyText = data.reply;
        }
        if (cacheTerm) {
          aiCacheRef.current.set(cacheKey, replyText);
        }
        setChatMessages((prev) => [
          ...prev,
          { id: uid(), role: 'assistant', text: replyText, animate: true },
        ]);
      } catch (err) {
        const errText =
          err instanceof Error ? err.message : 'Gagal menghubungi Orias AI.';
        setChatMessages((prev) => [
          ...prev,
          { id: uid(), role: 'error', text: errText },
        ]);
      } finally {
        setAiBusy(false);
      }
    },
    [
      deck,
      currentSlide,
      prefs.preferredProvider,
      prefs.preferredModels,
      byokKeys,
      chatMessages,
    ]
  );

  const askTerm = React.useCallback(
    (rawTerm: string) => {
      const clean = stripMarkup(rawTerm).trim();
      if (!clean) return;
      setActiveTerm(clean);
      if (aiBusy) return;

      if (!aiOpen) {
        setMiniAiOpen(true);
      }
      void sendAiQuestion(`Jelaskan istilah atau poin ini: "${clean}"`, clean);
    },
    [aiBusy, aiOpen, sendAiQuestion]
  );

  const savePrefs = React.useCallback((updater: (prev: PresenterPrefs) => PresenterPrefs) => {
    setPrefs((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const updateCurrentSlide = React.useCallback(
    (updater: (s: Slide) => Slide) => {
      setDeck((prev) => {
        const idx = clamp(slideIndex, 0, prev.slides.length - 1);
        const slides = prev.slides.map((s, i) => (i === idx ? updater(s) : s));
        return { ...prev, slides };
      });
    },
    [slideIndex]
  );

  const handleToggleBlockOpen = (blockId: string) => {
    setOpenBlockIds((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  const handleOpenModalTrigger = (title: string) => {
    const found = (currentSlide.modals || []).find((m) => m.title === title);
    if (found) setActiveModalId(found.id);
  };

  // Layout inspector actions
  const selectedInfo =
    mode === 'layout' && selectedBlockId
      ? findBlockInSlide(currentSlide, selectedBlockId)
      : null;

  const handleNudgeSelected = (dir: 'u' | 'd' | 'l' | 'r') => {
    if (!selectedInfo) return;
    const b = selectedInfo.block;
    if (b.y == null) return;
    const nextPos = canvasActionRef.current?.nudgeAndShowGuides(b, dir);
    updateCurrentSlide((s) =>
      updateBlockInSlide(s, b.id, (prev) => {
        if (nextPos) {
          return { ...prev, x: nextPos.x, y: nextPos.y };
        }
        const curY = prev.y ?? 0;
        const curX = prev.x ?? 0;
        if (dir === 'u') return { ...prev, y: Math.max(0, curY - 10) };
        if (dir === 'd') return { ...prev, y: curY + 10 };
        if (dir === 'l')
          return { ...prev, x: Number(Math.max(0, curX - 1).toFixed(2)) };
        return {
          ...prev,
          x: Number(
            Math.min(100 - (prev.w / 12) * 100, curX + 1).toFixed(2)
          ),
        };
      })
    );
  };

  const handleResizeSelected = (delta: number) => {
    if (!selectedInfo) return;
    const b = selectedInfo.block;
    const nextW = clamp(b.w + delta, 1, 12);
    updateCurrentSlide((s) =>
      updateBlockInSlide(s, b.id, (prev) => ({
        ...prev,
        w: clamp(prev.w + delta, 1, 12),
      }))
    );
    if (selectedInfo.parentKind === 'slide') {
      canvasActionRef.current?.showResizeGuides(b, nextW);
    }
  };

  const handleMoveOrderSelected = (delta: -1 | 1) => {
    if (!selectedInfo) return;
    updateCurrentSlide((s) => moveBlockInParent(s, selectedInfo.block.id, delta));
  };

  const handleSetSelectedTextProp = (
    patch: { size?: TextSize; b?: boolean; align?: TextAlign }
  ) => {
    if (!selectedInfo || selectedInfo.block.t !== 'text') return;
    updateCurrentSlide((s) =>
      updateBlockInSlide(s, selectedInfo.block.id, (prev) =>
        prev.t === 'text' ? { ...prev, ...patch } : prev
      )
    );
  };

  const activeModal =
    (currentSlide.modals || []).find((m) => m.id === activeModalId) || null;

  return (
    <div
      className="pres-shell"
      onTouchStart={(e) => {
        touchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }}
      onTouchEnd={(e) => {
        if (mode !== 'present' || !touchRef.current) return;
        const dx = e.changedTouches[0].clientX - touchRef.current.x;
        const dy = e.changedTouches[0].clientY - touchRef.current.y;
        touchRef.current = null;
        if (Math.abs(dx) > 70 && Math.abs(dy) < 50) {
          goSlide(dx < 0 ? 1 : -1);
        }
      }}
    >
      <div className="theme-backdrop" aria-hidden="true">
        {deck.theme === 'cyberpunk' && (
          <Image
            src={cyberpunkCityBg}
            alt=""
            fill
            priority
            sizes="100vw"
            referrerPolicy="no-referrer"
            className="tb-city-img object-cover object-bottom"
          />
        )}
        {deck.theme === 'hacker' && <MatrixRainBackdrop />}
        {deck.theme === 'astronomi' && <SpaceBackdrop />}
        {deck.theme === 'ghost' && <GhostBackdrop />}
        {deck.theme === 'halloween' && <HalloweenBackdrop />}
        <span className="tb-a" />
        <span className="tb-b" />
        <span className="tb-c" />
        <span className="tb-d" />
      </div>

      <TopBar
        title={deck.title}
        mode={mode}
        isFullscreen={isFullscreen}
        onModeChange={(nextMode) => {
          setActiveModalId(null);
          setSelectedBlockId(null);
          setMode(nextMode);
          scrollContainerRef.current?.scrollTo({ top: 0 });
        }}
        onToggleFullscreen={() => {
          if (document.fullscreenElement) {
            void document.exitFullscreen();
          } else if (document.documentElement.requestFullscreen) {
            void document.documentElement.requestFullscreen();
          }
        }}
        onOpenThemes={() => setThemeModalOpen(true)}
      />

      <div
        ref={scrollContainerRef}
        className="pres-scroll"
        data-testid="workspace-scroll"
      >
        <main className={`pres-main m-${mode}`}>
        {mode === 'layout' && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {deck.slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`pbtn sm min-w-[40px] ${
                  idx === safeSlideIndex ? 'on' : ''
                }`}
                onClick={() => selectSlide(idx)}
                title={getSlideTitle(s)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              className="pbtn sm"
              onClick={() => {
                const newSlide: Slide = {
                  id: uid(),
                  name: '',
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
              }}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Slide</span>
            </button>
          </div>
        )}

        {mode === 'edit' ? (
          <SlideEditor
            deck={deck}
            slideIndex={safeSlideIndex}
            onSelectSlide={selectSlide}
            onAddSlide={() => {
              const newSlide: Slide = {
                id: uid(),
                name: '',
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
            }}
            onDuplicateSlide={() => {
              const copy = duplicateSlide(currentSlide);
              setDeck((prev) => {
                const slides = [...prev.slides];
                slides.splice(safeSlideIndex + 1, 0, copy);
                return { ...prev, slides };
              });
              setSlideIndex(safeSlideIndex + 1);
            }}
            onDeleteSlide={() => {
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
            }}
            onMoveSlide={(delta) => {
              const target = safeSlideIndex + delta;
              if (target < 0 || target >= deck.slides.length) return;
              setDeck((prev) => {
                const slides = [...prev.slides];
                const [item] = slides.splice(safeSlideIndex, 1);
                slides.splice(target, 0, item);
                return { ...prev, slides };
              });
              setSlideIndex(target);
            }}
            onDeckTitleChange={(title) =>
              setDeck((prev) => ({ ...prev, title }))
            }
            onUpdateBlock={(blockId, updater) =>
              updateCurrentSlide((s) => updateBlockInSlide(s, blockId, updater))
            }
            onAddBlock={(block, ownerId) =>
              updateCurrentSlide((s) => addBlockToSlide(s, block, ownerId))
            }
            onDeleteBlock={(blockId, hasChildren) => {
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
            }}
            onExportHtml={() => {
              const exportedKeys = prefs.includeKeysInExport
                ? orderByokKeysForRequest(
                    byokKeys,
                    prefs.preferredProvider,
                    prefs.preferredModels
                  )
                : undefined;
              triggerDownload(
                `${slugifyTitle(deck.title)}.html`,
                buildStandaloneHtml(deck, exportedKeys),
                'text/html'
              );
              showToast(
                exportedKeys && exportedKeys.length > 0
                  ? 'File HTML final beserta API key berhasil diunduh.'
                  : 'File HTML final berhasil diunduh.'
              );
            }}
            onExportJson={() => {
              triggerDownload(
                `${slugifyTitle(deck.title)}.json`,
                JSON.stringify(deck, null, 2),
                'application/json'
              );
              showToast('File JSON berhasil diunduh.');
            }}
            onImportJson={async (file) => {
              try {
                const parsed = loadAndNormalizeDeck(
                  JSON.parse(await file.text())
                );
                if (!parsed) throw new Error('Invalid');
                setDeck(parsed);
                setSlideIndex(0);
                setSelectedBlockId(null);
                setOpenBlockIds(new Set());
                showToast('Presentasi JSON berhasil dimuat.');
              } catch {
                showToast('File JSON tidak valid.');
              }
            }}
            onImportHtml={(htmlText) => {
              const result = importDeckFromHtml(htmlText);
              if (!result) {
                showToast(
                  'HTML tidak berisi slide atau konten yang dapat diimpor.'
                );
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
            }}
            onResetDeck={() => {
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
            }}
            onToast={showToast}
          />
        ) : (
          <SlideCanvas
            slide={currentSlide}
            mode={mode}
            theme={deck.theme}
            slideDirection={slideDirection}
            selectedBlockId={selectedBlockId}
            openBlockIds={openBlockIds}
            actionRef={canvasActionRef}
            onToggleBlockOpen={handleToggleBlockOpen}
            onSelectBlock={setSelectedBlockId}
            onUpdateBlocksLayout={(blocks) =>
              updateCurrentSlide((s) =>
                syncSlideModals({ ...s, vc: false, blocks })
              )
            }
            onTermClick={(term) => askTerm(term)}
            onModalClick={handleOpenModalTrigger}
            onImageZoom={(src, alt) => setLightboxImage({ src, alt })}
          />
        )}
        </main>
      </div>

      {/* Bottom Dock: Layout Inspector (above nav when active) + Persistent Slide Footer */}
      <div className="pres-bottom">
        {mode === 'layout' && selectedInfo && (
          <LayoutInspector
            block={selectedInfo.block}
            isTopLevel={selectedInfo.parentKind === 'slide'}
            onDeselect={() => {
              canvasActionRef.current?.clearGuides();
              setSelectedBlockId(null);
            }}
            onNudge={handleNudgeSelected}
            onMoveOrder={handleMoveOrderSelected}
            onResizeWidth={handleResizeSelected}
            onSetSize={(size) => handleSetSelectedTextProp({ size })}
            onToggleBold={() =>
              handleSetSelectedTextProp({
                b: selectedInfo.block.t === 'text' ? !selectedInfo.block.b : false,
              })
            }
            onSetAlign={(align) => handleSetSelectedTextProp({ align })}
          />
        )}

        <nav className="pres-nav" aria-label="Navigasi slide">
          <button
            type="button"
            className="pbtn sm"
            disabled={safeSlideIndex <= 0}
            onClick={() => goSlide(-1)}
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>

          <div
            className="prog"
            role="progressbar"
            aria-valuenow={safeSlideIndex + 1}
            aria-valuemin={1}
            aria-valuemax={deck.slides.length}
          >
            <span
              className="prog-bar"
              style={{
                width: `${((safeSlideIndex + 1) / deck.slides.length) * 100}%`,
              }}
            />
          </div>

          <span className="cnt">
            {safeSlideIndex + 1}/{deck.slides.length}
          </span>

          <button
            type="button"
            className="pbtn sm"
            disabled={safeSlideIndex >= deck.slides.length - 1}
            onClick={() => goSlide(1)}
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      </div>

      {/* Floating AI Assistant */}
      <AiAssistant
        open={aiOpen}
        miniOpen={miniAiOpen}
        busy={aiBusy}
        activeTerm={activeTerm}
        messages={chatMessages}
        theme={deck.theme}
        onToggleOpen={() => {
          setMiniAiOpen(false);
          setAiOpen((prev) => !prev);
        }}
        onExpandFromMini={() => {
          setMiniAiOpen(false);
          setAiOpen(true);
        }}
        onCloseMini={() => setMiniAiOpen(false)}
        onClose={() => setAiOpen(false)}
        onClear={() => setChatMessages([])}
        onOpenPrefs={() => setPrefsModalOpen(true)}
        onSendQuestion={(q, term) => void sendAiQuestion(q, term)}
      />

      {/* Interactive [[[Modal]]] Popup */}
      <PopupModal
        modal={activeModal}
        onClose={() => setActiveModalId(null)}
        onTermClick={(term) => askTerm(term)}
        onImageZoom={(src, alt) => setLightboxImage({ src, alt })}
      />

      {/* Theme Modal */}
      <ThemeModal
        open={themeModalOpen}
        currentTheme={deck.theme}
        onSelectTheme={(theme: ThemeId) =>
          setDeck((prev) => ({ ...prev, theme }))
        }
        onClose={() => setThemeModalOpen(false)}
      />

      {/* Preferences Modal */}
      <PreferencesModal
        open={prefsModalOpen}
        prefs={prefs}
        byokKeys={byokKeys}
        onOpenApiKeys={() => {
          if (byokKeys.length === 0) {
            setByokKeys([{ id: uid(), key: '', status: 'idle' }]);
          }
          setApiKeysModalOpen(true);
        }}
        onChangePreferredProvider={(provider) =>
          savePrefs((prev) => ({ ...prev, preferredProvider: provider }))
        }
        onChangePreferredModel={(provider, model) =>
          savePrefs((prev) => {
            const nextModels = { ...(prev.preferredModels || {}) };
            if (model && model.trim()) {
              nextModels[provider] = model.trim();
            } else {
              delete nextModels[provider];
            }
            return { ...prev, preferredModels: nextModels };
          })
        }
        onClose={() => setPrefsModalOpen(false)}
      />

      {/* Multi-Provider BYOK API Keys Modal */}
      <ApiKeysModal
        open={apiKeysModalOpen}
        entries={byokKeys}
        includeInExport={Boolean(prefs.includeKeysInExport)}
        onToggleIncludeInExport={(next) =>
          savePrefs((prev) => ({ ...prev, includeKeysInExport: next }))
        }
        onChangeEntries={setByokKeys}
        onClose={() => setApiKeysModalOpen(false)}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      {/* In-app Confirm Dialog */}
      {confirmState && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmState(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={confirmState.title}
            className="modal-card max-w-[400px]"
          >
            <h2 className="text-lg font-bold m-0 mb-2">{confirmState.title}</h2>
            <p className="text-sm opacity-80 m-0 mb-5">{confirmState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="pbtn sm"
                onClick={() => setConfirmState(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="pbtn sm on"
                onClick={confirmState.onConfirm}
              >
                Ya, lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg border border-white/20"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

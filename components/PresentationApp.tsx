'use client';

import React from 'react';
import {
  clamp,
  getSlideHeaderTitle,
  syncSlideModals,
} from '@/lib/logic/logic-presentation-app';
import type { Slide, ThemeId, WorkspaceMode } from '@/lib/deck-types';
import { useDeckStorage } from '@/hooks/use-deck-storage';
import { useDeckActions } from '@/hooks/use-deck-actions';
import { useLayoutInspector } from '@/hooks/use-layout-inspector';
import { useOriasAi } from '@/hooks/use-orias-ai';
import { OriasAiHub } from './ai/OriasAiHub';
import { ThemeBackdrop } from './theme/ThemeBackdrop';
import { ThemeModal } from './theme/ThemeModal';
import { MarkupTextModal } from './page/pagecontent/MarkupTextModal';
import { PageContentEditor } from './page/pagecontent/PageContentEditor';
import { LayoutSlideStrip } from './page/pagelayout/LayoutSlideStrip';
import { PageLayoutEditor } from './page/pagelayout/PageLayoutEditor';
import { PageLayoutEditorPanel } from './page/pagelayout/PageLayoutEditorPanel';
import { PagePresent } from './page/pagepresent/PagePresent';
import { ConfirmDialog, type ConfirmDialogState } from './ConfirmDialog';
import { ImageLightbox } from './ImageLightbox';
import { SlideNav } from './SlideNav';
import { ToastBanner } from './ToastBanner';
import { TopBar } from './TopBar';

export function PresentationApp() {
  const [mode, setMode] = React.useState<WorkspaceMode>('present');
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [slideDirection, setSlideDirection] = React.useState<
    'next' | 'prev' | null
  >(null);
  const [openBlockIds, setOpenBlockIds] = React.useState<Set<string>>(
    () => new Set()
  );
  const [activeModalId, setActiveModalId] = React.useState<string | null>(null);
  const [themeModalOpen, setThemeModalOpen] = React.useState(false);
  const [lightboxImage, setLightboxImage] = React.useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [confirmState, setConfirmState] =
    React.useState<ConfirmDialogState | null>(null);

  const toastTimerRef = React.useRef<number | null>(null);
  const touchRef = React.useRef<{ x: number; y: number } | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  const { deck, setDeck, prefs, savePrefs, byokKeys, setByokKeys } =
    useDeckStorage(showToast);

  const safeSlideIndex = clamp(
    slideIndex,
    0,
    Math.max(0, deck.slides.length - 1)
  );
  const currentSlide = deck.slides[safeSlideIndex];

  const updateCurrentSlide = React.useCallback(
    (updater: (s: Slide) => Slide) => {
      setDeck((prev) => {
        const idx = clamp(slideIndex, 0, prev.slides.length - 1);
        const slides = prev.slides.map((s, i) => (i === idx ? updater(s) : s));
        return { ...prev, slides };
      });
    },
    [setDeck, slideIndex]
  );

  const layoutInspector = useLayoutInspector({
    mode,
    currentSlide,
    updateCurrentSlide,
  });
  const {
    selectedBlockId,
    setSelectedBlockId,
    canvasActionRef,
    selectedInfo,
    nudgeSelected,
    resizeSelected,
    moveOrderSelected,
    setSelectedTextProp,
    deselectAndClearGuides,
  } = layoutInspector;

  const deckActions = useDeckActions({
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
  });

  const ai = useOriasAi({ deck, currentSlide, prefs, byokKeys });
  const { closeTopOverlay, hasBlockingModal, askTerm, sendAiQuestion, clearMessages } = ai;

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
    [deck.slides.length, setSelectedBlockId]
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

  // Keyboard navigation & Escape priority
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
        if (closeTopOverlay()) return;
      }

      if (mode !== 'present') return;
      if (
        activeModalId ||
        themeModalOpen ||
        hasBlockingModal ||
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
    lightboxImage,
    confirmState,
    closeTopOverlay,
    hasBlockingModal,
  ]);

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
      <ThemeBackdrop theme={deck.theme} />

      <TopBar
        title={getSlideHeaderTitle(deck, currentSlide)}
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
            <LayoutSlideStrip
              slides={deck.slides}
              slideIndex={safeSlideIndex}
              onSelectSlide={selectSlide}
              onAddSlide={deckActions.addSlide}
            />
          )}

          {mode === 'edit' ? (
            <PageContentEditor
              deck={deck}
              slideIndex={safeSlideIndex}
              onSelectSlide={selectSlide}
              onAddSlide={deckActions.addSlide}
              onDuplicateSlide={deckActions.duplicateCurrentSlide}
              onDeleteSlide={deckActions.deleteCurrentSlide}
              onMoveSlide={deckActions.moveCurrentSlide}
              onSlideHeaderTitleChange={(headerTitle) =>
                updateCurrentSlide((s) => ({ ...s, headerTitle }))
              }
              onUpdateBlock={deckActions.updateBlock}
              onAddBlock={deckActions.addBlock}
              onDeleteBlock={deckActions.deleteBlock}
              onExportHtml={deckActions.exportHtml}
              onExportJson={deckActions.exportJson}
              onImportJson={deckActions.importJsonFile}
              onImportHtml={deckActions.importHtmlText}
              onResetDeck={deckActions.resetDeck}
              onToast={showToast}
            />
          ) : mode === 'layout' ? (
            <PageLayoutEditor
              slide={currentSlide}
              theme={deck.theme}
              selectedBlockId={selectedBlockId}
              actionRef={canvasActionRef}
              onSelectBlock={setSelectedBlockId}
              onUpdateBlocksLayout={(blocks) =>
                updateCurrentSlide((s) =>
                  syncSlideModals({ ...s, vc: false, blocks })
                )
              }
            />
          ) : (
            <PagePresent
              slide={currentSlide}
              theme={deck.theme}
              slideDirection={slideDirection}
              openBlockIds={openBlockIds}
              onToggleBlockOpen={handleToggleBlockOpen}
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

      <div className="pres-bottom">
        {mode === 'layout' && selectedInfo && (
          <PageLayoutEditorPanel
            block={selectedInfo.block}
            isTopLevel={selectedInfo.parentKind === 'slide'}
            onDeselect={deselectAndClearGuides}
            onNudge={nudgeSelected}
            onMoveOrder={moveOrderSelected}
            onResizeWidth={resizeSelected}
            onSetSize={(size) => setSelectedTextProp({ size })}
            onToggleBold={() =>
              setSelectedTextProp({
                b:
                  selectedInfo.block.t === 'text'
                    ? !selectedInfo.block.b
                    : false,
              })
            }
            onSetAlign={(align) => setSelectedTextProp({ align })}
          />
        )}

        <SlideNav
          slideIndex={safeSlideIndex}
          totalSlides={deck.slides.length}
          onStep={goSlide}
        />
      </div>

      <OriasAiHub
        open={ai.aiOpen}
        miniOpen={ai.miniAiOpen}
        busy={ai.aiBusy}
        activeTerm={ai.activeTerm}
        messages={ai.chatMessages}
        theme={deck.theme}
        prefs={prefs}
        byokKeys={byokKeys}
        prefsModalOpen={ai.prefsModalOpen}
        apiKeysModalOpen={ai.apiKeysModalOpen}
        onToggleOpen={() => {
          ai.setMiniAiOpen(false);
          ai.setAiOpen((prev) => !prev);
        }}
        onExpandFromMini={() => {
          ai.setMiniAiOpen(false);
          ai.setAiOpen(true);
        }}
        onCloseMini={() => ai.setMiniAiOpen(false)}
        onClose={() => ai.setAiOpen(false)}
        onClear={clearMessages}
        onSendQuestion={(q, term) => void sendAiQuestion(q, term)}
        onOpenPrefs={() => ai.setPrefsModalOpen(true)}
        onClosePrefs={() => ai.setPrefsModalOpen(false)}
        onOpenApiKeys={() => ai.setApiKeysModalOpen(true)}
        onCloseApiKeys={() => ai.setApiKeysModalOpen(false)}
        onSavePrefs={savePrefs}
        onChangeByokKeys={setByokKeys}
      />

      <MarkupTextModal
        modal={activeModal}
        onClose={() => setActiveModalId(null)}
        onTermClick={(term) => askTerm(term)}
        onImageZoom={(src, alt) => setLightboxImage({ src, alt })}
      />

      <ThemeModal
        open={themeModalOpen}
        currentTheme={deck.theme}
        onSelectTheme={(theme: ThemeId) =>
          setDeck((prev) => ({ ...prev, theme }))
        }
        onClose={() => setThemeModalOpen(false)}
      />

      <ImageLightbox
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      <ConfirmDialog
        state={confirmState}
        onCancel={() => setConfirmState(null)}
      />

      <ToastBanner message={toastMessage} />
    </div>
  );
}

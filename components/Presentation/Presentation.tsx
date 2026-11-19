'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import {
  clamp,
  getSlideHeaderTitle,
  syncSlideModals,
} from '@/lib/page/page-presentation';
import {
  computeReflowPositions,
  stripMarkup,
} from '@/lib/page/page-present/page-present';
import type { Block, Slide, ThemeId, WorkspaceMode } from '@/lib/deck-types';
import { useDeckStorage } from '@/hooks/use-deck-storage';
import { useDeckActions } from '@/hooks/use-deck-actions';
import { useLayoutInspector } from '@/hooks/use-layout-inspector';
import { useOriasAi } from '@/hooks/use-orias-ai';
import { OriasAiHub } from '../Ai/OriasAiHub';
import { ThemeBackdrop } from '../Theme/ThemeBackdrop';
import { ThemeModal } from '../Theme/ThemeModal';
import { MarkupText } from '../Page/PageEdit/PageEditMarkupText';
import { MarkupTextModal } from '../Page/PageEdit/PageEditMarkupTextModal';
import { PageContentEditor } from '../Page/PageEdit/PageEdit';
import { TableView } from '../Page/PageEdit/PageEditTable/PageEditTableView';
import { LayoutSlideStrip } from '../Page/PageLayout/PageLayoutSlideStrip';
import { PageLayoutEditor } from '../Page/PageLayout/PageLayout';
import { PageLayoutEditorPanel } from '../Page/PageLayout/PageLayoutPanel';
import {
  SystemsConfirmDialog,
  type SystemsConfirmDialogState,
} from '../Systems/SystemsConfirmDialog';
import { PresentationChart } from './PresentationChart';
import { ImageLightbox } from './PresentationImageView';
import { SlideNav } from './PresentationSlideNavigation';
import { SystemsToastBanner } from '../Systems/SystemsToastBanner';
import { TopBar } from './PresentationTopBar';

interface SlideBlockContentProps {
  block: Block;
  ddNumber: number;
  live: boolean;
  theme: ThemeId;
  openBlockIds?: Set<string>;
  selectedBlockId?: string | null;
  onToggleBlockOpen?: (blockId: string, block: Block) => void;
  onSelectBoxChild?: (childId: string, event: React.MouseEvent) => void;
  onTermClick: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onModalClick: (title: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onImageZoom: (src: string, alt: string) => void;
}

export function SlideBlockContent({
  block: b,
  ddNumber,
  live,
  theme,
  openBlockIds,
  selectedBlockId,
  onToggleBlockOpen,
  onSelectBoxChild,
  onTermClick,
  onModalClick,
  onImageZoom,
}: SlideBlockContentProps): React.ReactNode {
  const lay = !live;
  const isOpen = Boolean(live && openBlockIds?.has(b.id));

  if (b.t === 'text') {
    return (
      <div
        className={`tx s-${b.size || 'm'} a-${b.align || 'l'} ${b.b ? 'bd' : ''} ${b.i ? 'it' : ''} ${b.u ? 'ul' : ''}`}
      >
        {b.text ? (
          <MarkupText
            text={b.text}
            live={live}
            onTermClick={onTermClick}
            onModalClick={onModalClick}
          />
        ) : lay ? (
          <span className="text-sm italic opacity-55">(teks kosong)</span>
        ) : null}
      </div>
    );
  }

  if (b.t === 'title') {
    return (
      <div className={`bt bt-sub ${b.align ? `a-${b.align}` : ''}`}>
        {b.text ? (
          <MarkupText
            text={b.text}
            live={live}
            onTermClick={onTermClick}
            onModalClick={onModalClick}
          />
        ) : lay ? (
          <span className="text-sm italic opacity-55">(judul kosong)</span>
        ) : null}
      </div>
    );
  }

  if (b.t === 'img') {
    if (!b.src) {
      return <div className="text-sm italic opacity-55">(gambar kosong)</div>;
    }
    if (live) {
      return (
        <button
          type="button"
          className="im-frame im-frame-btn"
          onClick={() => onImageZoom(b.src, b.alt)}
          aria-label={`Perbesar gambar ${b.alt || 'presentasi'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.src}
            alt={b.alt || 'Gambar presentasi'}
            className="im block w-full h-auto"
            draggable={false}
            referrerPolicy="no-referrer"
          />
        </button>
      );
    }
    return (
      <div className="im-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={b.src}
          alt={b.alt || 'Gambar presentasi'}
          className="im block w-full h-auto"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (b.t === 'dd') {
    const badgeLabel = b.badge?.trim() ? b.badge : String(ddNumber);
    return (
      <div className={`card ${isOpen ? 'open' : ''}`}>
        {live ? (
          <button
            type="button"
            className="ch"
            aria-expanded={isOpen}
            onClick={() => onToggleBlockOpen?.(b.id, b)}
          >
            <span className="n">{badgeLabel}</span>
            <span className="flex-1 text-left">
              {stripMarkup(b.text) || 'Poin'}
            </span>
            <ChevronRight
              className={`w-4 h-4 ml-auto shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-90' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        ) : (
          <div className="ch">
            <span className="n">{badgeLabel}</span>
            <span className="flex-1 text-left">
              {stripMarkup(b.text) || 'Poin'}
            </span>
            <ChevronRight className="w-4 h-4 ml-auto shrink-0" aria-hidden="true" />
          </div>
        )}

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: theme === 'auditor' ? 0.25 : 0.16 }}
            className={`cb ${b.align ? `a-${b.align}` : ''}`}
          >
            {b.detail ? (
              <MarkupText
                text={b.detail}
                live={live}
                onTermClick={onTermClick}
                onModalClick={onModalClick}
              />
            ) : (
              <em>Belum ada penjelasan.</em>
            )}
          </motion.div>
        )}
      </div>
    );
  }

  if (b.t === 'box') {
    let childDd = 0;
    return (
      <div className="card box">
        {b.title && (
          <div className="bt">
            <MarkupText
              text={b.title}
              live={live}
              onTermClick={onTermClick}
              onModalClick={onModalClick}
            />
          </div>
        )}
        <div className="cv">
          {b.children.map((child) => {
            if (live && child.t === 'title' && !child.text.trim()) {
              return null;
            }
            const num = child.t === 'dd' ? ++childDd : 0;
            const isSel = lay && selectedBlockId === child.id;
            return (
              <div
                key={child.id}
                data-id={child.id}
                style={{ gridColumn: `span ${clamp(Math.round(child.w), 1, 12)}` }}
                className={`blk ${isSel ? 'sel' : ''}`}
                onClick={(e) => {
                  if (!lay || !onSelectBoxChild) return;
                  onSelectBoxChild(child.id, e);
                }}
              >
                <SlideBlockContent
                  block={child}
                  ddNumber={num}
                  live={live}
                  theme={theme}
                  openBlockIds={openBlockIds}
                  selectedBlockId={selectedBlockId}
                  onToggleBlockOpen={onToggleBlockOpen}
                  onSelectBoxChild={onSelectBoxChild}
                  onTermClick={onTermClick}
                  onModalClick={onModalClick}
                  onImageZoom={onImageZoom}
                />
                {isSel && <span className="wb">{child.w}/12</span>}
              </div>
            );
          })}
        </div>
        {lay && b.children.length === 0 && (
          <div className="text-sm italic opacity-55">(container kosong)</div>
        )}
      </div>
    );
  }

  if (b.t === 'table') {
    return (
      <TableView
        block={b}
        live={live}
        onTermClick={onTermClick}
        onModalClick={onModalClick}
      />
    );
  }

  if (b.t === 'chart') {
    return (
      <PresentationChart
        block={b}
        live={live}
        interactive={live}
        onTermClick={onTermClick}
        onModalClick={onModalClick}
      />
    );
  }

  const label = b.label || '★ Kesimpulan';
  return (
    <div>
      {live ? (
        <button
          type="button"
          className="pbtn"
          aria-expanded={isOpen}
          onClick={() => onToggleBlockOpen?.(b.id, b)}
        >
          {isOpen ? 'Tutup kesimpulan' : label}
        </button>
      ) : (
        <span className="pbtn pointer-events-none">{label}</span>
      )}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className={`concl ${b.align ? `a-${b.align}` : ''}`}
        >
          <MarkupText
            text={b.text}
            live={live}
            onTermClick={onTermClick}
            onModalClick={onModalClick}
          />
        </motion.div>
      )}
    </div>
  );
}

interface PagePresentProps {
  slide: Slide;
  theme: ThemeId;
  slideDirection: 'next' | 'prev' | null;
  openBlockIds: Set<string>;
  onToggleBlockOpen: (blockId: string, block: Block) => void;
  onUpdateBlocksLayout: (blocks: Block[]) => void;
  onTermClick: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onModalClick: (title: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onImageZoom: (src: string, alt: string) => void;
}

export function PagePresent({
  slide,
  theme,
  slideDirection,
  openBlockIds,
  onToggleBlockOpen,
  onUpdateBlocksLayout,
  onTermClick,
  onModalClick,
  onImageZoom,
}: PagePresentProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  const isFree =
    slide.blocks.length > 0 && slide.blocks.every((b) => b.y != null);

  const applyPresentGeometry = React.useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    if (slide.blocks.length === 0) {
      root.style.height = '';
      return;
    }

    const isMobile = window.innerWidth < 640;
    const children = Array.from(root.children).filter((el) =>
      el.classList.contains('blk')
    ) as HTMLElement[];

    if (!isFree || isMobile) {
      root.style.height = '';
      children.forEach((el) => {
        if (isMobile) el.style.top = '';
      });
      return;
    }

    const reflowInputs = slide.blocks
      .map((b) => {
        const el = children.find((c) => c.dataset.id === b.id);
        if (!el || b.y == null) return null;
        let extra = 0;
        el.querySelectorAll('.card.open > .cb, .concl').forEach((node) => {
          extra += (node as HTMLElement).offsetHeight + 14;
        });
        return {
          id: b.id,
          x: b.x ?? 0,
          y: b.y,
          w: b.w,
          collapsedHeight: el.offsetHeight - extra,
          extraExpandedHeight: extra,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const nextTops = computeReflowPositions(reflowInputs);
    let bottom = 0;
    for (const b of slide.blocks) {
      const el = children.find((c) => c.dataset.id === b.id);
      if (!el) continue;
      const top = nextTops[b.id] ?? b.y ?? 0;
      el.style.top = `${top}px`;
      bottom = Math.max(bottom, top + el.offsetHeight);
    }
    root.style.height = `${bottom + 28}px`;
  }, [slide.blocks, isFree]);

  const onUpdateLayoutRef = React.useRef(onUpdateBlocksLayout);
  React.useEffect(() => {
    onUpdateLayoutRef.current = onUpdateBlocksLayout;
  }, [onUpdateBlocksLayout]);

  // Measure initial grid layout -> convert to free-canvas (x%, y px, w/12) once per unpositioned slide
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (slide.blocks.length === 0) {
      root.style.height = '';
      return;
    }

    const isMobile = window.innerWidth < 640;
    const needsPlacement = slide.blocks.some((b) => b.y == null);
    if (needsPlacement && !isMobile && root.offsetWidth > 0) {
      const rw = root.offsetWidth || 1;
      const offsetTop = slide.vc ? root.offsetTop : 0;
      let maxBottom = 0;
      const children = Array.from(root.children).filter((el) =>
        el.classList.contains('blk')
      ) as HTMLElement[];

      let didChange = false;
      const updated = slide.blocks.map((b) => {
        const el = children.find((c) => c.dataset.id === b.id);
        if (!el) return b;
        if (b.y != null) {
          maxBottom = Math.max(maxBottom, b.y + el.offsetHeight);
          return b;
        }
        didChange = true;
        if (slide.blocks.every((x) => x.y == null)) {
          const xPct = Number(((el.offsetLeft / rw) * 100).toFixed(2));
          const yPx = Math.round(el.offsetTop + offsetTop);
          const wCols = clamp(
            Math.round(((el.offsetWidth / rw) * 24) / 2),
            1,
            12
          );
          maxBottom = Math.max(maxBottom, yPx + el.offsetHeight);
          return { ...b, x: xPct, y: yPx, w: wCols };
        }
        const yPx = Math.round(maxBottom + 16);
        maxBottom = yPx + el.offsetHeight;
        return { ...b, x: 0, y: yPx };
      });

      if (didChange) {
        onUpdateLayoutRef.current(updated);
      }
      return;
    }

    applyPresentGeometry();
  }, [slide, openBlockIds, applyPresentGeometry]);

  React.useEffect(() => {
    const onResize = () => applyPresentGeometry();
    window.addEventListener('resize', onResize);
    if (document.fonts && document.fonts.ready) {
      void document.fonts.ready.then(applyPresentGeometry);
    }
    return () => window.removeEventListener('resize', onResize);
  }, [applyPresentGeometry]);

  let ddCounter = 0;
  const enterX =
    slideDirection === 'next' ? 32 : slideDirection === 'prev' ? -32 : 0;

  return (
    <motion.section
      key={slide.id}
      initial={slideDirection ? { opacity: 0, x: enterX } : { opacity: 0.96 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: theme === 'auditor' ? 0.35 : theme === 'default' ? 0.22 : 0.25,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`slide ${slide.vc && !isFree ? 'vc' : ''}`}
    >
      <div
        ref={rootRef}
        data-testid="slide-canvas"
        className={`cv root ${
          isFree ? 'free max-sm:!flex max-sm:!flex-col max-sm:!gap-3.5 max-sm:!h-auto' : ''
        }`}
      >
        {slide.blocks.length === 0 && (
          <div className="col-span-12 flex flex-col items-center justify-center min-h-[260px] text-center px-4 opacity-60">
            <p className="text-base font-medium m-0">Slide masih kosong.</p>
            <p className="text-sm mt-1 m-0">
              Klik tombol Isi di kanan atas untuk mulai menambahkan materi.
            </p>
          </div>
        )}
        {slide.blocks.map((b) => {
          const ddNumber = b.t === 'dd' ? ++ddCounter : 0;
          const freeStyle: React.CSSProperties =
            isFree && b.y != null
              ? {
                  left: `${clamp(b.x ?? 0, 0, 100 - (b.w / 12) * 100)}%`,
                  top: `${b.y}px`,
                  width: `${(b.w / 12) * 100}%`,
                }
              : {
                  gridColumn: `span ${clamp(Math.round(b.w), 1, 12)}`,
                };

          return (
            <div
              key={b.id}
              data-id={b.id}
              style={freeStyle}
              className="blk max-sm:!static max-sm:!w-full"
            >
              <SlideBlockContent
                block={b}
                ddNumber={ddNumber}
                live={true}
                theme={theme}
                openBlockIds={openBlockIds}
                onToggleBlockOpen={onToggleBlockOpen}
                onTermClick={onTermClick}
                onModalClick={onModalClick}
                onImageZoom={onImageZoom}
              />
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

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
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [confirmState, setConfirmState] =
    React.useState<SystemsConfirmDialogState | null>(null);

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
        onModeChange={(nextMode) => {
          setActiveModalId(null);
          setSelectedBlockId(null);
          setMode(nextMode);
          scrollContainerRef.current?.scrollTo({ top: 0 });
        }}
        onToast={showToast}
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
            onToggleItalic={() =>
              setSelectedTextProp({
                i:
                  selectedInfo.block.t === 'text'
                    ? !selectedInfo.block.i
                    : false,
              })
            }
            onToggleUnderline={() =>
              setSelectedTextProp({
                u:
                  selectedInfo.block.t === 'text'
                    ? !selectedInfo.block.u
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

      <SystemsConfirmDialog
        state={confirmState}
        onCancel={() => setConfirmState(null)}
      />

      <SystemsToastBanner message={toastMessage} />
    </div>
  );
}

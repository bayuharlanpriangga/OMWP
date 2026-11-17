'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Move, Scaling } from 'lucide-react';
import {
  computeAlignmentGuides,
  type AlignmentGuideLine,
  type RectPx,
} from '@/lib/alignment-guides';
import {
  clamp,
  computeReflowPositions,
  stripMarkup,
} from '@/lib/deck-logic';
import type {
  Block,
  Slide,
  ThemeId,
  WorkspaceMode,
} from '@/lib/deck-types';
import { MarkupText } from './MarkupText';

export interface SlideCanvasHandle {
  nudgeAndShowGuides: (
    block: Block,
    dir: 'u' | 'd' | 'l' | 'r'
  ) => { x: number; y: number } | null;
  showResizeGuides: (block: Block, nextW: number) => void;
  clearGuides: () => void;
}

interface SlideCanvasProps {
  slide: Slide;
  mode: 'present' | 'layout';
  theme: ThemeId;
  slideDirection: 'next' | 'prev' | null;
  selectedBlockId: string | null;
  openBlockIds: Set<string>;
  actionRef?: React.RefObject<SlideCanvasHandle | null>;
  onToggleBlockOpen: (blockId: string, block: Block) => void;
  onSelectBlock: (blockId: string | null) => void;
  onUpdateBlocksLayout: (blocks: Block[]) => void;
  onTermClick: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onModalClick: (title: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onImageZoom: (src: string, alt: string) => void;
}

export function SlideCanvas({
  slide,
  mode,
  theme,
  slideDirection,
  selectedBlockId,
  openBlockIds,
  actionRef,
  onToggleBlockOpen,
  onSelectBlock,
  onUpdateBlocksLayout,
  onTermClick,
  onModalClick,
  onImageZoom,
}: SlideCanvasProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [guideState, setGuideState] = React.useState<{
    slideId: string;
    guides: AlignmentGuideLine[];
  }>({ slideId: slide.id, guides: [] });
  const guideTimerRef = React.useRef<number | null>(null);
  const dragStateRef = React.useRef<{
    kind: 'move' | 'resize';
    blockId: string;
    startX: number;
    startY: number;
    startScrollY: number;
    origX: number;
    origY: number;
    origW: number;
    rootWidth: number;
    colWidth: number;
    activeWidth: number;
    activeHeight: number;
    otherRects: RectPx[];
    latestBlocks: Block[];
  } | null>(null);
  const dragEndedAtRef = React.useRef<number>(0);

  const alignmentGuides =
    mode === 'layout' && guideState.slideId === slide.id
      ? guideState.guides
      : [];

  const clearGuideTimer = React.useCallback(() => {
    if (guideTimerRef.current !== null) {
      window.clearTimeout(guideTimerRef.current);
      guideTimerRef.current = null;
    }
  }, []);

  const setGuides = React.useCallback(
    (guides: AlignmentGuideLine[], autoHideMs?: number) => {
      clearGuideTimer();
      setGuideState({ slideId: slide.id, guides });
      if (autoHideMs && guides.length > 0) {
        guideTimerRef.current = window.setTimeout(() => {
          setGuideState((prev) =>
            prev.slideId === slide.id ? { slideId: slide.id, guides: [] } : prev
          );
          guideTimerRef.current = null;
        }, autoHideMs);
      }
    },
    [clearGuideTimer, slide.id]
  );

  React.useEffect(() => {
    return () => clearGuideTimer();
  }, [clearGuideTimer]);

  const measureCanvasBlocks = React.useCallback((targetId: string, fallbackW: number) => {
    const root = rootRef.current;
    if (!root) return null;
    const rootWidth = root.offsetWidth || 1;
    const blockEls = Array.from(root.children).filter((el) =>
      el.classList.contains('blk')
    ) as HTMLElement[];

    let foundTarget = false;
    let activeWidth = (fallbackW / 12) * rootWidth;
    let activeHeight = 60;
    const otherRects: RectPx[] = [];

    for (const el of blockEls) {
      const id = el.dataset.id;
      if (!id) continue;
      if (id === targetId) {
        foundTarget = true;
        activeWidth = el.offsetWidth || activeWidth;
        activeHeight = el.offsetHeight || activeHeight;
      } else {
        otherRects.push({
          id,
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
        });
      }
    }

    if (!foundTarget) return null;
    return { rootWidth, activeWidth, activeHeight, otherRects };
  }, []);

  React.useImperativeHandle(
    actionRef,
    () => ({
      nudgeAndShowGuides(block, dir) {
        const measured = measureCanvasBlocks(block.id, block.w);
        const maxPct = 100 - (block.w / 12) * 100;
        const curX = clamp(block.x ?? 0, 0, maxPct);
        const curY = block.y ?? 0;
        const rawX =
          dir === 'l'
            ? clamp(curX - 1, 0, maxPct)
            : dir === 'r'
              ? clamp(curX + 1, 0, maxPct)
              : curX;
        const rawY =
          dir === 'u'
            ? Math.max(0, curY - 10)
            : dir === 'd'
              ? curY + 10
              : curY;

        if (!measured) {
          return { x: Number(rawX.toFixed(2)), y: rawY };
        }

        const { rootWidth, activeWidth, activeHeight, otherRects } = measured;
        const snapXAxis = dir === 'l' || dir === 'r';
        const snapYAxis = dir === 'u' || dir === 'd';

        let res = computeAlignmentGuides(
          {
            id: block.id,
            left: (rawX / 100) * rootWidth,
            top: rawY,
            width: activeWidth,
            height: activeHeight,
          },
          otherRects,
          {
            allowSnapX: snapXAxis,
            allowSnapY: snapYAxis,
            snapThreshold: 6,
            canvasWidth: rootWidth,
            maxLeft: (maxPct / 100) * rootWidth,
          }
        );

        let nextX = Number(
          clamp((res.snappedLeft / rootWidth) * 100, 0, maxPct).toFixed(2)
        );
        let nextY = Math.max(0, Math.round(res.snappedTop));

        // Ensure nudge never stalls against an existing alignment anchor
        const stalledX =
          snapXAxis && rawX !== curX && Math.abs(nextX - curX) < 0.05;
        const stalledY = snapYAxis && rawY !== curY && nextY === curY;

        if (stalledX || stalledY) {
          nextX = Number(rawX.toFixed(2));
          nextY = rawY;
          res = computeAlignmentGuides(
            {
              id: block.id,
              left: (nextX / 100) * rootWidth,
              top: nextY,
              width: activeWidth,
              height: activeHeight,
            },
            otherRects,
            {
              allowSnapX: false,
              allowSnapY: false,
              snapThreshold: 2,
              canvasWidth: rootWidth,
            }
          );
        }

        setGuides(res.guides, 1800);
        return { x: nextX, y: nextY };
      },

      showResizeGuides(block, nextW) {
        window.requestAnimationFrame(() => {
          const measured = measureCanvasBlocks(block.id, nextW);
          if (!measured) return;
          const { rootWidth, activeHeight, otherRects } = measured;
          const leftPx =
            (clamp(block.x ?? 0, 0, 100 - (nextW / 12) * 100) / 100) *
            rootWidth;
          const res = computeAlignmentGuides(
            {
              id: block.id,
              left: leftPx,
              top: block.y ?? 0,
              width: (nextW / 12) * rootWidth,
              height: activeHeight,
            },
            otherRects,
            {
              allowSnapX: false,
              allowSnapY: false,
              snapThreshold: 8,
              canvasWidth: rootWidth,
            }
          );
          setGuides(res.guides, 1800);
        });
      },

      clearGuides() {
        setGuides([]);
      },
    }),
    [measureCanvasBlocks, setGuides]
  );

  const isFree =
    slide.blocks.length > 0 && slide.blocks.every((b) => b.y != null);

  const applyLayoutGeometry = React.useCallback(() => {
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

    if (mode === 'present') {
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
    } else {
      let bottom = 0;
      for (const b of slide.blocks) {
        const el = children.find((c) => c.dataset.id === b.id);
        if (!el) continue;
        const top = b.y ?? 0;
        el.style.top = `${top}px`;
        bottom = Math.max(bottom, top + el.offsetHeight);
      }
      root.style.height = `${bottom + 220}px`;
    }
  }, [slide.blocks, isFree, mode]);

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

    applyLayoutGeometry();
  }, [slide, mode, openBlockIds, applyLayoutGeometry]);

  // Recompute on resize & font ready
  React.useEffect(() => {
    const onResize = () => applyLayoutGeometry();
    window.addEventListener('resize', onResize);
    if (document.fonts && document.fonts.ready) {
      void document.fonts.ready.then(applyLayoutGeometry);
    }
    return () => window.removeEventListener('resize', onResize);
  }, [applyLayoutGeometry]);

  // Pointer drag/resize handlers in layout mode
  React.useEffect(() => {
    if (mode !== 'layout') return;

    const onPointerMove = (e: PointerEvent) => {
      const d = dragStateRef.current;
      if (!d) return;

      if (e.clientY < 90) window.scrollBy(0, -12);
      else if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 12);

      if (d.kind === 'resize') {
        const raw = d.origW + (e.clientX - d.startX) / d.colWidth;
        const nextW = clamp(Math.round(raw * 2) / 2, 1, 12);
        const activeEl = rootRef.current
          ? (Array.from(rootRef.current.children).find(
              (el) =>
                el.classList.contains('blk') &&
                (el as HTMLElement).dataset.id === d.blockId
            ) as HTMLElement | undefined)
          : undefined;
        const resizedLeft =
          (clamp(d.origX, 0, 100 - (nextW / 12) * 100) / 100) * d.rootWidth;
        const resizedWidth = (nextW / 12) * d.rootWidth;
        const resizedHeight = activeEl?.offsetHeight || d.activeHeight;
        const res = computeAlignmentGuides(
          {
            id: d.blockId,
            left: resizedLeft,
            top: d.origY,
            width: resizedWidth,
            height: resizedHeight,
          },
          d.otherRects,
          {
            allowSnapX: false,
            allowSnapY: false,
            snapThreshold: 8,
            canvasWidth: d.rootWidth,
          }
        );
        setGuides(res.guides);
        d.latestBlocks = d.latestBlocks.map((b) =>
          b.id === d.blockId ? { ...b, w: nextW } : b
        );
        onUpdateLayoutRef.current(d.latestBlocks);
      } else {
        const maxPct = 100 - (d.origW / 12) * 100;
        const rawNextX = clamp(
          d.origX + ((e.clientX - d.startX) / d.rootWidth) * 100,
          0,
          maxPct
        );
        const rawNextY = Math.max(
          0,
          Math.round(
            d.origY + e.clientY - d.startY + window.scrollY - d.startScrollY
          )
        );
        const res = computeAlignmentGuides(
          {
            id: d.blockId,
            left: (rawNextX / 100) * d.rootWidth,
            top: rawNextY,
            width: d.activeWidth,
            height: d.activeHeight,
          },
          d.otherRects,
          {
            snapThreshold: 6,
            canvasWidth: d.rootWidth,
            maxLeft: (maxPct / 100) * d.rootWidth,
          }
        );
        const nextX = Number(
          clamp((res.snappedLeft / d.rootWidth) * 100, 0, maxPct).toFixed(2)
        );
        const nextY = Math.max(0, Math.round(res.snappedTop));
        setGuides(res.guides);
        d.latestBlocks = d.latestBlocks.map((b) =>
          b.id === d.blockId ? { ...b, x: nextX, y: nextY } : b
        );
        onUpdateLayoutRef.current(d.latestBlocks);
      }
    };

    const onPointerUp = () => {
      if (!dragStateRef.current) return;
      dragStateRef.current = null;
      dragEndedAtRef.current = Date.now();
      setGuides([]);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      dragStateRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [mode, setGuides]);

  const startDrag = (
    e: React.PointerEvent,
    kind: 'move' | 'resize',
    block: Block
  ) => {
    e.preventDefault();
    e.stopPropagation();
    clearGuideTimer();
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const measured = measureCanvasBlocks(block.id, block.w);
    const rootWidth = measured?.rootWidth ?? (root.offsetWidth || 1);
    const activeWidth = measured?.activeWidth ?? (block.w / 12) * rootWidth;
    const activeHeight = measured?.activeHeight ?? 60;
    const otherRects = measured?.otherRects ?? [];

    dragStateRef.current = {
      kind,
      blockId: block.id,
      startX: e.clientX,
      startY: e.clientY,
      startScrollY: window.scrollY,
      origX: block.x ?? 0,
      origY: block.y ?? 0,
      origW: block.w,
      rootWidth,
      colWidth: (rect.width + 14) / 12,
      activeWidth,
      activeHeight,
      otherRects,
      latestBlocks: slide.blocks,
    };
  };

  const renderBlockInner = (
    b: Block,
    ddNumber: number,
    m: WorkspaceMode
  ): React.ReactNode => {
    const live = m === 'present';
    const lay = m === 'layout';
    const isOpen = live && openBlockIds.has(b.id);

    if (b.t === 'text') {
      return (
        <div
          className={`tx s-${b.size || 'm'} a-${b.align || 'l'} ${b.b ? 'bd' : ''}`}
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

    if (b.t === 'img') {
      if (!b.src) {
        return <div className="text-sm italic opacity-55">(gambar kosong)</div>;
      }
      if (live) {
        return (
          <button
            type="button"
            className="block w-full p-0 border-0 bg-transparent cursor-zoom-in rounded-md overflow-hidden"
            onClick={() => onImageZoom(b.src, b.alt)}
            aria-label={`Perbesar gambar ${b.alt || 'presentasi'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.src}
              alt={b.alt || 'Gambar presentasi'}
              className="im block w-full h-auto rounded-md"
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </button>
        );
      }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={b.src}
          alt={b.alt || 'Gambar presentasi'}
          className="im block w-full h-auto rounded-md"
          draggable={false}
          referrerPolicy="no-referrer"
        />
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
              onClick={() => onToggleBlockOpen(b.id, b)}
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
              const num = child.t === 'dd' ? ++childDd : 0;
              const isSel = lay && selectedBlockId === child.id;
              return (
                <div
                  key={child.id}
                  data-id={child.id}
                  style={{ gridColumn: `span ${clamp(Math.round(child.w), 1, 12)}` }}
                  className={`blk ${isSel ? 'sel' : ''}`}
                  onClick={(e) => {
                    if (!lay) return;
                    e.stopPropagation();
                    if (Date.now() - dragEndedAtRef.current < 250) return;
                    onSelectBlock(child.id);
                  }}
                >
                  {renderBlockInner(child, num, m)}
                  {isSel && (
                    <span className="wb">{child.w}/12</span>
                  )}
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

    // conclusion block
    const label = b.label || '★ Kesimpulan';
    return (
      <div>
        {live ? (
          <button
            type="button"
            className="pbtn"
            aria-expanded={isOpen}
            onClick={() => onToggleBlockOpen(b.id, b)}
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
  };

  let ddCounter = 0;
  const enterX =
    slideDirection === 'next' ? 32 : slideDirection === 'prev' ? -32 : 0;

  return (
    <motion.section
      key={slide.id}
      initial={
        mode === 'present' && slideDirection
          ? { opacity: 0, x: enterX }
          : { opacity: 0.96 }
      }
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: theme === 'auditor' ? 0.35 : theme === 'default' ? 0.22 : 0.25,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`slide ${slide.vc && !isFree ? 'vc' : ''}`}
      onClick={() => {
        if (mode === 'layout') {
          setGuides([]);
          onSelectBlock(null);
        }
      }}
    >
      <div
        ref={rootRef}
        data-testid="slide-canvas"
        className={`cv root ${isFree ? 'free max-sm:!flex max-sm:!flex-col max-sm:!gap-3.5 max-sm:!h-auto' : ''} ${
          mode === 'layout' ? 'lay' : ''
        }`}
      >
        {slide.blocks.length === 0 && (
          <div className="col-span-12 flex flex-col items-center justify-center min-h-[260px] text-center px-4 opacity-60">
            <p className="text-base font-medium m-0">Slide masih kosong.</p>
            <p className="text-sm mt-1 m-0">
              {mode === 'layout'
                ? 'Tambahkan komponen lewat mode Isi terlebih dahulu.'
                : 'Klik tombol Isi di kanan atas untuk mulai menambahkan materi.'}
            </p>
          </div>
        )}
        {slide.blocks.map((b) => {
          const ddNumber = b.t === 'dd' ? ++ddCounter : 0;
          const isSelected = mode === 'layout' && selectedBlockId === b.id;
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
              className={`blk max-sm:!static max-sm:!w-full ${
                isSelected ? 'sel' : ''
              }`}
              onClick={(e) => {
                if (mode !== 'layout') return;
                e.stopPropagation();
                if (Date.now() - dragEndedAtRef.current < 250) return;
                onSelectBlock(b.id);
              }}
            >
              {renderBlockInner(b, ddNumber, mode)}

              {isSelected && (
                <>
                  <button
                    type="button"
                    className="mv"
                    aria-label="Geser posisi blok"
                    onPointerDown={(e) => startDrag(e, 'move', b)}
                  >
                    <Move className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="rz"
                    aria-label="Ubah lebar blok"
                    onPointerDown={(e) => startDrag(e, 'resize', b)}
                  >
                    <Scaling className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <span className="wb">{b.w}/12</span>
                </>
              )}
            </div>
          );
        })}

        {mode === 'layout' &&
          alignmentGuides.map((g, idx) => (
            <div
              key={`${g.orientation}-${g.kind}-${g.position}-${idx}`}
              data-testid="alignment-guide"
              data-orientation={g.orientation}
              data-kind={g.kind}
              aria-hidden="true"
              className={`align-guide ${
                g.orientation === 'horizontal'
                  ? 'align-guide-h'
                  : 'align-guide-v'
              } align-guide-${g.kind}`}
              style={
                g.orientation === 'horizontal'
                  ? {
                      left: `${g.start}px`,
                      top: `${g.position}px`,
                      width: `${Math.max(0, g.end - g.start)}px`,
                    }
                  : {
                      top: `${g.start}px`,
                      left: `${g.position}px`,
                      height: `${Math.max(0, g.end - g.start)}px`,
                    }
              }
            />
          ))}
      </div>
    </motion.section>
  );
}

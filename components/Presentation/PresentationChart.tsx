'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  isChartZoomExemptTarget,
  type ChartHoveredItem,
} from '@/lib/page/page-edit/page-edit-chart';
import { formatChartNumber } from '@/lib/presentation/presentation-chart';
import type { ChartBlock } from '@/lib/deck-types';
import { ChartView } from '../Page/PageEdit/PageEditChart/PageEditChartView';

interface PresentationChartProps {
  block: ChartBlock;
  live?: boolean;
  interactive?: boolean;
  zoomable?: boolean;
  insideModal?: boolean;
  compact?: boolean;
  onTermClick?: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onModalClick?: (title: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface PresentationChartCardProps extends PresentationChartProps {
  isZoomedView?: boolean;
  onRequestZoom?: () => void;
}

function PresentationChartCard({
  block,
  live = true,
  interactive = live,
  zoomable = true,
  insideModal = false,
  compact = false,
  isZoomedView = false,
  onTermClick,
  onModalClick,
  onRequestZoom,
}: PresentationChartCardProps) {
  const [hovered, setHovered] = React.useState<ChartHoveredItem | null>(null);
  const canZoom = Boolean(interactive && zoomable && !isZoomedView && onRequestZoom);

  return (
    <ChartView
      block={block}
      live={live}
      interactive={interactive}
      insideModal={insideModal}
      compact={compact}
      hovered={hovered}
      onHover={setHovered}
      cardClassName={canZoom ? 'cursor-zoom-in' : ''}
      onCardClick={(e) => {
        if (!canZoom) return;
        if (isChartZoomExemptTarget(e.target)) return;
        setHovered(null);
        onRequestZoom?.();
      }}
      onTermClick={onTermClick}
      onModalClick={onModalClick}
      cardOverlay={
        <>
          {canZoom && (
            <button
              type="button"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 pbtn sm"
              onClick={(e) => {
                e.stopPropagation();
                setHovered(null);
                onRequestZoom?.();
              }}
              aria-label={`Perbesar chart ${block.title?.trim() || ''}`.trim()}
            >
              Perbesar chart
            </button>
          )}

          {hovered && (
            <div className="pchart-readout tabular-nums" aria-live="polite">
              <span
                className="pchart-swatch"
                style={{ backgroundColor: hovered.color }}
                aria-hidden="true"
              />
              <span className="font-semibold">{hovered.category}</span>
              {block.chartType !== 'pie' && hovered.series && (
                <span className="opacity-75">· {hovered.series}</span>
              )}
              <span className="font-mono font-bold">
                {formatChartNumber(hovered.value)}
                {hovered.percentage !== undefined
                  ? ` (${Math.round(hovered.percentage)}%)`
                  : ''}
              </span>
            </div>
          )}
        </>
      }
    />
  );
}

export function PresentationChart({
  block,
  live = true,
  interactive = live,
  zoomable = true,
  insideModal = false,
  compact = false,
  onTermClick,
  onModalClick,
}: PresentationChartProps) {
  const [isZoomed, setIsZoomed] = React.useState(false);

  React.useEffect(() => {
    if (!isZoomed) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setIsZoomed(false);
        return;
      }
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowLeft' ||
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === ' '
      ) {
        e.stopImmediatePropagation();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isZoomed]);

  return (
    <>
      <PresentationChartCard
        block={block}
        live={live}
        interactive={interactive}
        zoomable={zoomable}
        insideModal={insideModal}
        compact={compact}
        onTermClick={onTermClick}
        onModalClick={onModalClick}
        onRequestZoom={() => setIsZoomed(true)}
      />

      {isZoomed &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/88 z-50 grid place-items-center p-4 sm:p-8 cursor-zoom-out"
            role="dialog"
            aria-modal="true"
            aria-label={block.title?.trim() || 'Pratinjau chart'}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsZoomed(false);
            }}
          >
            <button
              type="button"
              className="pbtn sm fixed top-4 right-4 z-10"
              onClick={() => setIsZoomed(false)}
              aria-label="Tutup pratinjau chart"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
            <div
              className="w-full max-w-[min(980px,94vw)] max-h-[90vh] overflow-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <PresentationChartCard
                block={block}
                live={live}
                interactive={true}
                zoomable={false}
                insideModal={insideModal}
                compact={false}
                isZoomedView={true}
                onTermClick={onTermClick}
                onModalClick={onModalClick}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

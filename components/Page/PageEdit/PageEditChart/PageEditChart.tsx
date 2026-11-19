'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  CHART_PALETTE,
  isChartZoomExemptTarget,
  type ChartHoveredItem,
} from '@/lib/page/page-edit/page-edit-chart';
import { formatChartNumber } from '@/lib/presentation/presentation-chart';
import type { ChartBlock } from '@/lib/deck-types';
import { MarkupText } from '../PageEditMarkupText';
import { PageEditChartTypesBatang } from './PageEditChartTypes/PageEditChartTypesBatang';
import { PageEditChartTypesGaris } from './PageEditChartTypes/PageEditChartTypesGaris';
import { PageEditChartTypesKolom } from './PageEditChartTypes/PageEditChartTypesKolom';
import { PageEditChartTypesPie } from './PageEditChartTypes/PageEditChartTypesPie';
import { PageEditChartTypesSunburst } from './PageEditChartTypes/PageEditChartTypesSunburst';

interface ChartViewProps {
  block: ChartBlock;
  live?: boolean;
  interactive?: boolean;
  zoomable?: boolean;
  insideModal?: boolean;
  compact?: boolean;
  onTermClick?: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onModalClick?: (title: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface ChartCardContentProps extends ChartViewProps {
  categories: string[];
  series: ChartBlock['series'];
  allValues: number[];
  isZoomedView?: boolean;
  onRequestZoom?: () => void;
}

function ChartCardContent({
  block,
  categories,
  series,
  allValues,
  live = true,
  interactive = live,
  zoomable = true,
  insideModal = false,
  compact = false,
  isZoomedView = false,
  onTermClick,
  onModalClick,
  onRequestZoom,
}: ChartCardContentProps) {
  const [hovered, setHovered] = React.useState<ChartHoveredItem | null>(null);
  const canZoom = Boolean(interactive && zoomable && !isZoomedView && onRequestZoom);

  const sharedChartProps = {
    block,
    categories,
    series,
    allValues,
    compact,
    interactive,
    hovered,
    onHover: setHovered,
  };

  return (
    <div className="pchart-wrap">
      <div
        className={`card pchart-card ${compact ? 'pchart-card-compact' : ''} ${
          canZoom ? 'cursor-zoom-in' : ''
        }`}
        onClick={(e) => {
          if (!canZoom) return;
          if (isChartZoomExemptTarget(e.target)) return;
          setHovered(null);
          onRequestZoom?.();
        }}
      >
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

        {block.title?.trim() && (
          <div
            className={`pchart-head ${
              block.chartType === 'sunburst' ? 'pchart-head-center' : ''
            }`}
          >
            <div className="pchart-title">
              {onTermClick ? (
                <MarkupText
                  text={block.title}
                  live={live}
                  insideModal={insideModal}
                  onTermClick={onTermClick}
                  onModalClick={onModalClick}
                />
              ) : (
                block.title
              )}
            </div>
          </div>
        )}

        {block.chartType === 'sunburst' && (
          <div className="pchart-legend !mt-0 !mb-2 !pt-0 !border-t-0">
            {categories.map((cat, cIdx) => (
              <div key={`${cIdx}-${cat}`} className="pchart-legend-item">
                <span
                  className="pchart-swatch"
                  style={{
                    backgroundColor: CHART_PALETTE[cIdx % CHART_PALETTE.length],
                  }}
                  aria-hidden="true"
                />
                <span>{cat.trim() || `Kategori ${cIdx + 1}`}</span>
              </div>
            ))}
          </div>
        )}

        <div className="pchart-canvas">
          {block.chartType === 'column' && (
            <PageEditChartTypesKolom {...sharedChartProps} />
          )}
          {block.chartType === 'bar' && (
            <PageEditChartTypesBatang {...sharedChartProps} />
          )}
          {block.chartType === 'line' && (
            <PageEditChartTypesGaris {...sharedChartProps} />
          )}
          {block.chartType === 'pie' && (
            <PageEditChartTypesPie {...sharedChartProps} />
          )}
          {block.chartType === 'sunburst' && (
            <PageEditChartTypesSunburst {...sharedChartProps} />
          )}
        </div>

        {block.chartType !== 'pie' && block.chartType !== 'sunburst' && (
          <div className="pchart-legend">
            {series.map((ser, sIdx) => (
              <div key={ser.id} className="pchart-legend-item">
                <span
                  className="pchart-swatch"
                  style={{
                    backgroundColor: CHART_PALETTE[sIdx % CHART_PALETTE.length],
                  }}
                  aria-hidden="true"
                />
                <span>{ser.name.trim() || `Seri ${sIdx + 1}`}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChartView({
  block,
  live = true,
  interactive = live,
  zoomable = true,
  insideModal = false,
  compact = false,
  onTermClick,
  onModalClick,
}: ChartViewProps) {
  const [isZoomed, setIsZoomed] = React.useState(false);

  const categories =
    block.categories.length > 0 ? block.categories : ['Kategori 1'];
  const series =
    block.series.length > 0
      ? block.series
      : [{ id: 's1', name: 'Seri 1', values: [0] }];

  const allValues = series.flatMap((s) =>
    categories.map((_, cIdx) => {
      const n = Number(s.values[cIdx] ?? 0);
      return Number.isFinite(n) ? n : 0;
    })
  );

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
      <ChartCardContent
        block={block}
        categories={categories}
        series={series}
        allValues={allValues}
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
              <ChartCardContent
                block={block}
                categories={categories}
                series={series}
                allValues={allValues}
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

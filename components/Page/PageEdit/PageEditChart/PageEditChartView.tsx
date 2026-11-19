'use client';

import React from 'react';
import {
  CHART_PALETTE,
  type ChartHoveredItem,
} from '@/lib/page/page-edit/page-edit-chart';
import type { ChartBlock } from '@/lib/deck-types';
import { MarkupText } from '../PageEditMarkupText';
import { PageEditChartTypesBatang } from './PageEditChartTypes/PageEditChartTypesBatang';
import { PageEditChartTypesGaris } from './PageEditChartTypes/PageEditChartTypesGaris';
import { PageEditChartTypesKolom } from './PageEditChartTypes/PageEditChartTypesKolom';
import { PageEditChartTypesPie } from './PageEditChartTypes/PageEditChartTypesPie';
import { PageEditChartTypesSunburst } from './PageEditChartTypes/PageEditChartTypesSunburst';

export interface ChartViewProps {
  block: ChartBlock;
  live?: boolean;
  interactive?: boolean;
  insideModal?: boolean;
  compact?: boolean;
  hovered?: ChartHoveredItem | null;
  onHover?: (item: ChartHoveredItem | null) => void;
  cardClassName?: string;
  onCardClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  cardOverlay?: React.ReactNode;
  onTermClick?: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onModalClick?: (title: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function ChartView({
  block,
  live = true,
  interactive = false,
  insideModal = false,
  compact = false,
  hovered = null,
  onHover,
  cardClassName = '',
  onCardClick,
  cardOverlay,
  onTermClick,
  onModalClick,
}: ChartViewProps) {
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

  const sharedChartProps = {
    block,
    categories,
    series,
    allValues,
    compact,
    interactive,
    hovered,
    onHover: onHover ?? (() => {}),
  };

  return (
    <div className="pchart-wrap">
      <div
        className={`card pchart-card ${compact ? 'pchart-card-compact' : ''} ${cardClassName}`.trim()}
        onClick={onCardClick}
      >
        {cardOverlay}

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

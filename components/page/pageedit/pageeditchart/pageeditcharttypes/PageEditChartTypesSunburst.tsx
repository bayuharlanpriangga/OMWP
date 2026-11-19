'use client';

import React from 'react';
import {
  computeSunburstArcs,
  type PageEditChartTypeProps,
} from '@/lib/page/page-edit/page-edit-chart';

export function PageEditChartTypesSunburst({
  block,
  categories,
  series,
  compact = false,
  interactive = true,
  hovered,
  onHover,
}: PageEditChartTypeProps) {
  const W = compact ? 440 : 640;
  const H = compact ? 225 : 300;

  const cx = W / 2;
  const cy = H / 2;
  const outerR = compact ? 84 : 116;
  const innerR = outerR * 0.48;
  const arcs = computeSunburstArcs(
    categories,
    series,
    cx,
    cy,
    innerR,
    outerR
  );

  if (arcs.length === 0) {
    return (
      <div className="py-10 text-center text-sm opacity-65">
        Masukkan nilai lebih dari 0 untuk menampilkan chart Sunburst.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="pchart-svg"
      role="img"
      aria-label={block.title?.trim() || 'Grafik sunburst'}
      onMouseLeave={() => {
        if (interactive) onHover(null);
      }}
    >
      {arcs.map((arc, idx) => {
        const isActive =
          hovered?.category === arc.categoryLabel &&
          (arc.ring === 0 && series.length <= 1
            ? true
            : hovered?.series === arc.seriesLabel);
        return (
          <path
            key={`${arc.ring}-${arc.categoryIndex}-${arc.seriesIndex ?? 'all'}-${idx}`}
            data-chart-element="true"
            d={arc.path}
            fill={arc.color}
            fillOpacity={
              isActive
                ? 0.98
                : hovered
                  ? arc.opacity * 0.45
                  : arc.opacity
            }
            fillRule={arc.isFullRing ? 'evenodd' : undefined}
            stroke={isActive ? 'currentColor' : 'var(--card)'}
            strokeWidth={arc.isFullRing && !isActive ? 0 : 2}
            className={interactive ? 'cursor-pointer transition-opacity' : ''}
            onClick={(e) => {
              if (interactive) e.stopPropagation();
            }}
            onMouseEnter={() => {
              if (!interactive) return;
              onHover({
                category: arc.categoryLabel,
                series: series.length > 1 ? arc.seriesLabel : '',
                value: arc.value,
                percentage: arc.percentage,
                color: arc.color,
              });
            }}
            onMouseLeave={() => {
              if (!interactive) return;
              onHover(null);
            }}
          />
        );
      })}
    </svg>
  );
}

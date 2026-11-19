'use client';

import React from 'react';
import {
  computePieSlices,
  truncateChartLabel,
  type PageEditChartTypeProps,
} from '@/lib/page/page-edit/page-edit-chart';
import { formatChartNumber } from '@/lib/presentation/presentation-chart';

export function PageEditChartTypesPie({
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
  const fontSize = 11.5;

  const primarySeries = series[0];
  const cx = compact ? W * 0.38 : W * 0.36;
  const cy = H / 2;
  const radius = compact ? 78 : 108;
  const slices = computePieSlices(
    categories,
    primarySeries?.values ?? [],
    cx,
    cy,
    radius
  );
  const seriesName = primarySeries?.name?.trim() || 'Seri 1';

  if (slices.length === 0) {
    return (
      <div className="py-10 text-center text-sm opacity-65">
        Masukkan nilai lebih dari 0 pada seri pertama untuk menampilkan chart Pai.
      </div>
    );
  }

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const listX = compact ? cx + radius + 24 : cx + radius + 36;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="pchart-svg"
      role="img"
      aria-label={block.title?.trim() || 'Grafik pai'}
    >
      {slices.map((slice) => {
        const isActive = hovered?.category === slice.label;
        return (
          <g key={slice.categoryIndex}>
            <path
              data-chart-element="true"
              d={slice.path}
              fill={slice.color}
              fillOpacity={hovered && !isActive ? 0.55 : 0.96}
              stroke="var(--card)"
              strokeWidth={slice.isFullCircle ? 0 : 2.5}
              className={interactive ? 'cursor-pointer transition-opacity' : ''}
              onClick={(e) => {
                if (interactive) e.stopPropagation();
              }}
              onMouseEnter={() => {
                if (!interactive) return;
                onHover({
                  category: slice.label,
                  series: seriesName,
                  value: slice.value,
                  percentage: slice.percentage,
                  color: slice.color,
                });
              }}
              onMouseLeave={() => {
                if (!interactive) return;
                onHover(null);
              }}
            />
            {slice.percentage >= 7 && (
              <text
                x={slice.labelX}
                y={slice.labelY + 4}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={compact ? 11 : 12}
                fontWeight={700}
                className="pointer-events-none font-mono tabular-nums"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}
              >
                {Math.round(slice.percentage)}%
              </text>
            )}
          </g>
        );
      })}

      {slices.slice(0, 8).map((slice, idx) => {
        const rowStep = compact ? 22 : 26;
        const totalH = Math.min(slices.length, 8) * rowStep;
        const startY = cy - totalH / 2 + rowStep / 2;
        const y = startY + idx * rowStep;
        const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
        return (
          <g key={`leg-${slice.categoryIndex}`}>
            <rect
              x={listX}
              y={y - 6}
              width={11}
              height={11}
              rx={2}
              fill={slice.color}
            />
            <text
              x={listX + 18}
              y={y + 4}
              fill="currentColor"
              fontSize={fontSize}
              className="tabular-nums"
            >
              {truncateChartLabel(slice.label, compact ? 13 : 18)} ·{' '}
              {formatChartNumber(slice.value)} ({pct}%)
            </text>
          </g>
        );
      })}
    </svg>
  );
}

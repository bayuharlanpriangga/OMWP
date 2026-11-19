'use client';

import React from 'react';
import {
  CHART_PALETTE,
  computeNiceAxisScale,
  truncateChartLabel,
  type PageEditChartTypeProps,
} from '@/lib/page/page-edit/page-edit-chart';
import { formatChartNumber } from '@/lib/presentation/presentation-chart';

export function PageEditChartTypesGaris({
  block,
  categories,
  series,
  allValues,
  compact = false,
  interactive = true,
  hovered,
  onHover,
}: PageEditChartTypeProps) {
  const W = compact ? 440 : 640;
  const H = compact ? 225 : 300;
  const fontSize = 11.5;

  const padL = compact ? 44 : 54;
  const padR = 24;
  const padT = 18;
  const padB = compact ? 38 : 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const scale = computeNiceAxisScale(allValues, compact ? 4 : 5);
  const span = scale.max - scale.min || 1;
  const valueToY = (v: number) =>
    padT + plotH - ((v - scale.min) / span) * plotH;
  const catToX = (cIdx: number) =>
    categories.length === 1
      ? padL + plotW / 2
      : padL + (cIdx / (categories.length - 1)) * plotW;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="pchart-svg"
      role="img"
      aria-label={block.title?.trim() || 'Grafik garis'}
    >
      {scale.ticks.map((tick) => {
        const y = valueToY(tick);
        const isZero = tick === 0;
        return (
          <g key={tick}>
            <line
              x1={padL}
              y1={y}
              x2={W - padR}
              y2={y}
              stroke="currentColor"
              strokeOpacity={isZero ? 0.34 : 0.12}
              strokeWidth={isZero ? 1.25 : 1}
            />
            <text
              x={padL - 8}
              y={y + 4}
              textAnchor="end"
              fill="currentColor"
              fillOpacity={0.72}
              fontSize={fontSize}
              className="font-mono tabular-nums"
            >
              {formatChartNumber(tick)}
            </text>
          </g>
        );
      })}

      {categories.map((cat, cIdx) => {
        const catLabel = cat.trim() || `Kategori ${cIdx + 1}`;
        const x = catToX(cIdx);
        return (
          <text
            key={`${cIdx}-${catLabel}`}
            x={x}
            y={H - padB + 18}
            textAnchor="middle"
            fill="currentColor"
            fillOpacity={0.84}
            fontSize={fontSize}
          >
            {truncateChartLabel(
              catLabel,
              Math.max(6, Math.floor(24 / Math.max(1, categories.length / 2)))
            )}
          </text>
        );
      })}

      {series.map((ser, sIdx) => {
        const color = CHART_PALETTE[sIdx % CHART_PALETTE.length];
        const seriesName = ser.name.trim() || `Seri ${sIdx + 1}`;
        const pts = categories.map((cat, cIdx) => {
          const rawVal = Number(ser.values[cIdx] ?? 0);
          const val = Number.isFinite(rawVal) ? rawVal : 0;
          return {
            x: catToX(cIdx),
            y: valueToY(val),
            val,
            catLabel: cat.trim() || `Kategori ${cIdx + 1}`,
          };
        });
        const polylinePts = pts
          .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          .join(' ');

        return (
          <g key={ser.id}>
            {pts.length > 1 && (
              <polyline
                fill="none"
                stroke={color}
                strokeWidth={compact ? 2.5 : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePts}
              />
            )}
            {pts.map((p, cIdx) => {
              const isActive =
                hovered?.category === p.catLabel &&
                hovered?.series === seriesName;
              return (
                <circle
                  key={cIdx}
                  data-chart-element="true"
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 6.5 : compact ? 4 : 4.5}
                  fill={color}
                  stroke="var(--card)"
                  strokeWidth={2}
                  className={interactive ? 'cursor-pointer' : ''}
                  onClick={(e) => {
                    if (interactive) e.stopPropagation();
                  }}
                  onMouseEnter={() => {
                    if (!interactive) return;
                    onHover({
                      category: p.catLabel,
                      series: seriesName,
                      value: p.val,
                      color,
                    });
                  }}
                  onMouseLeave={() => {
                    if (!interactive) return;
                    onHover(null);
                  }}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

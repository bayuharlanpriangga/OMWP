'use client';

import React from 'react';
import {
  CHART_PALETTE,
  computeNiceAxisScale,
  truncateChartLabel,
  type PageEditChartTypeProps,
} from '@/lib/page/page-edit/page-edit-chart';
import { formatChartNumber } from '@/lib/presentation/presentation-chart';

export function PageEditChartTypesKolom({
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
  const padR = 18;
  const padT = 18;
  const padB = compact ? 38 : 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const scale = computeNiceAxisScale(allValues, compact ? 4 : 5);
  const span = scale.max - scale.min || 1;
  const valueToY = (v: number) =>
    padT + plotH - ((v - scale.min) / span) * plotH;
  const zeroY = valueToY(Math.max(scale.min, Math.min(scale.max, 0)));

  const groupW = plotW / categories.length;
  const groupInnerW = groupW * 0.72;
  const barGap = series.length > 1 ? Math.min(4, groupInnerW * 0.08) : 0;
  const barW = Math.max(
    4,
    (groupInnerW - barGap * (series.length - 1)) / series.length
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="pchart-svg"
      role="img"
      aria-label={block.title?.trim() || 'Grafik kolom'}
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
        const groupStartX =
          padL + cIdx * groupW + (groupW - groupInnerW) / 2;
        return (
          <g key={`${cIdx}-${catLabel}`}>
            {series.map((ser, sIdx) => {
              const rawVal = Number(ser.values[cIdx] ?? 0);
              const val = Number.isFinite(rawVal) ? rawVal : 0;
              const valY = valueToY(val);
              const rectY = Math.min(valY, zeroY);
              const rectH = Math.max(1.5, Math.abs(zeroY - valY));
              const x = groupStartX + sIdx * (barW + barGap);
              const color = CHART_PALETTE[sIdx % CHART_PALETTE.length];
              const seriesName = ser.name.trim() || `Seri ${sIdx + 1}`;
              const isActive =
                hovered?.category === catLabel && hovered?.series === seriesName;

              return (
                <rect
                  key={ser.id}
                  data-chart-element="true"
                  x={x}
                  y={rectY}
                  width={barW}
                  height={rectH}
                  rx={Math.min(3, barW / 4)}
                  fill={color}
                  fillOpacity={hovered && !isActive ? 0.52 : 0.94}
                  stroke={isActive ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 1.5 : 0}
                  className={interactive ? 'cursor-pointer transition-opacity' : ''}
                  onClick={(e) => {
                    if (interactive) e.stopPropagation();
                  }}
                  onMouseEnter={() => {
                    if (!interactive) return;
                    onHover({
                      category: catLabel,
                      series: seriesName,
                      value: val,
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

            <text
              x={padL + cIdx * groupW + groupW / 2}
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
          </g>
        );
      })}
    </svg>
  );
}

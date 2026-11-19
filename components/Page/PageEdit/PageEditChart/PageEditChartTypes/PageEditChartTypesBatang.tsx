'use client';

import React from 'react';
import {
  CHART_PALETTE,
  computeNiceAxisScale,
  truncateChartLabel,
  type PageEditChartTypeProps,
} from '@/lib/page/page-edit/page-edit-chart';
import { formatChartNumber } from '@/lib/presentation/presentation-chart';

export function PageEditChartTypesBatang({
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

  const padL = compact ? 76 : 98;
  const padR = 24;
  const padT = 14;
  const padB = compact ? 32 : 36;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const scale = computeNiceAxisScale(allValues, compact ? 4 : 5);
  const span = scale.max - scale.min || 1;
  const valueToX = (v: number) =>
    padL + ((v - scale.min) / span) * plotW;
  const zeroX = valueToX(Math.max(scale.min, Math.min(scale.max, 0)));

  const groupH = plotH / categories.length;
  const groupInnerH = groupH * 0.72;
  const barGap = series.length > 1 ? Math.min(3, groupInnerH * 0.08) : 0;
  const barH = Math.max(
    4,
    (groupInnerH - barGap * (series.length - 1)) / series.length
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="pchart-svg"
      role="img"
      aria-label={block.title?.trim() || 'Grafik batang'}
    >
      {scale.ticks.map((tick) => {
        const x = valueToX(tick);
        const isZero = tick === 0;
        return (
          <g key={tick}>
            <line
              x1={x}
              y1={padT}
              x2={x}
              y2={H - padB}
              stroke="currentColor"
              strokeOpacity={isZero ? 0.34 : 0.12}
              strokeWidth={isZero ? 1.25 : 1}
            />
            <text
              x={x}
              y={H - padB + 18}
              textAnchor="middle"
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
        const groupStartY =
          padT + cIdx * groupH + (groupH - groupInnerH) / 2;
        return (
          <g key={`${cIdx}-${catLabel}`}>
            <text
              x={padL - 8}
              y={padT + cIdx * groupH + groupH / 2 + 4}
              textAnchor="end"
              fill="currentColor"
              fillOpacity={0.86}
              fontSize={fontSize}
            >
              {truncateChartLabel(catLabel, compact ? 10 : 14)}
            </text>

            {series.map((ser, sIdx) => {
              const rawVal = Number(ser.values[cIdx] ?? 0);
              const val = Number.isFinite(rawVal) ? rawVal : 0;
              const valX = valueToX(val);
              const rectX = Math.min(valX, zeroX);
              const rectW = Math.max(1.5, Math.abs(valX - zeroX));
              const y = groupStartY + sIdx * (barH + barGap);
              const color = CHART_PALETTE[sIdx % CHART_PALETTE.length];
              const seriesName = ser.name.trim() || `Seri ${sIdx + 1}`;
              const isActive =
                hovered?.category === catLabel && hovered?.series === seriesName;

              return (
                <rect
                  key={ser.id}
                  data-chart-element="true"
                  x={rectX}
                  y={y}
                  width={rectW}
                  height={barH}
                  rx={Math.min(3, barH / 4)}
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
          </g>
        );
      })}
    </svg>
  );
}

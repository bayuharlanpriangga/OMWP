'use client';

import React from 'react';
import {
  CHART_PALETTE,
  computeNiceAxisScale,
  computePieSlices,
  computeSunburstArcs,
  formatChartNumber,
} from '@/lib/presentation/presentation-chart';
import type { ChartBlock } from '@/lib/deck-types';
import { MarkupText } from '@/components/page/pageedit/PageEditMarkupText';

interface ChartViewProps {
  block: ChartBlock;
  live?: boolean;
  interactive?: boolean;
  insideModal?: boolean;
  compact?: boolean;
  onTermClick?: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onModalClick?: (title: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface HoveredItem {
  category: string;
  series: string;
  value: number;
  percentage?: number;
  color: string;
}

function truncateLabel(text: string, maxLen: number): string {
  const clean = text.trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, Math.max(1, maxLen - 1))}…`;
}

export function ChartView({
  block,
  live = true,
  interactive = live,
  insideModal = false,
  compact = false,
  onTermClick,
  onModalClick,
}: ChartViewProps) {
  const [hovered, setHovered] = React.useState<HoveredItem | null>(null);

  const categories =
    block.categories.length > 0 ? block.categories : ['Kategori 1'];
  const series =
    block.series.length > 0
      ? block.series
      : [{ id: 's1', name: 'Seri 1', values: [0] }];

  const W = compact ? 440 : 640;
  const H = compact ? 225 : 300;
  const fontSize = compact ? 11.5 : 11.5;

  const allValues = series.flatMap((s) =>
    categories.map((_, cIdx) => {
      const n = Number(s.values[cIdx] ?? 0);
      return Number.isFinite(n) ? n : 0;
    })
  );

  const renderColumnChart = () => {
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
                    onMouseEnter={() => {
                      if (!interactive) return;
                      setHovered({
                        category: catLabel,
                        series: seriesName,
                        value: val,
                        color,
                      });
                    }}
                    onMouseLeave={() => {
                      if (!interactive) return;
                      setHovered(null);
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
                {truncateLabel(
                  catLabel,
                  Math.max(6, Math.floor(24 / Math.max(1, categories.length / 2)))
                )}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderBarChart = () => {
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
                {truncateLabel(catLabel, compact ? 10 : 14)}
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
                    onMouseEnter={() => {
                      if (!interactive) return;
                      setHovered({
                        category: catLabel,
                        series: seriesName,
                        value: val,
                        color,
                      });
                    }}
                    onMouseLeave={() => {
                      if (!interactive) return;
                      setHovered(null);
                    }}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  const renderLineChart = () => {
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
              {truncateLabel(
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
          const polylinePts = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

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
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 6.5 : compact ? 4 : 4.5}
                    fill={color}
                    stroke="var(--card)"
                    strokeWidth={2}
                    className={interactive ? 'cursor-pointer' : ''}
                    onMouseEnter={() => {
                      if (!interactive) return;
                      setHovered({
                        category: p.catLabel,
                        series: seriesName,
                        value: p.val,
                        color,
                      });
                    }}
                    onMouseLeave={() => {
                      if (!interactive) return;
                      setHovered(null);
                    }}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  };

  const renderPieChart = () => {
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
                d={slice.path}
                fill={slice.color}
                fillOpacity={hovered && !isActive ? 0.55 : 0.96}
                stroke="var(--card)"
                strokeWidth={slice.isFullCircle ? 0 : 2.5}
                className={interactive ? 'cursor-pointer transition-opacity' : ''}
                onMouseEnter={() => {
                  if (!interactive) return;
                  setHovered({
                    category: slice.label,
                    series: seriesName,
                    value: slice.value,
                    percentage: slice.percentage,
                    color: slice.color,
                  });
                }}
                onMouseLeave={() => {
                  if (!interactive) return;
                  setHovered(null);
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
                {truncateLabel(slice.label, compact ? 13 : 18)} ·{' '}
                {formatChartNumber(slice.value)} ({pct}%)
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderSunburstChart = () => {
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
          if (interactive) setHovered(null);
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
              onMouseEnter={() => {
                if (!interactive) return;
                setHovered({
                  category: arc.categoryLabel,
                  series:
                    series.length > 1 ? arc.seriesLabel : '',
                  value: arc.value,
                  percentage: arc.percentage,
                  color: arc.color,
                });
              }}
              onMouseLeave={() => {
                if (!interactive) return;
                setHovered(null);
              }}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="pchart-wrap">
      <div className={`card pchart-card ${compact ? 'pchart-card-compact' : ''}`}>
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
          {block.chartType === 'column' && renderColumnChart()}
          {block.chartType === 'bar' && renderBarChart()}
          {block.chartType === 'line' && renderLineChart()}
          {block.chartType === 'pie' && renderPieChart()}
          {block.chartType === 'sunburst' && renderSunburstChart()}
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

import type { ChartBlock, ChartSeries, ChartType } from '../../deck-types';
import { uid } from '../../presentation/presentation-utils';

export const CHART_PALETTE = [
  '#1f7a7a',
  '#e09f2d',
  '#c25438',
  '#4f7a99',
  '#7c5cdb',
  '#16a34a',
  '#db2777',
  '#0284c7',
] as const;

export interface ChartHoveredItem {
  category: string;
  series: string;
  value: number;
  percentage?: number;
  color: string;
}

export interface PageEditChartTypeProps {
  block: ChartBlock;
  categories: string[];
  series: ChartBlock['series'];
  allValues: number[];
  compact?: boolean;
  interactive?: boolean;
  hovered: ChartHoveredItem | null;
  onHover: (item: ChartHoveredItem | null) => void;
}

export interface ChartTypeMeta {
  id: ChartType;
  label: string;
  shortDesc: string;
  editorTitle: string;
}

export const CHART_TYPE_LIST: ChartTypeMeta[] = [
  {
    id: 'column',
    label: 'Kolom',
    shortDesc: 'Membandingkan nilai antar kategori dengan batang vertikal.',
    editorTitle: 'Chart (Kolom)',
  },
  {
    id: 'line',
    label: 'Garis',
    shortDesc: 'Menampilkan tren atau perubahan nilai dari waktu ke waktu.',
    editorTitle: 'Chart (Garis)',
  },
  {
    id: 'pie',
    label: 'Pai',
    shortDesc: 'Menunjukkan proporsi setiap kategori terhadap total.',
    editorTitle: 'Chart (Pai)',
  },
  {
    id: 'bar',
    label: 'Batang',
    shortDesc: 'Membandingkan nilai antar kategori dengan batang horizontal.',
    editorTitle: 'Chart (Batang)',
  },
  {
    id: 'sunburst',
    label: 'Sunburst',
    shortDesc: 'Menampilkan proporsi kategori dan seri dalam cincin konsentris.',
    editorTitle: 'Chart (Sunburst)',
  },
];

export function getChartTypeMeta(chartType: ChartType): ChartTypeMeta {
  return (
    CHART_TYPE_LIST.find((item) => item.id === chartType) ?? CHART_TYPE_LIST[0]
  );
}

export function createDefaultChartData(chartType: ChartType): {
  title: string;
  categories: string[];
  series: ChartSeries[];
} {
  if (chartType === 'pie') {
    return {
      title: 'Judul Bagan',
      categories: ['Kuartal 1', 'Kuartal 2', 'Kuartal 3', 'Kuartal 4'],
      series: [
        {
          id: uid(),
          name: 'Penjualan',
          values: [40, 25, 20, 15],
        },
      ],
    };
  }
  if (chartType === 'sunburst') {
    return {
      title: 'Judul Bagan',
      categories: ['Kategori 1', 'Kategori 2', 'Kategori 3', 'Kategori 4'],
      series: [
        {
          id: uid(),
          name: 'Nilai',
          values: [32, 29, 23, 16],
        },
      ],
    };
  }
  return {
    title: 'Judul Bagan',
    categories: ['Kategori 1', 'Kategori 2', 'Kategori 3', 'Kategori 4'],
    series: [
      { id: uid(), name: 'Seri 1', values: [4.3, 2.5, 3.5, 4.5] },
      { id: uid(), name: 'Seri 2', values: [2.4, 4.4, 1.8, 2.8] },
      { id: uid(), name: 'Seri 3', values: [2, 2, 3, 5] },
    ],
  };
}

export function createChartBlock(chartType: ChartType = 'column'): ChartBlock {
  const starter = createDefaultChartData(chartType);
  return {
    id: uid(),
    t: 'chart',
    chartType,
    title: starter.title,
    categories: starter.categories,
    series: starter.series,
    w: 12,
  };
}

export interface AxisScale {
  min: number;
  max: number;
  ticks: number[];
}

export function computeNiceAxisScale(
  values: number[],
  desiredTicks = 5
): AxisScale {
  const finite = values.filter((v) => Number.isFinite(v));
  const rawMin = finite.length > 0 ? Math.min(0, ...finite) : 0;
  const rawMax = finite.length > 0 ? Math.max(0, ...finite) : 10;

  if (rawMin === 0 && rawMax === 0) {
    return { min: 0, max: 5, ticks: [0, 1, 2, 3, 4, 5] };
  }

  const span = rawMax - rawMin || 1;
  const roughStep = span / Math.max(1, desiredTicks);
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const norm = roughStep / mag;
  const stepFactor =
    norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  const step = stepFactor * mag;

  const niceMin = rawMin < 0 ? Math.floor(rawMin / step) * step : 0;
  const niceMax = Math.ceil(rawMax / step) * step;

  const ticks: number[] = [];
  const count = Math.min(20, Math.round((niceMax - niceMin) / step));
  for (let i = 0; i <= count; i++) {
    const val = Number((niceMin + i * step).toPrecision(10));
    ticks.push(val);
  }

  return { min: niceMin, max: niceMax, ticks };
}

export interface PieSliceGeometry {
  categoryIndex: number;
  label: string;
  value: number;
  percentage: number;
  color: string;
  path: string;
  labelX: number;
  labelY: number;
  isFullCircle: boolean;
}

export function computePieSlices(
  categories: string[],
  values: number[],
  cx: number,
  cy: number,
  radius: number
): PieSliceGeometry[] {
  const cleanValues = categories.map((_, idx) => {
    const v = Number(values[idx] ?? 0);
    return Number.isFinite(v) && v > 0 ? v : 0;
  });
  const total = cleanValues.reduce((sum, v) => sum + v, 0);
  if (total <= 0) return [];

  const nonZeroIndices = cleanValues
    .map((v, idx) => (v > 0 ? idx : -1))
    .filter((idx) => idx >= 0);

  if (nonZeroIndices.length === 1) {
    const idx = nonZeroIndices[0];
    return [
      {
        categoryIndex: idx,
        label: categories[idx] || `Kategori ${idx + 1}`,
        value: cleanValues[idx],
        percentage: 100,
        color: CHART_PALETTE[idx % CHART_PALETTE.length],
        path: `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`,
        labelX: cx,
        labelY: cy,
        isFullCircle: true,
      },
    ];
  }

  let currentAngle = -Math.PI / 2;
  const slices: PieSliceGeometry[] = [];

  for (let i = 0; i < categories.length; i++) {
    const val = cleanValues[i];
    if (val <= 0) continue;
    const fraction = val / total;
    const angleSpan = fraction * Math.PI * 2;
    const endAngle = currentAngle + angleSpan;
    const midAngle = currentAngle + angleSpan / 2;

    const x1 = cx + radius * Math.cos(currentAngle);
    const y1 = cy + radius * Math.sin(currentAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = angleSpan > Math.PI ? 1 : 0;

    const path = [
      `M ${cx.toFixed(2)} ${cy.toFixed(2)}`,
      `L ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${radius.toFixed(2)} ${radius.toFixed(2)} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      'Z',
    ].join(' ');

    const labelRadius = radius * 0.65;
    slices.push({
      categoryIndex: i,
      label: categories[i] || `Kategori ${i + 1}`,
      value: val,
      percentage: fraction * 100,
      color: CHART_PALETTE[i % CHART_PALETTE.length],
      path,
      labelX: cx + labelRadius * Math.cos(midAngle),
      labelY: cy + labelRadius * Math.sin(midAngle),
      isFullCircle: false,
    });

    currentAngle = endAngle;
  }

  return slices;
}

export interface SunburstArcGeometry {
  ring: 0 | 1;
  categoryIndex: number;
  seriesIndex?: number;
  categoryLabel: string;
  seriesLabel: string;
  value: number;
  percentage: number;
  color: string;
  opacity: number;
  path: string;
  isFullRing: boolean;
}

function describeDonutArc(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  startAngle: number,
  endAngle: number
): string {
  const span = endAngle - startAngle;
  if (span >= Math.PI * 2 - 1e-4) {
    return [
      `M ${cx.toFixed(2)} ${(cy - rOut).toFixed(2)}`,
      `A ${rOut.toFixed(2)} ${rOut.toFixed(2)} 0 1 1 ${cx.toFixed(2)} ${(cy + rOut).toFixed(2)}`,
      `A ${rOut.toFixed(2)} ${rOut.toFixed(2)} 0 1 1 ${cx.toFixed(2)} ${(cy - rOut).toFixed(2)}`,
      'Z',
      `M ${cx.toFixed(2)} ${(cy - rIn).toFixed(2)}`,
      `A ${rIn.toFixed(2)} ${rIn.toFixed(2)} 0 1 0 ${cx.toFixed(2)} ${(cy + rIn).toFixed(2)}`,
      `A ${rIn.toFixed(2)} ${rIn.toFixed(2)} 0 1 0 ${cx.toFixed(2)} ${(cy - rIn).toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  const x1Out = cx + rOut * Math.cos(startAngle);
  const y1Out = cy + rOut * Math.sin(startAngle);
  const x2Out = cx + rOut * Math.cos(endAngle);
  const y2Out = cy + rOut * Math.sin(endAngle);
  const x2In = cx + rIn * Math.cos(endAngle);
  const y2In = cy + rIn * Math.sin(endAngle);
  const x1In = cx + rIn * Math.cos(startAngle);
  const y1In = cy + rIn * Math.sin(startAngle);
  const largeArc = span > Math.PI ? 1 : 0;

  return [
    `M ${x1Out.toFixed(2)} ${y1Out.toFixed(2)}`,
    `A ${rOut.toFixed(2)} ${rOut.toFixed(2)} 0 ${largeArc} 1 ${x2Out.toFixed(2)} ${y2Out.toFixed(2)}`,
    `L ${x2In.toFixed(2)} ${y2In.toFixed(2)}`,
    `A ${rIn.toFixed(2)} ${rIn.toFixed(2)} 0 ${largeArc} 0 ${x1In.toFixed(2)} ${y1In.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export function computeSunburstArcs(
  categories: string[],
  series: ChartSeries[],
  cx: number,
  cy: number,
  innerR: number,
  outerR: number
): SunburstArcGeometry[] {
  const safeSeries =
    series.length > 0
      ? series
      : [{ id: 's1', name: 'Nilai', values: categories.map(() => 0) }];

  const catTotals = categories.map((_, cIdx) =>
    safeSeries.reduce((sum, s) => {
      const v = Number(s.values[cIdx] ?? 0);
      return sum + (Number.isFinite(v) && v > 0 ? v : 0);
    }, 0)
  );
  const grandTotal = catTotals.reduce((sum, v) => sum + v, 0);
  if (grandTotal <= 0) return [];

  const hasMultiSeries = safeSeries.length > 1;
  const ring1Outer = hasMultiSeries
    ? innerR + (outerR - innerR) * 0.52
    : outerR;
  const ring2Inner = ring1Outer + 2;

  const arcs: SunburstArcGeometry[] = [];
  let angle = -Math.PI / 2;

  for (let cIdx = 0; cIdx < categories.length; cIdx++) {
    const catTotal = catTotals[cIdx];
    if (catTotal <= 0) continue;

    const fraction = catTotal / grandTotal;
    const catSpan = fraction * Math.PI * 2;
    const catEnd = angle + catSpan;
    const catLabel = categories[cIdx] || `Kategori ${cIdx + 1}`;
    const color = CHART_PALETTE[cIdx % CHART_PALETTE.length];
    const isFull = catSpan >= Math.PI * 2 - 1e-4;

    arcs.push({
      ring: 0,
      categoryIndex: cIdx,
      seriesIndex: hasMultiSeries ? undefined : 0,
      categoryLabel: catLabel,
      seriesLabel: hasMultiSeries
        ? 'Total'
        : safeSeries[0]?.name?.trim() || 'Nilai',
      value: catTotal,
      percentage: fraction * 100,
      color,
      opacity: 0.96,
      path: describeDonutArc(cx, cy, innerR, ring1Outer, angle, catEnd),
      isFullRing: isFull,
    });

    if (hasMultiSeries) {
      let subAngle = angle;
      for (let sIdx = 0; sIdx < safeSeries.length; sIdx++) {
        const raw = Number(safeSeries[sIdx]?.values[cIdx] ?? 0);
        const val = Number.isFinite(raw) && raw > 0 ? raw : 0;
        if (val <= 0) continue;

        const subSpan = (val / catTotal) * catSpan;
        const subEnd = subAngle + subSpan;
        const opacitySchedule = [0.78, 0.58, 0.9, 0.46];
        arcs.push({
          ring: 1,
          categoryIndex: cIdx,
          seriesIndex: sIdx,
          categoryLabel: catLabel,
          seriesLabel: safeSeries[sIdx]?.name?.trim() || `Seri ${sIdx + 1}`,
          value: val,
          percentage: (val / grandTotal) * 100,
          color,
          opacity: opacitySchedule[sIdx % opacitySchedule.length],
          path: describeDonutArc(cx, cy, ring2Inner, outerR, subAngle, subEnd),
          isFullRing: subSpan >= Math.PI * 2 - 1e-4,
        });
        subAngle = subEnd;
      }
    }

    angle = catEnd;
  }

  return arcs;
}

export function truncateChartLabel(text: string, maxLen: number): string {
  const clean = text.trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, Math.max(1, maxLen - 1))}…`;
}

export function isChartZoomExemptTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') {
    return false;
  }
  return Boolean(
    (target as Element).closest(
      '[data-chart-element="true"], button, a, input, select, textarea'
    )
  );
}

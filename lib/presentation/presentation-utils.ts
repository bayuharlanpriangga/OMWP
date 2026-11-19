import type {
  Block,
  BoxBlock,
  ChartBlock,
  ChartType,
  ConclusionBlock,
  DropdownBlock,
  ImageBlock,
  TableBlock,
  TextAlign,
  TextBlock,
  TextSize,
  TitleBlock,
} from '../deck-types';

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function createTextBlock(
  text = '',
  size: TextSize = 'm',
  align: TextAlign = 'l',
  b = false,
  i = false,
  u = false
): TextBlock {
  return {
    id: uid(),
    t: 'text',
    text,
    size,
    align,
    w: 12,
    b,
    ...(i ? { i: true } : {}),
    ...(u ? { u: true } : {}),
  };
}

export function walkBlocks(blocks: Block[], fn: (b: Block) => void): void {
  for (const b of blocks) {
    fn(b);
    if (b.t === 'box' && Array.isArray(b.children)) {
      walkBlocks(b.children, fn);
    }
  }
}

export function flattenBlocks(blocks: Block[]): Block[] {
  const result: Block[] = [];
  walkBlocks(blocks, (b) => result.push(b));
  return result;
}

const VALID_CHART_TYPES = new Set<ChartType>([
  'column',
  'pie',
  'line',
  'bar',
  'sunburst',
]);

export function normalizeBlocks(blocks: Block[]): Block[] {
  return blocks.map((raw) => {
    const id = raw.id || uid();
    const w = clamp(Number(raw.w) || 12, 1, 12);
    const hasCoords = raw.y != null;
    const coords = hasCoords
      ? { x: Number(raw.x) || 0, y: Number(raw.y) || 0 }
      : {};

    if (raw.t === 'text') {
      const tb: TextBlock = {
        id,
        t: 'text',
        text: raw.text ?? '',
        size: raw.size || 'm',
        align: raw.align || 'l',
        b: Boolean(raw.b),
        ...(raw.i ? { i: true } : {}),
        ...(raw.u ? { u: true } : {}),
        w,
        ...coords,
      };
      return tb;
    }
    if (raw.t === 'title') {
      const ttl: TitleBlock = {
        id,
        t: 'title',
        text: raw.text ?? '',
        w,
        ...(raw.align ? { align: raw.align } : {}),
        ...coords,
      };
      return ttl;
    }
    if (raw.t === 'dd') {
      const db: DropdownBlock = {
        id,
        t: 'dd',
        ...(raw.badge !== undefined ? { badge: String(raw.badge) } : {}),
        text: raw.text ?? '',
        detail: raw.detail ?? '',
        align: raw.align,
        w,
        ...coords,
      };
      return db;
    }
    if (raw.t === 'img') {
      const ib: ImageBlock = {
        id,
        t: 'img',
        src: raw.src ?? '',
        alt: raw.alt ?? '',
        w,
        ...coords,
      };
      return ib;
    }
    if (raw.t === 'box') {
      const box: BoxBlock = {
        id,
        t: 'box',
        title: raw.title ?? '',
        children: normalizeBlocks(Array.isArray(raw.children) ? raw.children : []),
        w,
        ...coords,
      };
      return box;
    }
    if (raw.t === 'table') {
      const rawHeaders = Array.isArray(raw.headers)
        ? raw.headers.map((h) => String(h ?? ''))
        : [];
      const colCount = Math.max(1, rawHeaders.length);
      const headers =
        rawHeaders.length > 0 ? rawHeaders : ['Kolom 1'];
      const rawRows = Array.isArray(raw.rows) ? raw.rows : [];
      const rows =
        rawRows.length > 0
          ? rawRows.map((row) => {
              const cells = Array.isArray(row) ? row : [];
              return Array.from({ length: colCount }, (_, idx) =>
                String(cells[idx] ?? '')
              );
            })
          : [Array.from({ length: colCount }, () => '')];
      const rawColWidths = Array.isArray(raw.colWidths)
        ? raw.colWidths
        : undefined;
      const colWidths =
        rawColWidths && rawColWidths.length > 0
          ? Array.from({ length: colCount }, (_, idx) => {
              const v = Number(rawColWidths[idx]);
              return Number.isFinite(v) && v > 0
                ? clamp(Number(v.toFixed(2)), 1, 100)
                : Number((100 / colCount).toFixed(1));
            })
          : undefined;
      const tb: TableBlock = {
        id,
        t: 'table',
        headers,
        rows,
        ...(colWidths ? { colWidths } : {}),
        w,
        ...coords,
      };
      return tb;
    }
    if (raw.t === 'chart') {
      const chartType: ChartType = VALID_CHART_TYPES.has(raw.chartType)
        ? raw.chartType
        : 'column';
      const rawCategories = Array.isArray(raw.categories)
        ? raw.categories.map((c) => String(c ?? ''))
        : [];
      const categories =
        rawCategories.length > 0 ? rawCategories : ['Kategori 1'];
      const catCount = categories.length;
      const rawSeries = Array.isArray(raw.series) ? raw.series : [];
      const series =
        rawSeries.length > 0
          ? rawSeries.map((s, sIdx) => {
              const rawVals = Array.isArray(s?.values) ? s.values : [];
              return {
                id: s?.id ? String(s.id) : uid(),
                name:
                  s?.name !== undefined ? String(s.name) : `Seri ${sIdx + 1}`,
                values: Array.from({ length: catCount }, (_, cIdx) => {
                  const num = Number(rawVals[cIdx]);
                  return Number.isFinite(num) ? num : 0;
                }),
              };
            })
          : [
              {
                id: uid(),
                name: 'Seri 1',
                values: Array.from({ length: catCount }, () => 0),
              },
            ];
      const cb: ChartBlock = {
        id,
        t: 'chart',
        chartType,
        ...(raw.title !== undefined ? { title: String(raw.title) } : {}),
        categories,
        series,
        w,
        ...coords,
      };
      return cb;
    }
    const cb: ConclusionBlock = {
      id,
      t: 'concl',
      label: raw.label ?? '★ Kesimpulan',
      text: raw.text ?? '',
      align: raw.align,
      w,
      ...coords,
    };
    return cb;
  });
}

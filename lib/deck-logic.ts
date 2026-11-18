import type {
  Block,
  BoxBlock,
  ConclusionBlock,
  Deck,
  DropdownBlock,
  ImageBlock,
  LegacyDeck,
  Slide,
  SlideModal,
  TableBlock,
  TextAlign,
  TextBlock,
  TextSize,
  ThemeId,
  TitleBlock,
} from './deck-types';

import { THEME_META } from './theme/theme-data';

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function stripMarkup(text: string | null | undefined): string {
  return String(text || '')
    .replace(/\[{2,3}|\]{2,3}/g, '')
    .replace(/\*\*|\{\/?(?:s|m|l|xl)\}/g, '');
}

export function createTextBlock(
  text = '',
  size: TextSize = 'm',
  align: TextAlign = 'l',
  b = false
): TextBlock {
  return { id: uid(), t: 'text', text, size, align, w: 12, b };
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
      const tb: TableBlock = {
        id,
        t: 'table',
        headers,
        rows,
        w,
        ...coords,
      };
      return tb;
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

export interface TableColumnLayout {
  widths: number[];
  mode: 'symmetric' | 'adaptive';
  colMaxLens: number[];
  threshold: number;
}

/**
 * Computes responsive percentage widths for table columns based on their text length.
 * - If every column fits within its fair equal-division character budget, columns are
 *   distributed symmetrically (equal widths).
 * - If any column exceeds the fair budget (e.g. "Keterangan" with long text vs "Nama"),
 *   short columns shrink neatly to fit their longest text + cell padding while
 *   long-text columns expand proportionally to occupy the remaining width.
 */
export function computeTableColumnWidths(
  headers: string[],
  rows: string[][],
  blockWidth = 12
): TableColumnLayout {
  const colCount = Math.max(1, headers.length);
  if (colCount === 1) {
    const hLen = stripMarkup(headers[0] ?? '').trim().length;
    const maxCell = rows.reduce(
      (m, r) => Math.max(m, stripMarkup(r?.[0] ?? '').trim().length),
      0
    );
    return {
      widths: [100],
      mode: 'symmetric',
      colMaxLens: [Math.max(hLen, maxCell)],
      threshold: 64,
    };
  }

  const maxLineLen = (raw: string | null | undefined): number => {
    const clean = stripMarkup(raw ?? '').trim();
    if (!clean) return 0;
    return clean
      .split(/\n/)
      .reduce((m, line) => Math.max(m, line.trim().length), 0);
  };

  const colMaxLens = Array.from({ length: colCount }, (_, colIdx) => {
    let maxLen = maxLineLen(headers[colIdx]);
    for (const row of rows) {
      maxLen = Math.max(maxLen, maxLineLen(row?.[colIdx]));
    }
    return maxLen;
  });

  const widthFactor = clamp(blockWidth || 12, 3, 12) / 12;
  const totalCapacityChars = Math.max(24, Math.round(64 * widthFactor));
  const threshold = Math.max(10, Math.round(totalCapacityChars / colCount));

  const anyOverflow = colMaxLens.some((len) => len > threshold);
  if (!anyOverflow) {
    const base = Math.floor((10000 / colCount)) / 100;
    const widths = Array.from({ length: colCount }, () => base);
    const diff = Number((100 - widths.reduce((a, b) => a + b, 0)).toFixed(2));
    widths[colCount - 1] = Number((widths[colCount - 1] + diff).toFixed(2));
    return {
      widths,
      mode: 'symmetric',
      colMaxLens,
      threshold,
    };
  }

  const refChars = Math.max(36, 84 * widthFactor);
  const equalPct = 100 / colCount;
  const minColPct = clamp(Number((28 / colCount).toFixed(2)), 7, 10.5);

  const widths = new Array<number>(colCount).fill(0);
  const shortCols: number[] = [];
  const longCols: number[] = [];

  colMaxLens.forEach((len, idx) => {
    if (len <= threshold) shortCols.push(idx);
    else longCols.push(idx);
  });

  let usedShortPct = 0;
  for (const idx of shortCols) {
    // Fit longest line text in column + ~4 chars comfort margin for cell padding
    const neededChars = Math.max(colMaxLens[idx], 2) + 4;
    const fitPct = clamp(
      (neededChars / refChars) * 100,
      minColPct,
      equalPct * 0.92
    );
    widths[idx] = fitPct;
    usedShortPct += fitPct;
  }

  const maxAllowedShortTotal = 100 - longCols.length * minColPct;
  if (usedShortPct > maxAllowedShortTotal && usedShortPct > 0) {
    const scale = maxAllowedShortTotal / usedShortPct;
    usedShortPct = 0;
    for (const idx of shortCols) {
      widths[idx] = Math.max(minColPct, widths[idx] * scale);
      usedShortPct += widths[idx];
    }
  }

  const remainingPct = Math.max(longCols.length * minColPct, 100 - usedShortPct);
  const longWeights = longCols.map((idx) => Math.max(1, Math.pow(colMaxLens[idx], 0.85)));
  const totalLongWeight = longWeights.reduce((a, b) => a + b, 0) || 1;

  longCols.forEach((colIdx, pos) => {
    widths[colIdx] = (longWeights[pos] / totalLongWeight) * remainingPct;
  });

  // Normalize precisely to 100.00
  const rounded = widths.map((v) => Number(v.toFixed(2)));
  const sum = rounded.reduce((a, b) => a + b, 0);
  const residual = Number((100 - sum).toFixed(2));
  const adjustIdx = longCols[longCols.length - 1] ?? colCount - 1;
  rounded[adjustIdx] = Number((rounded[adjustIdx] + residual).toFixed(2));

  return {
    widths: rounded,
    mode: 'adaptive',
    colMaxLens,
    threshold,
  };
}

export function scanModalTitles(slide: Slide): string[] {
  const out: string[] = [];
  const collectFromString = (str: string | null | undefined) => {
    String(str || '').replace(/\[\[\[(.*?)\]\]\]/g, (match, inner) => {
      const clean = String(inner).trim();
      if (!out.includes(clean)) {
        out.push(clean);
      }
      return match;
    });
  };
  walkBlocks(slide.blocks, (b) => {
    if (b.t === 'text' || b.t === 'concl' || b.t === 'title') {
      collectFromString(b.text);
    } else if (b.t === 'dd') {
      collectFromString(b.detail);
    } else if (b.t === 'box') {
      collectFromString(b.title);
    } else if (b.t === 'table') {
      b.headers.forEach(collectFromString);
      b.rows.forEach((row) => row.forEach(collectFromString));
    }
  });
  return out;
}

export function syncSlideModals(slide: Slide): Slide {
  const want = scanModalTitles(slide);
  const old = Array.isArray(slide.modals) ? slide.modals : [];
  const mold: Record<string, SlideModal> = { ...(slide.mold || {}) };
  const used = new Set<SlideModal>();

  for (const title of want) {
    const exact = old.find((m) => m.title === title);
    if (exact) used.add(exact);
  }

  const nextModals: SlideModal[] = want.map((title, idx) => {
    let match = old.find((m) => m.title === title);
    if (!match) {
      const positional = old[idx];
      if (positional && !used.has(positional)) {
        match = { ...positional, title };
      } else if (mold[title]) {
        match = mold[title];
        delete mold[title];
      } else {
        match = { id: uid(), title, children: [] };
      }
      used.add(match);
    }
    return {
      ...match,
      id: match.id || uid(),
      children: normalizeBlocks(match.children || []),
    };
  });

  for (const m of old) {
    if (!nextModals.some((x) => x.id === m.id) && m.children.length > 0) {
      mold[m.title] = m;
    }
  }

  const nextSlide: Slide = {
    ...slide,
    modals: nextModals,
  };
  if (Object.keys(mold).length > 0) {
    nextSlide.mold = mold;
  } else {
    delete nextSlide.mold;
  }
  return nextSlide;
}

export function migrateLegacyDeck(raw: LegacyDeck | Deck, includeCover = false): Deck {
  if ('v' in raw && raw.v === 2 && Array.isArray(raw.slides)) {
    return raw as Deck;
  }
  const legacy = raw as LegacyDeck;
  const title = legacy.title || 'Presentasi';
  const slides: Slide[] = [];
  const oldSlides = Array.isArray(legacy.slides) ? legacy.slides : [];

  if (includeCover) {
    slides.push({
      id: uid(),
      name: 'Cover',
      bg: '',
      vc: true,
      blocks: [
        createTextBlock(title, 'xxl', 'c', true),
        createTextBlock('Tekan ▶ atau geser untuk mulai', 'm', 'c', false),
      ],
    });
  }

  for (const s of oldSlides) {
    const blocks: Block[] = [createTextBlock(s.title || '', 'xl', 'l', true)];
    for (const p of s.points || []) {
      blocks.push({
        id: uid(),
        t: 'dd',
        text: p.text || '',
        detail: p.detail || '',
        w: 4,
      });
    }
    if ((s.conclusion || '').trim()) {
      blocks.push({
        id: uid(),
        t: 'concl',
        label: '★ Kesimpulan',
        text: s.conclusion || '',
        w: 12,
      });
    }
    slides.push({
      id: uid(),
      name: stripMarkup(s.title || ''),
      bg: '',
      vc: false,
      blocks,
    });
  }

  const withConcl = oldSlides.filter((s) => (s.conclusion || '').trim());
  const finalConcl = (legacy.conclusion || '').trim();
  if (finalConcl || withConcl.length > 0) {
    const blocks: Block[] = [createTextBlock('Kesimpulan', 'xl', 'l', true)];
    for (const s of withConcl) {
      blocks.push({
        id: uid(),
        t: 'dd',
        text: s.title || '',
        detail: s.conclusion || '',
        w: 4,
      });
    }
    if (finalConcl) {
      blocks.push({
        id: uid(),
        t: 'concl',
        label: '★ Kesimpulan akhir',
        text: finalConcl,
        w: 12,
      });
    }
    slides.push({
      id: uid(),
      name: 'Kesimpulan',
      bg: '',
      vc: false,
      blocks,
    });
  }

  return {
    v: 2,
    title,
    theme: legacy.theme && THEME_META[legacy.theme] ? legacy.theme : 'default',
    slides,
  };
}

export function loadAndNormalizeDeck(
  input: unknown,
  includeCover = false
): Deck | null {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as LegacyDeck | Deck;
  if (!Array.isArray(candidate.slides) || candidate.slides.length === 0) {
    return null;
  }
  const migrated = migrateLegacyDeck(candidate, includeCover);
  const theme: ThemeId = THEME_META[migrated.theme] ? migrated.theme : 'default';
  const slides = migrated.slides.map((s) => {
    const normalized: Slide = {
      ...s,
      id: s.id || uid(),
      name: s.name || '',
      ...(typeof s.headerTitle === 'string' ? { headerTitle: s.headerTitle } : {}),
      blocks: normalizeBlocks(Array.isArray(s.blocks) ? s.blocks : []),
      modals: (Array.isArray(s.modals) ? s.modals : []).map((m) => ({
        id: m.id || uid(),
        title: m.title || '',
        children: normalizeBlocks(Array.isArray(m.children) ? m.children : []),
      })),
    };
    if (s.mold) {
      const normalizedMold: Record<string, SlideModal> = {};
      for (const [k, m] of Object.entries(s.mold)) {
        normalizedMold[k] = {
          id: m.id || uid(),
          title: m.title || k,
          children: normalizeBlocks(Array.isArray(m.children) ? m.children : []),
        };
      }
      normalized.mold = normalizedMold;
    }
    return syncSlideModals(normalized);
  });

  if (slides.length === 0) return null;
  return {
    v: 2,
    title: typeof migrated.title === 'string' ? migrated.title : '',
    theme,
    slides,
  };
}

export function getSlideHeaderTitle(deck: Deck, slide: Slide): string {
  if (typeof slide.headerTitle === 'string') {
    return slide.headerTitle;
  }
  return deck.title || '';
}

export function getDeckDisplayTitle(deck: Deck): string {
  const direct = (deck.title || '').trim();
  if (direct) return direct;
  for (const s of deck.slides) {
    const h = (s.headerTitle || '').trim();
    if (h) return h;
  }
  return '';
}

export function createDefaultDeck(): Deck {
  return {
    v: 2,
    title: '',
    theme: 'default',
    slides: [
      {
        id: 'slide-1',
        name: '',
        headerTitle: '',
        bg: '',
        vc: false,
        blocks: [],
        modals: [],
      },
    ],
  };
}

export function getSlideTitle(slide: Slide): string {
  const trimmedName = (slide.name || '').trim();
  const isGenericName = /^Slide\s+\d+$/i.test(trimmedName);
  if (trimmedName && !isGenericName) return trimmedName;

  const flat = flattenBlocks(slide.blocks);
  const firstText = flat.find(
    (b): b is TextBlock => b.t === 'text' && stripMarkup(b.text).trim().length > 0
  );
  if (firstText) {
    return stripMarkup(firstText.text).split('\n')[0].trim().slice(0, 80);
  }
  const firstBox = flat.find(
    (b): b is BoxBlock => b.t === 'box' && stripMarkup(b.title).trim().length > 0
  );
  if (firstBox) return stripMarkup(firstBox.title).trim().slice(0, 80);

  const firstTitle = flat.find(
    (b): b is TitleBlock => b.t === 'title' && stripMarkup(b.text).trim().length > 0
  );
  if (firstTitle) return stripMarkup(firstTitle.text).trim().slice(0, 80);

  const firstDd = flat.find(
    (b): b is DropdownBlock => b.t === 'dd' && stripMarkup(b.text).trim().length > 0
  );
  if (firstDd) return stripMarkup(firstDd.text).trim().slice(0, 80);

  const firstConcl = flat.find(
    (b): b is ConclusionBlock => b.t === 'concl' && stripMarkup(b.text).trim().length > 0
  );
  if (firstConcl) return stripMarkup(firstConcl.text).split('\n')[0].trim().slice(0, 80);

  const firstTable = flat.find(
    (b): b is TableBlock => b.t === 'table' && b.headers.some((h) => stripMarkup(h).trim().length > 0)
  );
  if (firstTable) {
    return firstTable.headers
      .map((h) => stripMarkup(h).trim())
      .filter(Boolean)
      .join(' · ')
      .slice(0, 80);
  }

  const headerFallback = (slide.headerTitle || '').trim();
  if (headerFallback) return headerFallback.slice(0, 80);

  return trimmedName || 'Slide';
}

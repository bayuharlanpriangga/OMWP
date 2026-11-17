import type {
  Block,
  BoxBlock,
  ConclusionBlock,
  Deck,
  DropdownBlock,
  ImageBlock,
  InlineToken,
  LegacyDeck,
  Slide,
  SlideAiContext,
  SlideModal,
  TableBlock,
  TextAlign,
  TextBlock,
  TextSize,
  ThemeId,
} from './deck-types';

export const THEME_META: Record<ThemeId, { name: string; description: string }> = {
  default: {
    name: 'Default',
    description:
      'Identitas Orias (Perak–Emas): latar perak tenang, tinta kontras tinggi, geometri facet presisi, dan satu aksen emas datar.',
  },
  brutal: {
    name: 'Brutalis',
    description: 'Tebal, warna cerah, garis hitam, bayangan keras, animasi membal.',
  },
  auditor: {
    name: 'Auditor',
    description:
      'Formal dan tenang: navy dan emas, huruf serif, garis tipis, animasi halus untuk presentasi audit dan laporan.',
  },
};

export const BLOCK_NAMES: Record<Block['t'], string> = {
  text: 'Teks',
  img: 'Gambar',
  dd: 'Dropdown',
  box: 'Container',
  concl: 'Kesimpulan',
  table: 'Tabel',
};

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

export function createBlock(type: Block['t']): Block {
  switch (type) {
    case 'img':
      return { id: uid(), t: 'img', src: '', alt: '', w: 6 };
    case 'text':
      return createTextBlock('', 'm', 'l', false);
    case 'dd':
      return { id: uid(), t: 'dd', text: '', detail: '', w: 4 };
    case 'box':
      return { id: uid(), t: 'box', title: '', children: [], w: 12 };
    case 'concl':
      return { id: uid(), t: 'concl', label: '★ Kesimpulan', text: '', w: 12 };
    case 'table':
      return {
        id: uid(),
        t: 'table',
        headers: ['Nama', 'Keterangan'],
        rows: [
          ['', ''],
          ['', ''],
        ],
        w: 12,
      };
  }
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
    if (b.t === 'text' || b.t === 'concl') {
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

export function createDefaultDeck(): Deck {
  return {
    v: 2,
    title: '',
    theme: 'default',
    slides: [
      {
        id: 'slide-1',
        name: '',
        bg: '',
        vc: false,
        blocks: [],
        modals: [],
      },
    ],
  };
}

function describeBlockLines(blocks: Block[], scope?: string): string[] {
  const lines: string[] = [];
  let ddIndex = 0;
  for (const b of blocks) {
    if (b.t === 'text') {
      const clean = stripMarkup(b.text).replace(/\s*\n+\s*/g, ' ').trim();
      if (clean) lines.push(scope ? `[${scope}] ${clean}` : clean);
    } else if (b.t === 'box') {
      const boxTitle = stripMarkup(b.title).trim();
      const nextScope = boxTitle
        ? scope
          ? `${scope} > Kartu "${boxTitle}"`
          : `Kartu "${boxTitle}"`
        : scope || 'Kartu';
      if (boxTitle) lines.push(`[${nextScope}]`);
      lines.push(...describeBlockLines(b.children, nextScope));
    } else if (b.t === 'dd') {
      ddIndex++;
      const label = b.badge?.trim() || String(ddIndex);
      const title = stripMarkup(b.text).trim();
      const detail = stripMarkup(b.detail).replace(/\s*\n+\s*/g, ' ').trim();
      const entry = [
        `Poin ${label}${title ? `: ${title}` : ''}`,
        detail ? `— ${detail}` : '',
      ]
        .filter(Boolean)
        .join(' ');
      if (entry) lines.push(scope ? `[${scope}] ${entry}` : entry);
    } else if (b.t === 'concl') {
      const label = stripMarkup(b.label || 'Kesimpulan').trim();
      const text = stripMarkup(b.text).replace(/\s*\n+\s*/g, ' ').trim();
      if (text) {
        lines.push(scope ? `[${scope} > ${label}] ${text}` : `[${label}] ${text}`);
      }
    } else if (b.t === 'img') {
      const alt = b.alt?.trim();
      if (alt) lines.push(`[Gambar: ${alt}]`);
    } else if (b.t === 'table') {
      const headerLine = b.headers
        .map((h) => stripMarkup(h).replace(/\s*\n+\s*/g, ' ').trim())
        .filter(Boolean)
        .join(' | ');
      const rowSummaries = b.rows
        .map((r) =>
          r
            .map((cell) => stripMarkup(cell).replace(/\s*\n+\s*/g, ' ').trim())
            .join(' | ')
        )
        .filter((line) => line.replace(/\|/g, '').trim().length > 0);
      const tableText = [
        headerLine ? `Header: ${headerLine}` : '',
        ...rowSummaries.slice(0, 8),
      ]
        .filter(Boolean)
        .join(' ; ');
      if (tableText) {
        lines.push(scope ? `[${scope} > Tabel] ${tableText}` : `[Tabel] ${tableText}`);
      }
    }
  }
  return lines;
}

function findSurroundingContextForTerm(slide: Slide, term: string): string {
  const needle = stripMarkup(term).trim().toLowerCase();
  if (!needle) return '';

  const matches = (raw: string): boolean => {
    const clean = stripMarkup(raw).toLowerCase();
    return clean.includes(needle);
  };

  const scanBlocks = (blocks: Block[], containerLabel?: string): string => {
    for (const b of blocks) {
      if (b.t === 'text' && matches(b.text)) {
        const clean = stripMarkup(b.text).replace(/\s*\n+\s*/g, ' ').trim();
        return containerLabel ? `${containerLabel}: "${clean}"` : `"${clean}"`;
      }
      if (b.t === 'dd' && (matches(b.text) || matches(b.detail))) {
        const title = stripMarkup(b.text).trim();
        const detail = stripMarkup(b.detail).replace(/\s*\n+\s*/g, ' ').trim();
        const prefix = containerLabel
          ? `${containerLabel} > Poin "${title}"`
          : `Poin "${title}"`;
        return detail ? `${prefix}: "${detail}"` : prefix;
      }
      if (b.t === 'concl' && (matches(b.label) || matches(b.text))) {
        const label = stripMarkup(b.label || 'Kesimpulan').trim();
        const text = stripMarkup(b.text).replace(/\s*\n+\s*/g, ' ').trim();
        return `${label}: "${text}"`;
      }
      if (b.t === 'img' && b.alt && matches(b.alt)) {
        return `Keterangan gambar: "${b.alt.trim()}"`;
      }
      if (b.t === 'table') {
        const headerHit = b.headers.some((h) => matches(h));
        const matchedRow = b.rows.find((row) => row.some((cell) => matches(cell)));
        if (headerHit || matchedRow) {
          const cols = b.headers.map((h, i) => {
            const hk = stripMarkup(h).trim() || `Kolom ${i + 1}`;
            const cv = matchedRow ? stripMarkup(matchedRow[i] || '').replace(/\s*\n+\s*/g, ' ').trim() : '';
            return cv ? `${hk}: ${cv}` : hk;
          });
          const prefix = containerLabel ? `${containerLabel} > Tabel` : 'Tabel';
          return `${prefix} (${cols.join(' | ')})`;
        }
      }
      if (b.t === 'box') {
        const boxTitle = stripMarkup(b.title).trim();
        const nextLabel = boxTitle
          ? containerLabel
            ? `${containerLabel} > Kartu "${boxTitle}"`
            : `Kartu "${boxTitle}"`
          : containerLabel;
        const childHit = scanBlocks(b.children, nextLabel);
        if (childHit) return childHit;
        if (boxTitle && matches(b.title)) {
          const preview = describeBlockLines(b.children).slice(0, 3).join(' | ');
          return preview
            ? `Kartu "${boxTitle}": ${preview}`
            : `Judul kartu: "${boxTitle}"`;
        }
      }
    }
    return '';
  };

  const direct = scanBlocks(slide.blocks);
  if (direct) return direct;

  for (const m of slide.modals || []) {
    const modalLabel = `Popup Modal "${stripMarkup(m.title).trim()}"`;
    const inModal = scanBlocks(m.children, modalLabel);
    if (inModal) return inModal;
    if (matches(m.title)) {
      const preview = describeBlockLines(m.children).slice(0, 3).join(' | ');
      return preview ? `${modalLabel}: ${preview}` : modalLabel;
    }
  }

  return '';
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

  return trimmedName || 'Slide';
}

export function buildSlideAiContext(
  deck: Deck,
  slide: Slide,
  clickedTerm?: string
): SlideAiContext {
  const flat = flattenBlocks(slide.blocks);
  const pointsText = flat
    .filter((b): b is DropdownBlock => b.t === 'dd')
    .map((b) => {
      const title = stripMarkup(b.text).trim();
      const detail = stripMarkup(b.detail).replace(/\s*\n+\s*/g, ' ').trim();
      return detail ? `${title}: ${detail}` : title;
    })
    .filter(Boolean)
    .join('; ')
    .slice(0, 1200);

  const outlineLines = describeBlockLines(slide.blocks);
  for (const m of slide.modals || []) {
    const mTitle = stripMarkup(m.title).trim();
    const mLines = describeBlockLines(m.children, `Modal "${mTitle || 'Detail'}"`);
    if (mLines.length > 0) {
      outlineLines.push(...mLines);
    } else if (mTitle) {
      outlineLines.push(`[Modal "${mTitle}"]`);
    }
  }

  const slideContentOutline = outlineLines.join('\n').slice(0, 2600);
  const slideText = outlineLines.join(' / ').slice(0, 2200);

  const activeIndex = deck.slides.findIndex((s) => s.id === slide.id);
  const deckOverview = deck.slides
    .map((s, idx) => {
      const title = getSlideTitle(s);
      const snippet = describeBlockLines(s.blocks)
        .join(' • ')
        .slice(0, 180);
      const marker = idx === activeIndex ? ' [AKTIF]' : '';
      return snippet && snippet !== title
        ? `Slide ${idx + 1}${marker}: ${title} — ${snippet}`
        : `Slide ${idx + 1}${marker}: ${title}`;
    })
    .join('\n')
    .slice(0, 1800);

  const cleanClickedTerm = clickedTerm ? stripMarkup(clickedTerm).trim() : '';
  const surroundingContext = cleanClickedTerm
    ? findSurroundingContextForTerm(slide, cleanClickedTerm).slice(0, 600)
    : '';

  return {
    deckTitle: deck.title || 'Presentasi',
    slideTitle: getSlideTitle(slide),
    slideNumber: activeIndex >= 0 ? activeIndex + 1 : 1,
    totalSlides: deck.slides.length,
    slideText,
    pointsText,
    slideContentOutline,
    deckOverview,
    clickedTerm: cleanClickedTerm || undefined,
    surroundingContext: surroundingContext || undefined,
  };
}

export function findBlockInSlide(
  slide: Slide,
  id: string
): { parentKind: 'slide' | 'box' | 'modal'; parentId: string; index: number; block: Block } | null {
  for (let i = 0; i < slide.blocks.length; i++) {
    const b = slide.blocks[i];
    if (b.id === id) {
      return { parentKind: 'slide', parentId: slide.id, index: i, block: b };
    }
    if (b.t === 'box') {
      const found = findInChildren(b.children, id, 'box', b.id);
      if (found) return found;
    }
  }
  for (const m of slide.modals || []) {
    const found = findInChildren(m.children, id, 'modal', m.id);
    if (found) return found;
  }
  return null;
}

function findInChildren(
  arr: Block[],
  id: string,
  parentKind: 'box' | 'modal',
  parentId: string
): { parentKind: 'slide' | 'box' | 'modal'; parentId: string; index: number; block: Block } | null {
  for (let i = 0; i < arr.length; i++) {
    const b = arr[i];
    if (b.id === id) return { parentKind, parentId, index: i, block: b };
    if (b.t === 'box') {
      const nested = findInChildren(b.children, id, 'box', b.id);
      if (nested) return nested;
    }
  }
  return null;
}

export function mapSlideBlocks(
  slide: Slide,
  fn: (list: Block[], ownerId: string) => Block[]
): Slide {
  const walkList = (list: Block[], ownerId: string): Block[] => {
    const mapped = list.map((b) =>
      b.t === 'box' ? { ...b, children: walkList(b.children, b.id) } : b
    );
    return fn(mapped, ownerId);
  };
  const nextBlocks = walkList(slide.blocks, slide.id);
  const nextModals = (slide.modals || []).map((m) => ({
    ...m,
    children: walkList(m.children, m.id),
  }));
  return syncSlideModals({
    ...slide,
    blocks: nextBlocks,
    modals: nextModals,
  });
}

export function updateBlockInSlide(
  slide: Slide,
  blockId: string,
  updater: (b: Block) => Block
): Slide {
  return mapSlideBlocks(slide, (list) =>
    list.map((b) => (b.id === blockId ? updater(b) : b))
  );
}

export function deleteBlockInSlide(slide: Slide, blockId: string): Slide {
  return mapSlideBlocks(slide, (list) => list.filter((b) => b.id !== blockId));
}

export function addBlockToSlide(
  slide: Slide,
  block: Block,
  targetOwnerId?: string
): Slide {
  const target = targetOwnerId || slide.id;
  return mapSlideBlocks(slide, (list, ownerId) =>
    ownerId === target ? [...list, block] : list
  );
}

export function moveBlockInParent(
  slide: Slide,
  blockId: string,
  delta: -1 | 1
): Slide {
  return mapSlideBlocks(slide, (list) => {
    const idx = list.findIndex((b) => b.id === blockId);
    if (idx < 0) return list;
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= list.length) return list;
    const copy = [...list];
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    return copy;
  });
}

export function reidBlocks(blocks: Block[]): Block[] {
  return blocks.map((b) =>
    b.t === 'box'
      ? { ...b, id: uid(), children: reidBlocks(b.children) }
      : { ...b, id: uid() }
  );
}

export function duplicateSlide(slide: Slide): Slide {
  return syncSlideModals({
    ...slide,
    id: uid(),
    name: (slide.name || 'Slide') + ' (salinan)',
    blocks: reidBlocks(JSON.parse(JSON.stringify(slide.blocks)) as Block[]),
    modals: (slide.modals || []).map((m) => ({
      ...m,
      id: uid(),
      children: reidBlocks(JSON.parse(JSON.stringify(m.children)) as Block[]),
    })),
  });
}

/**
 * Pure parser converting markup (`[[ai]]`, `[[[modal]]]`, `**bold**`, `{s|m|l|xl}...{/s}`, `\n`)
 * into a safe token tree without HTML injection.
 */
export function parseInlineMarkup(input: string): InlineToken[] {
  return parseSegment(String(input || '').replace(/\r\n/g, '\n'));
}

function parseSegment(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let idx = 0;

  const pushText = (chunk: string) => {
    if (!chunk) return;
    const parts = chunk.split('\n');
    parts.forEach((p, i) => {
      if (p) tokens.push({ type: 'text', value: p });
      if (i < parts.length - 1) tokens.push({ type: 'br' });
    });
  };

  while (idx < text.length) {
    // 1. Check [[[modal]]]
    if (text.startsWith('[[[', idx)) {
      const end = text.indexOf(']]]', idx + 3);
      if (end !== -1) {
        tokens.push({
          type: 'modal-trigger',
          title: text.slice(idx + 3, end).trim(),
        });
        idx = end + 3;
        continue;
      }
    }

    // 2. Check [[term]]
    if (text.startsWith('[[', idx)) {
      const end = text.indexOf(']]', idx + 2);
      if (end !== -1 && end > idx + 2) {
        tokens.push({
          type: 'ai-term',
          term: text.slice(idx + 2, end),
        });
        idx = end + 2;
        continue;
      }
    }

    // 3. Check **bold**
    if (text.startsWith('**', idx)) {
      const end = text.indexOf('**', idx + 2);
      if (end !== -1 && end > idx + 2) {
        tokens.push({
          type: 'bold',
          children: parseSegment(text.slice(idx + 2, end)),
        });
        idx = end + 2;
        continue;
      }
    }

    // 4. Check {s|m|l|xl}...{/s}
    const sizeMatch = text.slice(idx).match(/^\{(s|m|l|xl)\}/);
    if (sizeMatch) {
      const tag = sizeMatch[1] as 's' | 'm' | 'l' | 'xl';
      const closeTag = `{/${tag}}`;
      const closeIdx = text.indexOf(closeTag, idx + sizeMatch[0].length);
      if (closeIdx !== -1) {
        tokens.push({
          type: 'size',
          size: tag,
          children: parseSegment(text.slice(idx + sizeMatch[0].length, closeIdx)),
        });
        idx = closeIdx + closeTag.length;
        continue;
      }
    }

    // Advance to next potential token start
    let next = text.length;
    for (const marker of ['[[', '**', '{s}', '{m}', '{l}', '{xl}']) {
      const pos = text.indexOf(marker, idx + 1);
      if (pos !== -1 && pos < next) next = pos;
    }
    pushText(text.slice(idx, next));
    idx = next;
  }

  return tokens;
}

export interface ReflowBoxInput {
  id: string;
  x: number;
  y: number;
  w: number;
  collapsedHeight: number;
  extraExpandedHeight: number;
}

/**
 * Computes top offsets for free-positioned blocks so expanding dropdowns/conclusions
 * push down blocks below them that share horizontal column overlap.
 */
export function computeReflowPositions(
  items: ReflowBoxInput[]
): Record<string, number> {
  const sorted = items
    .map((it) => {
      const x0 = clamp(it.x, 0, 100 - (it.w / 12) * 100);
      const x1 = x0 + (it.w / 12) * 100;
      return {
        ...it,
        x0,
        x1,
        bot: it.y + it.collapsedHeight,
        offset: 0,
      };
    })
    .sort((a, b) => a.y - b.y);

  const result: Record<string, number> = {};
  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    for (let k = 0; k < i; k++) {
      const prev = sorted[k];
      const overlapsX = prev.x0 < curr.x1 - 0.01 && prev.x1 > curr.x0 + 0.01;
      if (overlapsX && curr.y >= prev.bot - 2) {
        curr.offset = Math.max(
          curr.offset,
          prev.offset + prev.extraExpandedHeight
        );
      }
    }
    result[curr.id] = curr.y + curr.offset;
  }
  return result;
}

export function slugifyTitle(title: string): string {
  return (
    (title || 'presentasi')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'presentasi'
  );
}

export interface ExportedByokKey {
  provider: string;
  key: string;
}

/**
 * Generates a self-contained static HTML presentation file for offline use / GitHub Pages.
 * Optionally embeds BYOK API keys when the user explicitly opts in for testing.
 */
export function buildStandaloneHtml(
  deck: Deck,
  exportedKeys?: ExportedByokKey[]
): string {
  const safeJson = JSON.stringify(deck).replace(/</g, '\\u003c');
  const keysList = Array.isArray(exportedKeys) ? exportedKeys : [];
  const safeKeysJson = JSON.stringify(keysList).replace(/</g, '\\u003c');
  const hasByok = keysList.length > 0;
  const safeTitle = (deck.title || 'Presentasi')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const theme: ThemeId =
    deck.theme === 'auditor'
      ? 'auditor'
      : deck.theme === 'brutal'
        ? 'brutal'
        : 'default';

  return `<!doctype html>
<html lang="id" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Lora:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#fff4d6;--fg:#111;--card:#fff;--ln:#111;--acc:#ff6b35;--acc2:#2ec4b6;--acc3:#ffd23f;--mut:#555;--r:10px;--sb-track:rgba(17,17,17,.06);--sb-track-line:rgba(17,17,17,.28);--sb-thumb:#ffd23f;--sb-thumb-hover:#ff6b35;--sb-thumb-border:#111;--sb-radius:6px}
:root[data-theme=default]{--bg:#EEF1F4;--fg:#0D0D0D;--card:#fff;--ln:#4F7A99;--acc:#D4A72C;--acc2:#A9C6DC;--acc3:#EEF1F4;--mut:#4A5663;--r:2px;--sb-track:rgba(79,122,153,.08);--sb-track-line:rgba(79,122,153,.28);--sb-thumb:#4F7A99;--sb-thumb-hover:#D4A72C;--sb-thumb-border:transparent;--sb-radius:2px}
:root[data-theme=auditor]{--bg:#f4f6f9;--fg:#1b2430;--card:#fff;--ln:#14243d;--acc:#b08d3c;--acc2:#14243d;--acc3:#14243d;--mut:#5b6677;--r:6px;--sb-track:rgba(20,36,61,.045);--sb-track-line:rgba(20,36,61,.14);--sb-thumb:rgba(20,36,61,.34);--sb-thumb-hover:#b08d3c;--sb-thumb-border:transparent;--sb-radius:999px}
*{box-sizing:border-box}html,body{margin:0;height:100%;overflow:hidden}
body{background:var(--bg);color:var(--fg);font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:16px;line-height:1.5}
[data-theme=default] body{font-family:'IBM Plex Sans',system-ui,sans-serif;font-variant-numeric:tabular-nums}
[data-theme=auditor] body{font-family:'Plus Jakarta Sans',system-ui,sans-serif}
#app{height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden;position:relative}
header{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:3px solid var(--ln);background:var(--acc3);color:#111;position:relative;z-index:20}
[data-theme=default] header{background:#EEF1F4;color:#0D0D0D;border-bottom:1px solid #4F7A99}
[data-theme=auditor] header{background:#14243d;color:#fff;border-bottom:3px solid #b08d3c}
.brand{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
[data-theme=default] .brand{font-family:'Lora',Georgia,serif;font-weight:600}
.btn{border:3px solid var(--ln);background:var(--card);color:var(--fg);padding:6px 12px;border-radius:var(--r);box-shadow:3px 3px 0 var(--ln);font-weight:600;cursor:pointer}
[data-theme=default] .btn{border:1px solid #4F7A99;border-radius:2px;box-shadow:none;font-weight:500}
[data-theme=auditor] .btn{border:1px solid #c5ccd8;border-radius:6px;box-shadow:0 1px 2px rgba(16,24,40,.08)}
.scroll-area{flex:1 1 0%;min-height:0;overflow-y:auto;overflow-x:hidden;position:relative;z-index:1;display:flex;flex-direction:column}
main{position:relative;z-index:1;flex:1 0 auto;display:flex;flex-direction:column;padding:20px 16px 36px;max-width:1000px;width:100%;margin:0 auto}
.slide{flex:1;min-height:0;display:flex;flex-direction:column;position:relative}
.theme-backdrop{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0}
.theme-backdrop span{position:absolute;display:block}
.theme-backdrop .tb-a{top:76px;right:26px;width:58px;height:58px;background:var(--acc3);border:3px solid var(--ln);box-shadow:5px 5px 0 var(--ln);opacity:.78}
.theme-backdrop .tb-b{top:120px;right:70px;width:24px;height:24px;background:var(--acc2);border:3px solid var(--ln);opacity:.85}
.theme-backdrop .tb-c{bottom:84px;left:28px;width:36px;height:36px;background:var(--acc);border:3px solid var(--ln);transform:rotate(45deg);opacity:.78}
.theme-backdrop .tb-d{bottom:86px;right:28px;width:68px;height:10px;background:var(--ln);opacity:.14}
[data-theme=default] .theme-backdrop .tb-a{top:0;right:0;width:clamp(190px,24vw,370px);height:clamp(190px,24vw,370px);background:#E1E7EE;border:0;box-shadow:none;opacity:1;clip-path:polygon(100% 0,10% 0,100% 90%)}
[data-theme=default] .theme-backdrop .tb-b{top:0;right:0;width:clamp(120px,15vw,235px);height:clamp(120px,15vw,235px);background:#A9C6DC;border:0;opacity:.36;clip-path:polygon(100% 0,28% 0,100% 72%)}
[data-theme=default] .theme-backdrop .tb-c{top:76px;right:26px;bottom:auto;left:auto;width:16px;height:16px;background:#D4A72C;border:0;transform:none;opacity:.92;clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%)}
[data-theme=default] .theme-backdrop .tb-d{bottom:0;left:0;right:auto;width:clamp(160px,20vw,310px);height:clamp(160px,20vw,310px);background:#DFE6EE;opacity:.9;clip-path:polygon(0 100%,0 16%,84% 100%)}
[data-theme=auditor] .theme-backdrop .tb-a{top:0;right:0;width:clamp(190px,24vw,360px);height:clamp(190px,24vw,360px);background:rgba(20,36,61,.045);border:0;box-shadow:none;opacity:1;clip-path:polygon(100% 0,14% 0,100% 86%)}
[data-theme=auditor] .theme-backdrop .tb-b{top:0;right:0;width:clamp(115px,14.5vw,220px);height:clamp(115px,14.5vw,220px);background:rgba(176,141,60,.085);border:0;opacity:1;clip-path:polygon(100% 0,36% 0,100% 64%)}
[data-theme=auditor] .theme-backdrop .tb-c{top:78px;left:26px;bottom:auto;right:auto;width:38px;height:38px;background:transparent;border:0;border-top:2px solid #b08d3c;border-left:2px solid #b08d3c;transform:none;opacity:.55}
[data-theme=auditor] .theme-backdrop .tb-d{bottom:0;left:0;right:auto;width:clamp(150px,20vw,300px);height:clamp(150px,20vw,300px);background:rgba(20,36,61,.038);opacity:1;clip-path:polygon(0 100%,0 18%,82% 100%)}
@media(max-width:639px){.theme-backdrop .tb-a{top:96px;right:-10px;width:30px;height:30px;opacity:.38}.theme-backdrop .tb-b{top:116px;right:12px;width:14px;height:14px;opacity:.42}.theme-backdrop .tb-c{bottom:72px;left:-10px;width:24px;height:24px;opacity:.36}[data-theme=default] .theme-backdrop .tb-a{top:0;right:0;width:148px;height:148px;opacity:.92}[data-theme=default] .theme-backdrop .tb-b{top:0;right:0;width:96px;height:96px;opacity:.34}[data-theme=default] .theme-backdrop .tb-c{top:96px;right:10px;width:11px;height:11px;opacity:.85}[data-theme=default] .theme-backdrop .tb-d{bottom:0;left:0;width:112px;height:112px;opacity:.85}[data-theme=auditor] .theme-backdrop .tb-a{top:0;right:0;width:140px;height:140px;opacity:1}[data-theme=auditor] .theme-backdrop .tb-b{top:0;right:0;width:88px;height:88px;opacity:1}[data-theme=auditor] .theme-backdrop .tb-c{top:96px;left:10px;width:22px;height:22px;opacity:.42}[data-theme=auditor] .theme-backdrop .tb-d{bottom:0;left:0;width:108px;height:108px;opacity:1}}
.cv{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px;align-items:start}
.cv.free{display:block;position:relative}.cv.free>.blk{position:absolute;transition:top .24s ease}
.card{border:3px solid var(--ln);background:var(--card);border-radius:var(--r);box-shadow:5px 5px 0 var(--ln)}
[data-theme=default] .card{border:1px solid #4F7A99;border-radius:2px;box-shadow:none}
[data-theme=default] .card.open{border-color:#0D0D0D;box-shadow:0 0 0 1px #0D0D0D}
[data-theme=auditor] .card{border:1px solid #d5dbe5;border-top:3px solid #14243d;box-shadow:0 1px 3px rgba(16,24,40,.08)}
.ch{display:flex;width:100%;gap:10px;align-items:center;text-align:left;background:none;border:0;padding:14px;font-weight:700;font-size:17px;cursor:pointer}
.ch .n{flex:none;min-width:30px;height:30px;padding:0 6px;border:3px solid var(--ln);border-radius:999px;display:grid;place-items:center;background:var(--acc2);font-size:14px}
[data-theme=default] .ch{font-family:'Lora',Georgia,serif;font-weight:600}
[data-theme=default] .ch .n{border:0;border-radius:0;clip-path:polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%);background:#A9C6DC;color:#0D0D0D;font-family:'Space Mono',monospace}
[data-theme=default] .card.open .n{background:#D4A72C;color:#0D0D0D}
.cb{display:none;margin:0 14px 14px;padding-top:12px;border-top:3px dashed var(--ln)}.card.open .cb{display:block}
[data-theme=default] .cb{border-top:1px solid #A9C6DC}
.concl{margin-top:12px;border:3px solid var(--ln);background:var(--acc2);padding:16px;border-radius:var(--r);box-shadow:5px 5px 0 var(--ln);font-weight:600}
[data-theme=default] .concl{background:#fff;color:#0D0D0D;border:1px solid #4F7A99;border-top:2px solid #0D0D0D;box-shadow:none;font-weight:500}
.term{border:0;border-bottom:3px solid var(--acc);background:var(--acc3);padding:0 4px;font:inherit;font-weight:600;border-radius:3px;cursor:pointer}
[data-theme=default] .term{background:#EEF1F4;color:#7A5C00;border-bottom:1.5px solid #7A5C00;border-radius:2px}
.term.mt{background:var(--acc2);border-bottom-color:var(--ln);cursor:pointer}
[data-theme=default] .term.mt{background:#A9C6DC;color:#0D0D0D;border-bottom-color:#0D0D0D}
.s-s{font-size:14px}.s-m{font-size:18px}.s-l{font-size:28px;line-height:1.25}.s-xl{font-size:clamp(28px,6vw,46px);line-height:1.1}.s-xxl{font-size:clamp(38px,9vw,84px);line-height:1.05}
[data-theme=default] .s-l,[data-theme=default] .s-xl,[data-theme=default] .s-xxl{font-family:'Lora',Georgia,serif}
.a-l{text-align:left}.a-c{text-align:center}.a-r{text-align:right}.bd{font-weight:700}
.box{padding:14px}.bt{font-weight:700;font-size:20px;margin-bottom:12px}
.ptbl-wrap{width:100%;max-width:100%;overflow-x:auto;padding:0 5px 5px 0}
.ptbl{width:100%;table-layout:fixed;border-collapse:collapse;font-size:15px}
.ptbl th,.ptbl td{padding:10px 14px;text-align:left;vertical-align:top;overflow-wrap:break-word;word-break:normal}
.ptbl th{font-weight:700;border-bottom:3px solid var(--ln);background:var(--acc3)}
.ptbl td{border-bottom:2px solid var(--ln);background:var(--card)}
.ptbl{border:3px solid var(--ln);box-shadow:5px 5px 0 var(--ln);background:var(--card)}
.ptbl tbody tr:last-child td{border-bottom:0}
.ptbl th+th,.ptbl td+td{border-left:2px solid var(--ln)}
[data-theme=default] .ptbl-wrap{padding:0}
[data-theme=default] .ptbl{border:0;box-shadow:none;background:transparent}
[data-theme=default] .ptbl th{background:#E1E7EE;color:#0D0D0D;border-top:1px solid #4F7A99;border-bottom:2px solid #0D0D0D;font-family:'Lora',Georgia,serif;font-weight:600}
[data-theme=default] .ptbl td{background:transparent;border-bottom:1px solid #C8D4E0}
[data-theme=default] .ptbl tbody tr:last-child td{border-bottom:1px solid #4F7A99}
[data-theme=default] .ptbl tbody tr:nth-child(even) td{background:rgba(255,255,255,.55)}
[data-theme=default] .ptbl th+th,[data-theme=default] .ptbl td+td{border-left:1px solid #D3DCE6}
[data-theme=auditor] .ptbl-wrap{padding:0 0 3px 0}
[data-theme=auditor] .ptbl{border:1px solid #d5dbe5;border-top:3px solid #14243d;box-shadow:0 1px 3px rgba(16,24,40,.08);background:#fff}
[data-theme=auditor] .ptbl th{background:#14243d;color:#fff;border-bottom:2px solid #b08d3c;font-weight:600}
[data-theme=auditor] .ptbl td{border-bottom:1px solid #e1e6ee}
[data-theme=auditor] .ptbl tbody tr:last-child td{border-bottom:0}
[data-theme=auditor] .ptbl th+th{border-left:1px solid rgba(255,255,255,.16)}
[data-theme=auditor] .ptbl td+td{border-left:1px solid #e1e6ee}
@media(max-width:639px){.ptbl{font-size:14px}.ptbl th,.ptbl td{padding:8px 10px}}
.im{display:block;width:100%;height:auto;border-radius:6px}
nav{flex:0 0 auto;position:relative;display:flex;align-items:center;gap:10px;padding:10px ${hasByok ? '84px' : '16px'} 12px 16px;background:var(--bg);border-top:3px solid var(--ln);z-index:15}
[data-theme=default] nav{border-top:1px solid #4F7A99}
[data-theme=auditor] nav{background:#fff;border-top:1px solid #d5dbe5}
.prog{flex:1;height:14px;border:3px solid var(--ln);border-radius:99px;background:var(--card);overflow:hidden}.prog i{display:block;height:100%;background:var(--acc)}
[data-theme=default] .prog{height:6px;border:1px solid #4F7A99;border-radius:0}
.cnt{font-family:'Space Mono',monospace;font-size:13px;min-width:42px;text-align:center}
#pm{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:30;padding:16px}#pm[hidden]{display:none}
.pmc{background:var(--card);border:3px solid var(--ln);border-radius:14px;padding:18px;width:min(620px,100%);max-height:86vh;overflow:auto}
[data-theme=default] .pmc{border:1.5px solid #0D0D0D;border-radius:2px}
.fab{position:fixed;right:16px;bottom:12px;width:54px;height:54px;border-radius:50%;border:3px solid var(--ln);background:var(--acc);color:#111;box-shadow:4px 4px 0 var(--ln);z-index:35;font-size:20px;display:grid;place-items:center;cursor:pointer}
[data-theme=default] .fab{border:1.5px solid #0D0D0D;border-radius:2px;background:#D4A72C;color:#0D0D0D;box-shadow:none}
.bub{position:fixed;right:16px;bottom:78px;width:min(380px,calc(100vw - 24px));max-height:60vh;display:flex;flex-direction:column;border:3px solid var(--ln);background:var(--card);border-radius:14px;box-shadow:6px 6px 0 var(--ln);z-index:35;overflow:hidden}
[data-theme=default] .bub{border:1px solid #0D0D0D;border-radius:2px;box-shadow:none}
.bubh{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--acc3);border-bottom:3px solid var(--ln);font-weight:700}
[data-theme=default] .bubh{background:#0D0D0D;color:#EEF1F4;border-bottom:2px solid #D4A72C}
.bubm{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px;font-size:14px}
.bmsg{padding:8px 10px;border:2px solid var(--ln);border-radius:10px;max-width:92%}.bmsg.u{align-self:flex-end;background:var(--acc2)}.bmsg.a{align-self:flex-start}
[data-theme=default] .bmsg{border:1px solid #4F7A99;border-radius:2px}[data-theme=default] .bmsg.u{background:#0D0D0D;color:#EEF1F4;border-color:#0D0D0D}[data-theme=default] .bmsg.a{background:#EEF1F4;border-color:#A9C6DC}
.scroll-area::-webkit-scrollbar,.pmc::-webkit-scrollbar,.bubm::-webkit-scrollbar,.ptbl-wrap::-webkit-scrollbar{width:10px;height:10px}
.scroll-area::-webkit-scrollbar-track,.pmc::-webkit-scrollbar-track,.bubm::-webkit-scrollbar-track,.ptbl-wrap::-webkit-scrollbar-track{background:var(--sb-track)}
.scroll-area::-webkit-scrollbar-track{border-left:1px solid var(--sb-track-line)}
[data-theme=brutal] .scroll-area::-webkit-scrollbar-track{border-left:2px solid #111}
.scroll-area::-webkit-scrollbar-thumb,.pmc::-webkit-scrollbar-thumb,.bubm::-webkit-scrollbar-thumb,.ptbl-wrap::-webkit-scrollbar-thumb{background:var(--sb-thumb);border-radius:var(--sb-radius);border:2px solid var(--sb-thumb-border);background-clip:padding-box}
[data-theme=brutal] .scroll-area::-webkit-scrollbar-thumb,[data-theme=brutal] .pmc::-webkit-scrollbar-thumb,[data-theme=brutal] .bubm::-webkit-scrollbar-thumb,[data-theme=brutal] .ptbl-wrap::-webkit-scrollbar-thumb{background-clip:border-box}
.scroll-area::-webkit-scrollbar-thumb:hover,.pmc::-webkit-scrollbar-thumb:hover,.bubm::-webkit-scrollbar-thumb:hover,.ptbl-wrap::-webkit-scrollbar-thumb:hover{background:var(--sb-thumb-hover);background-clip:padding-box}
@supports not selector(::-webkit-scrollbar){.scroll-area,.pmc,.bubm,.ptbl-wrap{scrollbar-width:thin;scrollbar-color:var(--sb-thumb) var(--sb-track)}}
</style>
</head>
<body data-locked="1">
<div id="app"></div>
<script id="deck-data" type="application/json">${safeJson}</script>
<script id="byok-data" type="application/json">${safeKeysJson}</script>
<script>
(()=>{
const deck=JSON.parse(document.getElementById('deck-data').textContent);
const byok=JSON.parse(document.getElementById('byok-data').textContent||'[]');
let idx=0,open=new Set(),pmId=null,aiOpen=false,aiBusy=false,msgs=[];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=s=>esc(s).replace(/\\[\\[\\[(.*?)\\]\\]\\]|\\[\\[(.+?)\\]\\]/g,(m,a,t)=>a!==undefined?'<button class="term mt" data-mt="'+esc(a.trim())+'">'+esc(a.trim()||'ⓘ')+'</button>':'<button class="term" data-ai="'+esc(t)+'">'+esc(t)+'</button>').replace(/\\*\\*(.+?)\\*\\*/g,'<strong>$1</strong>').replace(/\\n/g,'<br>');
const stText=s=>String(s||'').replace(/\\[\\[\\[(.*?)\\]\\]\\]|\\[\\[(.+?)\\]\\]/g,(_,a,t)=>a!==undefined?a:t).replace(/\\*\\*(.+?)\\*\\*/g,'$1').replace(/\\{\\/?(s|m|l|xl)\\}/g,'').replace(/\\s*\\n+\\s*/g,' ').trim();
const tblWidths=(hdrs,rows,bw)=>{const n=Math.max(1,hdrs.length);if(n===1)return[100];const ml=s=>String(s||'').split('\\n').reduce((m,ln)=>Math.max(m,stText(ln).length),0);const lens=hdrs.map((h,i)=>Math.max(ml(h),...(rows||[]).map(r=>ml((r||[])[i]))));const wf=Math.max(3,Math.min(12,bw||12))/12;const th=Math.max(10,Math.round(Math.max(24,Math.round(64*wf))/n));if(!lens.some(l=>l>th))return Array(n).fill(100/n);const rc=Math.max(36,84*wf),eq=100/n,mn=Math.max(7,Math.min(10.5,28/n));const w=Array(n).fill(0),sh=[],lg=[];lens.forEach((l,i)=>(l<=th?sh:lg).push(i));let us=0;sh.forEach(i=>{const f=Math.max(mn,Math.min(eq*.92,(Math.max(lens[i],2)+4)/rc*100));w[i]=f;us+=f});const mx=100-lg.length*mn;if(us>mx&&us>0){const sc=mx/us;us=0;sh.forEach(i=>{w[i]=Math.max(mn,w[i]*sc);us+=w[i]})}const rem=Math.max(lg.length*mn,100-us);const lw=lg.map(i=>Math.max(1,Math.pow(lens[i],.85)));const tw=lw.reduce((a,b)=>a+b,0)||1;lg.forEach((i,p)=>{w[i]=lw[p]/tw*rem});return w};
const renderBlocks=(arr)=>{let n=0;return arr.map(b=>{
  let h='';
  if(b.t==='text')h='<div class="s-'+(b.size||'m')+' a-'+(b.align||'l')+(b.b?' bd':'')+'">'+fmt(b.text)+'</div>';
  else if(b.t==='img')h=b.src?'<img class="im" src="'+esc(b.src)+'" alt="'+esc(b.alt)+'">':'';
  else if(b.t==='dd'){n++;const o=open.has(b.id);const bd=(b.badge&&String(b.badge).trim())?b.badge:String(n);h='<div class="card'+(o?' open':'')+'"><button class="ch" data-card="'+b.id+'"><span class="n">'+esc(bd)+'</span><span>'+esc(b.text)+'</span></button><div class="cb">'+fmt(b.detail)+'</div></div>'}
  else if(b.t==='box')h='<div class="card box">'+(b.title?'<div class="bt">'+fmt(b.title)+'</div>':'')+'<div class="cv">'+renderBlocks(b.children||[])+'</div></div>';
  else if(b.t==='table'){const hdrs=b.headers||['Kolom 1'],rows=b.rows||[],ws=tblWidths(hdrs,rows,b.w);h='<div class="ptbl-wrap"><table class="ptbl"><colgroup>'+ws.map(w=>'<col style="width:'+w.toFixed(2)+'%">').join('')+'</colgroup><thead><tr>'+hdrs.map(hd=>'<th>'+fmt(hd)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(rw=>'<tr>'+hdrs.map((_,ci)=>'<td>'+fmt((rw||[])[ci]||'')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
  else{const o=open.has(b.id);h='<button class="btn" data-concl="'+b.id+'">'+(o?'Tutup kesimpulan':esc(b.label||'★ Kesimpulan'))+'</button>'+(o?'<div class="concl">'+fmt(b.text)+'</div>':'')}
  const style=b.y!=null?'left:'+Math.max(0,Math.min(100-b.w/12*100,b.x||0))+'%;top:'+b.y+'px;width:'+b.w/12*100+'%':'grid-column:span '+b.w;
  return '<div class="blk" style="'+style+'">'+h+'</div>';
}).join('')};
const descBlocks=(arr,sc)=>{const out=[];arr.forEach(b=>{if(b.t==='text'){const t=stText(b.text);if(t)out.push((sc?'['+sc+'] ':'')+t)}else if(b.t==='box'){const bt=stText(b.title);const ns=bt?(sc?sc+' > ':'')+'Kartu "'+bt+'"':sc||'Kartu';if(bt)out.push('['+ns+']');out.push(...descBlocks(b.children||[],ns))}else if(b.t==='dd'){const t=stText(b.text),d=stText(b.detail);out.push((sc?'['+sc+'] ':'')+'Poin: '+t+(d?' — '+d:''))}else if(b.t==='concl'){const t=stText(b.text);if(t)out.push('['+(stText(b.label)||'Kesimpulan')+'] '+t)}else if(b.t==='table'){const hs=(b.headers||[]).map(stText).filter(Boolean).join(' | ');const rs=(b.rows||[]).slice(0,8).map(r=>(r||[]).map(stText).join(' | ')).filter(Boolean).join(' ; ');if(hs||rs)out.push('['+(sc?sc+' > ':'')+'Tabel] '+(hs?'Header: '+hs+' ; ':'')+rs)}else if(b.t==='img'&&b.alt){out.push('[Gambar: '+b.alt+']')}});return out};
const callAi=async(q,localCtx)=>{
  if(!byok.length||aiBusy)return;
  msgs.push({r:'u',t:q});aiBusy=true;aiOpen=true;render();
  const sl=deck.slides[idx];
  const slideLines=descBlocks(sl.blocks);
  (sl.modals||[]).forEach(m=>{const ml=descBlocks(m.children||[],'Modal "'+stText(m.title)+'"');if(ml.length)slideLines.push(...ml)});
  const overview=deck.slides.map((s,i)=>'Slide '+(i+1)+(i===idx?' [AKTIF]':'')+': '+descBlocks(s.blocks).slice(0,2).join(' — ').slice(0,160)).join('\\n');
  const sys='Kamu adalah Orias AI, asisten dalam presentasi "'+deck.title+'" (Slide '+(idx+1)+' dari '+deck.slides.length+').\\nAlur presentasi:\\n'+overview+'\\nMateri lengkap slide aktif:\\n'+slideLines.join('\\n').slice(0,2400)+(localCtx?'\\nKonteks spesifik istilah: '+localCtx:'')+'\\nPahami topik yang sebenarnya sedang dibahas secara menyeluruh. Jika istilah/pertanyaan singkat atau implisit, tafsirkan maknanya sesuai konteks materi di atas. Jawab dalam bahasa Indonesia secara ringkas dan jelas (~100-150 kata).';
  const hist=msgs.filter(m=>m.r!=='e').slice(-8).map(m=>({role:m.r==='u'?'user':'assistant',content:m.t}));
  let reply='';
  for(const k of byok){
    try{
      if(k.provider==='gemini'){
        const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key='+encodeURIComponent(k.key),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:hist.map(h=>({role:h.role==='assistant'?'model':'user',parts:[{text:h.content}]}))})});
        const j=await r.json();if(r.ok&&j.candidates?.[0]?.content?.parts?.[0]?.text){reply=j.candidates[0].content.parts[0].text;break}
      }else if(k.provider==='claude'){
        const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':k.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:sys,messages:hist})});
        const j=await r.json();if(r.ok&&j.content?.[0]?.text){reply=j.content[0].text;break}
      }else{
        const urls={openai:'https://api.openai.com/v1/chat/completions',groq:'https://api.groq.com/openai/v1/chat/completions',openrouter:'https://openrouter.ai/api/v1/chat/completions',deepseek:'https://api.deepseek.com/chat/completions',xai:'https://api.x.ai/v1/chat/completions',mistral:'https://api.mistral.ai/v1/chat/completions'};
        const mods={openai:'gpt-4o-mini',groq:'llama-3.3-70b-versatile',openrouter:'openai/gpt-4o-mini',deepseek:'deepseek-chat',xai:'grok-2-latest',mistral:'mistral-small-latest'};
        const r=await fetch(urls[k.provider]||urls.openai,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+k.key},body:JSON.stringify({model:mods[k.provider]||'gpt-4o-mini',messages:[{role:'system',content:sys},...hist]})});
        const j=await r.json();if(r.ok&&j.choices?.[0]?.message?.content){reply=j.choices[0].message.content;break}
      }
    }catch{}
  }
  msgs.push(reply?{r:'a',t:reply}:{r:'e',t:'Gagal menghubungi provider AI.'});
  aiBusy=false;render();
};
const render=()=>{
  const sl=deck.slides[idx],free=sl.blocks.some(b=>b.y!=null);
  const aiHtml=byok.length?('<button class="fab" id="fab">✦</button>'+(aiOpen?'<div class="bub"><div class="bubh"><span>Orias AI</span><button class="btn" id="cbub" style="padding:2px 8px">✕</button></div><div class="bubm">'+(msgs.length?msgs.map(m=>'<div class="bmsg '+m.r+'">'+fmt(m.t)+'</div>').join(''):'<div class="bmsg a">Klik istilah bertanda kuning untuk penjelasan.</div>')+(aiBusy?'<div class="bmsg a">Sedang berpikir…</div>':'')+'</div></div>':'')):'';
  document.getElementById('app').innerHTML='<div class="theme-backdrop" aria-hidden="true"><span class="tb-a"></span><span class="tb-b"></span><span class="tb-c"></span><span class="tb-d"></span></div><header><div class="brand">'+esc(deck.title)+'</div><button class="btn" id="fs">▶</button></header><div class="scroll-area"><main><div class="slide"><div class="cv'+(free?' free':'')+'">'+renderBlocks(sl.blocks)+'</div></div></main></div><nav><button class="btn" id="pv"'+(idx<=0?' disabled':'')+'>◀</button><div class="prog"><i style="width:'+((idx+1)/deck.slides.length*100)+'%"></i></div><span class="cnt">'+(idx+1)+'/'+deck.slides.length+'</span><button class="btn" id="nx"'+(idx>=deck.slides.length-1?' disabled':'')+'>▶</button></nav>'+aiHtml+'<div id="pm"'+(pmId?'':' hidden')+'>'+(pmId?(() => {const m=(sl.modals||[]).find(x=>x.id===pmId);return m?'<div class="pmc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2>'+esc(m.title)+'</h2><button class="btn" id="cpm">✕</button></div><div class="cv">'+renderBlocks(m.children||[])+'</div></div>':'';})():'')+'</div>';
  if(free){const r=document.querySelector('.cv.free');let b=0;[...r.children].forEach(e=>{b=Math.max(b,e.offsetTop+e.offsetHeight)});r.style.height=(b+40)+'px'}
};
document.addEventListener('click',e=>{
  const t=e.target;
  if(t.closest('#pv')&&idx>0){idx--;render()}
  else if(t.closest('#nx')&&idx<deck.slides.length-1){idx++;render()}
  else if(t.closest('#fs')){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}
  else if(t.closest('#fab')){aiOpen=!aiOpen;render()}
  else if(t.closest('#cbub')){aiOpen=false;render()}
  else if(t.closest('[data-ai]')){const btn=t.closest('[data-ai]');const blk=btn.closest('.card,.concl,.blk');callAi('Jelaskan istilah atau poin ini: "'+btn.dataset.ai+'"',blk?blk.innerText.replace(/\\s+/g,' ').trim().slice(0,400):'')}
  else if(t.closest('[data-card]')){const id=t.closest('[data-card]').dataset.card;open.has(id)?open.delete(id):open.add(id);render()}
  else if(t.closest('[data-concl]')){const id=t.closest('[data-concl]').dataset.concl;open.has(id)?open.delete(id):open.add(id);render()}
  else if(t.closest('[data-mt]')){const title=t.closest('[data-mt]').dataset.mt;const m=(deck.slides[idx].modals||[]).find(x=>x.title===title);if(m){pmId=m.id;render()}}
  else if(t.id==='pm'||t.closest('#cpm')){pmId=null;render()}
});
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'&&idx<deck.slides.length-1){idx++;render()}
  else if(e.key==='ArrowLeft'&&idx>0){idx--;render()}
  else if(e.key==='Escape'&&pmId){pmId=null;render()}
});
render();
})();
</script>
</body>
</html>`;
}

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
  TitleBlock,
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
  cyberpunk: {
    name: 'Cyberpunk',
    description:
      'Metropolis malam neon: latar perkotaan malam hari gelap, aksen ungu & magenta elektrik, kartu kaca gelap futuristik.',
  },
  hacker: {
    name: 'Hacker',
    description:
      'Terminal kode neon hijau dengan animasi hujan Matrix di latar belakang, tipografi monospace, dan panel kaca gelap kontras tinggi.',
  },
  astronomi: {
    name: 'Astronomi',
    description:
      'Observatorium antariksa monokrom hitam-putih-abu dengan Bima Sakti perak, bintang berkelip, bulan mengorbit, dan planet Saturnus berwarna alami realistis.',
  },
  ghost: {
    name: 'Ghost',
    description:
      'Ruangan angker kumuh bernuansa merah darah: TV CRT rusak menyala berkedip, kursi goyang bergerak di belakang, dan sosok hantu mengintip serta melesat di sudut pintu.',
  },
  halloween: {
    name: 'Halloween',
    description:
      'Malam Halloween bernuansa oren menyala: cahaya bulan purnama, istana hitam berpagar besi, kuburan & pohon angker, labu oren menyala, burung hantu, dan kelelawar berterbangan.',
  },
  aquarium: {
    name: 'Aquarium',
    description:
      'Dunia bawah laut bernuansa biru cerah: ikan tropis, rumput laut bergoyang, bintang laut, keong, gurita, ubur-ubur, megalodon, hiu, ikan kembung, dan ikan bermoncong lampu.',
  },
  detective: {
    name: 'Detective',
    description:
      'Ruang kerja detektif bernuansa coklat mocca: meja berantakan dengan laptop kasus kriminal, papan hubung pola, sorot cahaya jendela, jas & berkas tertiup angin, kaca pembesar, dan pulpen.',
  },
  summer: {
    name: 'Summer',
    description:
      'Pantai musim panas bernuansa kuning cerah: ombak laut, ban renang mengapung, burung bangau, pohon kelapa & tenda payung beranimasi angin, matras santai, kedai & gelas minuman kuning bergoyang dengan es, papan selancar, pistol air, dan kacamata renang.',
  },
};

export const BLOCK_NAMES: Record<Block['t'], string> = {
  title: 'Judul',
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
    case 'title':
      return { id: uid(), t: 'title', text: '', w: 12 };
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

function describeBlockLines(blocks: Block[], scope?: string): string[] {
  const lines: string[] = [];
  let ddIndex = 0;
  for (const b of blocks) {
    if (b.t === 'text') {
      const clean = stripMarkup(b.text).replace(/\s*\n+\s*/g, ' ').trim();
      if (clean) lines.push(scope ? `[${scope}] ${clean}` : clean);
    } else if (b.t === 'title') {
      const clean = stripMarkup(b.text).replace(/\s*\n+\s*/g, ' ').trim();
      if (clean) lines.push(scope ? `[${scope} > Judul] ${clean}` : `[Judul] ${clean}`);
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
      if (b.t === 'title' && matches(b.text)) {
        const clean = stripMarkup(b.text).replace(/\s*\n+\s*/g, ' ').trim();
        return containerLabel ? `${containerLabel} > Judul: "${clean}"` : `Judul: "${clean}"`;
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
      const hdr = getSlideHeaderTitle(deck, s).trim();
      const snippet = describeBlockLines(s.blocks)
        .join(' • ')
        .slice(0, 180);
      const marker = idx === activeIndex ? ' [AKTIF]' : '';
      const hdrNote = hdr && hdr !== (deck.title || '').trim() && hdr !== title ? ` (${hdr})` : '';
      return snippet && snippet !== title
        ? `Slide ${idx + 1}${marker}${hdrNote}: ${title} — ${snippet}`
        : `Slide ${idx + 1}${marker}${hdrNote}: ${title}`;
    })
    .join('\n')
    .slice(0, 1800);

  const cleanClickedTerm = clickedTerm ? stripMarkup(clickedTerm).trim() : '';
  const surroundingContext = cleanClickedTerm
    ? findSurroundingContextForTerm(slide, cleanClickedTerm).slice(0, 600)
    : '';

  const effectiveHeader =
    getSlideHeaderTitle(deck, slide).trim() ||
    getDeckDisplayTitle(deck) ||
    'Presentasi';

  return {
    deckTitle: effectiveHeader,
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
  const safeTitle = (getDeckDisplayTitle(deck) || 'Presentasi')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const theme: ThemeId =
    deck.theme && THEME_META[deck.theme] ? deck.theme : 'default';

  return `<!doctype html>
<html lang="id" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=Chakra+Petch:wght@500;600;700&family=Cinzel:wght@600;700&family=Creepster&family=Fredoka:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Lora:wght@500;600;700&family=Orbitron:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&family=Source+Serif+4:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#fff4d6;--fg:#111;--card:#fff;--ln:#111;--acc:#ff6b35;--acc2:#2ec4b6;--acc3:#ffd23f;--mut:#555;--r:10px;--sb-track:rgba(17,17,17,.06);--sb-track-line:rgba(17,17,17,.28);--sb-thumb:#ffd23f;--sb-thumb-hover:#ff6b35;--sb-thumb-border:#111;--sb-radius:6px}
:root[data-theme=default]{--bg:#EEF1F4;--fg:#0D0D0D;--card:#fff;--ln:#4F7A99;--acc:#D4A72C;--acc2:#A9C6DC;--acc3:#EEF1F4;--mut:#4A5663;--r:2px;--sb-track:rgba(79,122,153,.08);--sb-track-line:rgba(79,122,153,.28);--sb-thumb:#4F7A99;--sb-thumb-hover:#D4A72C;--sb-thumb-border:transparent;--sb-radius:2px}
:root[data-theme=auditor]{--bg:#f4f6f9;--fg:#1b2430;--card:#fff;--ln:#14243d;--acc:#b08d3c;--acc2:#14243d;--acc3:#14243d;--mut:#5b6677;--r:6px;--sb-track:rgba(20,36,61,.045);--sb-track-line:rgba(20,36,61,.14);--sb-thumb:rgba(20,36,61,.34);--sb-thumb-hover:#b08d3c;--sb-thumb-border:transparent;--sb-radius:999px}
:root[data-theme=cyberpunk]{--bg:#090612;--fg:#f3e8ff;--card:rgba(19,10,36,.88);--ln:#a855f7;--acc:#a855f7;--acc2:#ff2a85;--acc3:#fcee0a;--mut:#b7a3d4;--r:4px;--sb-track:rgba(168,85,247,.06);--sb-track-line:rgba(168,85,247,.25);--sb-thumb:#a855f7;--sb-thumb-hover:#ff2a85;--sb-thumb-border:#090612;--sb-radius:2px}
:root[data-theme=hacker]{--bg:#030804;--fg:#d9ffe5;--card:rgba(4,14,8,.88);--ln:#00ff66;--acc:#00ff66;--acc2:#00c853;--acc3:#8dffb0;--mut:#6dc48c;--r:4px;--sb-track:rgba(0,255,102,.06);--sb-track-line:rgba(0,255,102,.25);--sb-thumb:#00ff66;--sb-thumb-hover:#8dffb0;--sb-thumb-border:#030804;--sb-radius:2px}
:root[data-theme=astronomi]{--bg:#050507;--fg:#f4f4f5;--card:rgba(16,16,20,.9);--ln:#d4d4d8;--acc:#ffffff;--acc2:#71717a;--acc3:#27272a;--mut:#a1a1aa;--r:4px;--sb-track:rgba(255,255,255,.06);--sb-track-line:rgba(212,212,216,.22);--sb-thumb:#a1a1aa;--sb-thumb-hover:#ffffff;--sb-thumb-border:#050507;--sb-radius:2px}
:root[data-theme=ghost]{--bg:#080405;--fg:#f4eaea;--card:rgba(18,7,9,.88);--ln:#dc2626;--acc:#dc2626;--acc2:#7f1d1d;--acc3:#ef4444;--mut:#b08f8f;--r:4px;--sb-track:rgba(220,38,38,.06);--sb-track-line:rgba(220,38,38,.25);--sb-thumb:#dc2626;--sb-thumb-hover:#ef4444;--sb-thumb-border:#080405;--sb-radius:2px}
:root[data-theme=halloween]{--bg:#09060d;--fg:#fff4e8;--card:rgba(20,11,24,.9);--ln:#f97316;--acc:#f97316;--acc2:#ea580c;--acc3:#fbbf24;--mut:#d1b6a1;--r:4px;--sb-track:rgba(249,115,22,.07);--sb-track-line:rgba(249,115,22,.26);--sb-thumb:#f97316;--sb-thumb-hover:#fb923c;--sb-thumb-border:#09060d;--sb-radius:2px}
:root[data-theme=aquarium]{--bg:#04182e;--fg:#eef8ff;--card:rgba(6,30,56,.88);--ln:#0ea5e9;--acc:#38bdf8;--acc2:#0284c7;--acc3:#7dd3fc;--mut:#93c5fd;--r:6px;--sb-track:rgba(14,165,233,.08);--sb-track-line:rgba(56,189,248,.26);--sb-thumb:#0ea5e9;--sb-thumb-hover:#38bdf8;--sb-thumb-border:#04182e;--sb-radius:999px}
:root[data-theme=detective]{--bg:#1c120d;--fg:#f5ebe0;--card:rgba(38,23,16,.9);--ln:#a67c52;--acc:#d4a373;--acc2:#8c5a3c;--acc3:#e6ccb2;--mut:#c8b099;--r:4px;--sb-track:rgba(212,163,115,.08);--sb-track-line:rgba(166,124,82,.28);--sb-thumb:#8c5a3c;--sb-thumb-hover:#d4a373;--sb-thumb-border:#1c120d;--sb-radius:3px}
:root[data-theme=summer]{--bg:#fef9c3;--fg:#422006;--card:rgba(255,251,235,.92);--ln:#eab308;--acc:#facc15;--acc2:#fbbf24;--acc3:#fef08a;--mut:#854d0e;--r:8px;--sb-track:rgba(234,179,8,.14);--sb-track-line:rgba(202,138,4,.3);--sb-thumb:#eab308;--sb-thumb-hover:#ca8a04;--sb-thumb-border:transparent;--sb-radius:999px}
*{box-sizing:border-box}html,body{margin:0;height:100%;overflow:hidden}
body{background:var(--bg);color:var(--fg);font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:16px;line-height:1.5}
[data-theme=default] body{font-family:'IBM Plex Sans',system-ui,sans-serif;font-variant-numeric:tabular-nums}
[data-theme=auditor] body{font-family:'Plus Jakarta Sans',system-ui,sans-serif}
[data-theme=cyberpunk] body{font-family:'Rajdhani',system-ui,sans-serif;background:linear-gradient(180deg,#06030d 0%,#0b0618 55%,#160a2b 100%)}
[data-theme=hacker] body{font-family:'JetBrains Mono',monospace;background:#030804}
[data-theme=astronomi] body{font-family:'IBM Plex Sans',system-ui,sans-serif;background:#050507;font-variant-numeric:tabular-nums}
[data-theme=ghost] body{font-family:'IBM Plex Sans',system-ui,sans-serif;background:#080405}
[data-theme=halloween] body{font-family:'IBM Plex Sans',system-ui,sans-serif;background:#09060d}
[data-theme=aquarium] body{font-family:'IBM Plex Sans',system-ui,sans-serif;background:#04182e}
[data-theme=detective] body{font-family:'IBM Plex Sans',system-ui,sans-serif;background:#1c120d}
[data-theme=summer] body{font-family:'IBM Plex Sans',system-ui,sans-serif;background:#fef9c3;color:#422006}
#app{height:100vh;height:100dvh;display:flex;flex-direction:column;overflow:hidden;position:relative;z-index:1}
header{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:12px 16px 8px;border-bottom:0;background:transparent;color:var(--fg);position:relative;z-index:20}
[data-theme=default] header{background:transparent;color:#0D0D0D;border-bottom:0}
[data-theme=auditor] header{background:transparent;color:#14243d;border-bottom:0}
[data-theme=cyberpunk] header{background:transparent;color:#f3e8ff;border-bottom:0}
[data-theme=hacker] header{background:transparent;color:#d9ffe5;border-bottom:0}
[data-theme=astronomi] header{background:transparent;color:#f4f4f5;border-bottom:0}
[data-theme=ghost] header{background:transparent;color:#f4eaea;border-bottom:0}
[data-theme=halloween] header{background:transparent;color:#fff4e8;border-bottom:0}
[data-theme=aquarium] header{background:transparent;color:#eef8ff;border-bottom:0}
[data-theme=detective] header{background:transparent;color:#f5ebe0;border-bottom:0}
[data-theme=summer] header{background:transparent;color:#422006;border-bottom:0}
.brand{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
[data-theme=default] .brand{font-family:'Lora',Georgia,serif;font-weight:600}
[data-theme=cyberpunk] .brand{font-family:'Orbitron',sans-serif;letter-spacing:.03em;text-shadow:0 1px 8px rgba(6,3,13,.92),0 0 12px rgba(168,85,247,.42)}
[data-theme=hacker] .brand{font-family:'JetBrains Mono',monospace;color:#00ff66;letter-spacing:.02em;text-shadow:0 1px 8px rgba(2,6,3,.95),0 0 12px rgba(0,255,102,.32)}
[data-theme=astronomi] .brand{font-family:'Chakra Petch',sans-serif;color:#ffffff;letter-spacing:.03em;text-shadow:0 1px 8px rgba(0,0,0,.94),0 0 14px rgba(255,255,255,.22)}
[data-theme=ghost] .brand{font-family:'Cinzel',Georgia,serif;color:#f4eaea;letter-spacing:.04em;text-shadow:0 2px 10px rgba(4,1,2,.96),0 0 14px rgba(220,38,38,.38)}
[data-theme=halloween] .brand{font-family:'Creepster','Cinzel',Georgia,serif;color:#fff4e8;font-weight:400;letter-spacing:.05em;text-shadow:0 2px 10px rgba(5,3,8,.96),0 0 14px rgba(249,115,22,.45)}
[data-theme=aquarium] .brand{font-family:'Fredoka',system-ui,sans-serif;color:#eef8ff;font-weight:600;letter-spacing:.02em;text-shadow:0 2px 10px rgba(2,16,36,.9),0 0 14px rgba(56,189,248,.42)}
[data-theme=detective] .brand{font-family:'Cinzel',Georgia,serif;color:#f5ebe0;font-weight:700;letter-spacing:.04em;text-shadow:0 2px 10px rgba(10,5,3,.94),0 0 14px rgba(212,163,115,.34)}
[data-theme=summer] .brand{font-family:'Fredoka',system-ui,sans-serif;color:#422006;font-weight:700;letter-spacing:.02em;text-shadow:0 1px 8px rgba(255,251,235,.92),0 0 14px rgba(254,240,138,.72)}
.btn{border:3px solid var(--ln);background:var(--card);color:var(--fg);padding:6px 12px;border-radius:var(--r);box-shadow:3px 3px 0 var(--ln);font-weight:600;cursor:pointer}
[data-theme=default] .btn{border:1px solid #4F7A99;border-radius:2px;box-shadow:none;font-weight:500}
[data-theme=auditor] .btn{border:1px solid #c5ccd8;border-radius:6px;box-shadow:0 1px 2px rgba(16,24,40,.08)}
[data-theme=cyberpunk] .btn{border:1.5px solid rgba(168,85,247,.55);background:#120a24;color:#f3e8ff;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.45)}
[data-theme=cyberpunk] .btn:hover{border-color:#c084fc;background:rgba(168,85,247,.16)}
[data-theme=hacker] .btn{border:1.5px solid rgba(0,255,102,.55);background:rgba(4,16,9,.92);color:#d9ffe5;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.5)}
[data-theme=hacker] .btn:hover{border-color:#00ff66;background:rgba(0,255,102,.14)}
[data-theme=astronomi] .btn{border:1px solid rgba(212,212,216,.42);background:rgba(16,16,20,.9);color:#f4f4f5;border-radius:4px;box-shadow:0 4px 14px rgba(0,0,0,.52)}
[data-theme=astronomi] .btn:hover{border-color:#ffffff;background:rgba(255,255,255,.12)}
[data-theme=ghost] .btn{border:1.5px solid rgba(220,38,38,.56);background:rgba(18,7,9,.92);color:#f4eaea;border-radius:4px;box-shadow:0 4px 14px rgba(0,0,0,.58)}
[data-theme=ghost] .btn:hover{border-color:#ef4444;background:rgba(185,28,28,.24)}
[data-theme=halloween] .btn{border:1.5px solid rgba(249,115,22,.56);background:rgba(20,11,24,.92);color:#fff4e8;border-radius:4px;box-shadow:0 4px 14px rgba(0,0,0,.58)}
[data-theme=halloween] .btn:hover{border-color:#fb923c;background:rgba(249,115,22,.22)}
[data-theme=aquarium] .btn{border:1.5px solid rgba(56,189,248,.56);background:rgba(6,32,60,.9);color:#eef8ff;border-radius:6px;box-shadow:0 4px 14px rgba(2,14,30,.52)}
[data-theme=aquarium] .btn:hover{border-color:#7dd3fc;background:rgba(14,165,233,.24)}
[data-theme=detective] .btn{border:1.5px solid rgba(166,124,82,.62);background:rgba(38,23,16,.92);color:#f5ebe0;border-radius:4px;box-shadow:0 4px 14px rgba(10,5,3,.56)}
[data-theme=detective] .btn:hover{border-color:#d4a373;background:rgba(140,90,60,.36)}
[data-theme=summer] .btn{border:1.5px solid rgba(202,138,4,.72);background:rgba(255,251,235,.94);color:#422006;border-radius:8px;box-shadow:0 4px 14px rgba(133,77,14,.14)}
[data-theme=summer] .btn:hover{border-color:#ca8a04;background:#fef08a}
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
[data-theme=cyberpunk] .theme-backdrop{background:radial-gradient(ellipse at 24% 85%,rgba(168,85,247,.16),transparent 48%),radial-gradient(ellipse at 78% 78%,rgba(255,42,133,.14),transparent 46%),linear-gradient(180deg,#06030d 0%,#0b0618 52%,#160a2b 100%)}
[data-theme=cyberpunk] .theme-backdrop::before{content:"";position:absolute;inset:auto 0 0 0;height:62%;background-repeat:no-repeat;background-position:bottom center;background-size:cover;opacity:.88;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 500' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23160a2b' stop-opacity='0.3'/%3E%3Cstop offset='1' stop-color='%23070411'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='%23120824' d='M0 500V240h75v-90h65v140h50V110h95v190h40V165h70v105h55V70h110v230h45V180h80v90h60V125h95v175h50V95h105v205h60V155h85v140h55V80h115v220h45V190h85v110h65V130h100v370z'/%3E%3Cpath fill='url(%23g)' d='M0 500V310h60v-55h85v85h55V205h90v145h55V250h80v100h65V175h100v175h65V230h90v120h70V195h95v155h60V240h85v110h60V185h100v165h70V255h85v95h55V210h105v290z'/%3E%3Crect x='205' y='118' width='65' height='4' fill='%23a855f7'/%3E%3Crect x='465' y='78' width='80' height='4' fill='%23ff2a85'/%3E%3Crect x='910' y='104' width='75' height='4' fill='%23a855f7'/%3E%3Crect x='1255' y='88' width='85' height='4' fill='%23ff2a85'/%3E%3Crect x='215' y='150' width='12' height='14' fill='%23fcee0a' opacity='.7'/%3E%3Crect x='240' y='175' width='12' height='14' fill='%23a855f7' opacity='.65'/%3E%3Crect x='490' y='115' width='14' height='18' fill='%23ff2a85' opacity='.7'/%3E%3Crect x='518' y='150' width='10' height='12' fill='%23fcee0a' opacity='.6'/%3E%3Crect x='935' y='138' width='14' height='18' fill='%23a855f7' opacity='.65'/%3E%3Crect x='1280' y='125' width='16' height='18' fill='%23fcee0a' opacity='.7'/%3E%3C/svg%3E")}
[data-theme=cyberpunk] .theme-backdrop .tb-a{top:74px;right:24px;width:44px;height:44px;background:transparent;border:0;border-top:2px solid #a855f7;border-right:2px solid #a855f7;box-shadow:none;opacity:.62}
[data-theme=cyberpunk] .theme-backdrop .tb-b{top:90px;left:24px;right:auto;width:36px;height:36px;background:transparent;border:0;border-top:2px solid #ff2a85;border-left:2px solid #ff2a85;opacity:.56}
[data-theme=cyberpunk] .theme-backdrop .tb-c,[data-theme=cyberpunk] .theme-backdrop .tb-d{display:none}
[data-theme=hacker] .theme-backdrop{background:radial-gradient(ellipse at 50% 42%,rgba(0,40,16,.24),rgba(2,6,3,.78))}
[data-theme=hacker] .theme-backdrop::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(2,8,4,.46) 0%,rgba(2,8,4,.72) 100%);pointer-events:none}
[data-theme=hacker] .theme-backdrop span{display:none}
[data-theme=astronomi] .theme-backdrop{background:#050507}
[data-theme=astronomi] .theme-backdrop::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 48%,rgba(5,5,7,.14) 0%,rgba(4,4,6,.36) 100%);pointer-events:none}
[data-theme=astronomi] .theme-backdrop span{display:none}
[data-theme=ghost] .theme-backdrop{background:#080405}
[data-theme=ghost] .theme-backdrop::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 48%,rgba(10,3,4,.1) 0%,rgba(8,2,3,.44) 68%,rgba(4,1,2,.82) 100%);pointer-events:none}
[data-theme=ghost] .theme-backdrop span{display:none}
[data-theme=halloween] .theme-backdrop{background:#09060d}
[data-theme=halloween] .theme-backdrop::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 48%,rgba(9,6,13,.08) 0%,rgba(8,4,12,.36) 70%,rgba(5,3,8,.72) 100%);pointer-events:none}
[data-theme=halloween] .theme-backdrop span{display:none}
[data-theme=aquarium] .theme-backdrop{background:#04182e}
[data-theme=aquarium] .theme-backdrop::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(4,24,46,.04) 0%,rgba(3,19,38,.22) 72%,rgba(2,12,26,.45) 100%);pointer-events:none}
[data-theme=aquarium] .theme-backdrop span{display:none}
[data-theme=detective] .theme-backdrop{background:#1c120d}
[data-theme=detective] .theme-backdrop::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(28,18,13,.08) 0%,rgba(22,13,9,.36) 72%,rgba(12,6,4,.68) 100%);pointer-events:none}
[data-theme=detective] .theme-backdrop span{display:none}
[data-theme=summer] .theme-backdrop{background:#fef9c3}
[data-theme=summer] .theme-backdrop::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(255,251,235,.12) 0%,rgba(254,249,195,.04) 65%,rgba(234,179,8,.14) 100%);pointer-events:none}
[data-theme=summer] .theme-backdrop span{display:none}
#matrix-bg,#space-bg,#ghost-bg,#halloween-bg,#aquarium-bg,#detective-bg,#summer-bg{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}
@media(max-width:639px){.theme-backdrop .tb-a{top:96px;right:-10px;width:30px;height:30px;opacity:.38}.theme-backdrop .tb-b{top:116px;right:12px;width:14px;height:14px;opacity:.42}.theme-backdrop .tb-c{bottom:72px;left:-10px;width:24px;height:24px;opacity:.36}[data-theme=default] .theme-backdrop .tb-a{top:0;right:0;width:148px;height:148px;opacity:.92}[data-theme=default] .theme-backdrop .tb-b{top:0;right:0;width:96px;height:96px;opacity:.34}[data-theme=default] .theme-backdrop .tb-c{top:96px;right:10px;width:11px;height:11px;opacity:.85}[data-theme=default] .theme-backdrop .tb-d{bottom:0;left:0;width:112px;height:112px;opacity:.85}[data-theme=auditor] .theme-backdrop .tb-a{top:0;right:0;width:140px;height:140px;opacity:1}[data-theme=auditor] .theme-backdrop .tb-b{top:0;right:0;width:88px;height:88px;opacity:1}[data-theme=auditor] .theme-backdrop .tb-c{top:96px;left:10px;width:22px;height:22px;opacity:.42}[data-theme=auditor] .theme-backdrop .tb-d{bottom:0;left:0;width:108px;height:108px;opacity:1}}
.cv{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px;align-items:start}
.cv,.cv .s-s,.cv .s-m,.cv .s-l,.cv .s-xl,.cv .s-xxl,.cv .bt,.cv .ch,.cv .cb,.cv .concl,.cv .btn,.cv .ptbl,.cv .ptbl th,.cv .ptbl td{font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0}
.card.box>.bt{font-family:'IBM Plex Sans',system-ui,sans-serif;letter-spacing:0}
.cv.free{display:block;position:relative}.cv.free>.blk{position:absolute;transition:top .24s ease}
.card{border:3px solid var(--ln);background:var(--card);border-radius:var(--r);box-shadow:5px 5px 0 var(--ln)}
[data-theme=default] .card{border:1px solid #4F7A99;border-radius:2px;box-shadow:none}
[data-theme=default] .card.open{border-color:#0D0D0D;box-shadow:0 0 0 1px #0D0D0D}
[data-theme=auditor] .card{border:1px solid #d5dbe5;border-top:3px solid #14243d;border-radius:6px;box-shadow:0 1px 3px rgba(16,24,40,.08)}
[data-theme=cyberpunk] .card{border:1px solid rgba(168,85,247,.44);border-top:2px solid #a855f7;border-radius:4px;background:rgba(19,10,36,.88);backdrop-filter:blur(12px);box-shadow:0 8px 28px rgba(0,0,0,.55),0 0 18px rgba(168,85,247,.12)}
[data-theme=cyberpunk] .card.open{border-color:#ff2a85;border-top-color:#ff2a85;box-shadow:0 10px 30px rgba(0,0,0,.65),0 0 22px rgba(255,42,133,.22)}
[data-theme=hacker] .card{border:1px solid rgba(0,255,102,.44);border-top:2px solid #00ff66;border-radius:4px;background:rgba(4,14,8,.88);backdrop-filter:blur(10px);box-shadow:0 8px 28px rgba(0,0,0,.62),0 0 18px rgba(0,255,102,.08)}
[data-theme=hacker] .card.open{border-color:#00ff66;box-shadow:0 10px 30px rgba(0,0,0,.72),0 0 22px rgba(0,255,102,.2)}
[data-theme=astronomi] .card{border:1px solid rgba(212,212,216,.32);border-top:2px solid #e4e4e7;border-radius:4px;background:rgba(16,16,20,.9);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.68)}
[data-theme=astronomi] .card.open{border-color:#ffffff;border-top-color:#ffffff;box-shadow:0 12px 32px rgba(0,0,0,.78),0 0 18px rgba(255,255,255,.14)}
[data-theme=ghost] .card{border:1px solid rgba(220,38,38,.42);border-top:2px solid #dc2626;border-radius:4px;background:rgba(18,7,9,.88);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.68),0 0 18px rgba(185,28,28,.12)}
[data-theme=ghost] .card.open{border-color:#ef4444;border-top-color:#ef4444;box-shadow:0 12px 32px rgba(0,0,0,.76),0 0 22px rgba(220,38,38,.28)}
[data-theme=halloween] .card{border:1px solid rgba(249,115,22,.44);border-top:2px solid #f97316;border-radius:4px;background:rgba(20,11,24,.9);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.68),0 0 18px rgba(249,115,22,.12)}
[data-theme=halloween] .card.open{border-color:#fb923c;border-top-color:#fb923c;box-shadow:0 12px 32px rgba(0,0,0,.76),0 0 22px rgba(249,115,22,.28)}
[data-theme=aquarium] .card{border:1px solid rgba(56,189,248,.44);border-top:2px solid #0ea5e9;border-radius:6px;background:rgba(6,30,56,.88);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(2,14,30,.6),0 0 18px rgba(14,165,233,.14)}
[data-theme=aquarium] .card.open{border-color:#7dd3fc;border-top-color:#38bdf8;box-shadow:0 12px 32px rgba(2,14,30,.72),0 0 22px rgba(56,189,248,.3)}
[data-theme=detective] .card{border:1px solid rgba(166,124,82,.48);border-top:2px solid #d4a373;border-radius:4px;background:rgba(38,23,16,.9);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(10,5,3,.66),0 0 18px rgba(140,90,60,.14)}
[data-theme=detective] .card.open{border-color:#d4a373;border-top-color:#e6ccb2;box-shadow:0 12px 32px rgba(10,5,3,.74),0 0 22px rgba(212,163,115,.24)}
[data-theme=summer] .card{border:1.5px solid rgba(234,179,8,.72);border-top:3px solid #f59e0b;border-radius:10px;background:rgba(255,251,235,.92);color:#422006;box-shadow:0 10px 28px rgba(133,77,14,.16),0 0 18px rgba(250,204,21,.22)}
[data-theme=summer] .card.open{border-color:#ca8a04;border-top-color:#d97706;box-shadow:0 12px 32px rgba(133,77,14,.22),0 0 22px rgba(250,204,21,.36)}
.ch{display:flex;width:100%;gap:10px;align-items:center;text-align:left;background:none;border:0;padding:14px;min-height:52px;font-weight:600;font-size:17px;line-height:1.4;cursor:pointer}
.ch .n{flex:none;min-width:30px;height:30px;padding:0 6px;border:3px solid var(--ln);border-radius:999px;display:grid;place-items:center;background:var(--acc2);font-size:14px;line-height:1;font-family:'Space Mono',monospace}
[data-theme=default] .ch{padding:16px;min-height:56px}
[data-theme=default] .ch .n{border:0;border-radius:0;clip-path:polygon(25% 0%,75% 0%,100% 25%,100% 75%,75% 100%,25% 100%,0% 75%,0% 25%);background:#A9C6DC;color:#0D0D0D}
[data-theme=default] .card.open .n{background:#D4A72C;color:#0D0D0D}
[data-theme=auditor] .ch{padding:14px 16px 16px 16px;min-height:54px}
[data-theme=auditor] .ch .n{border:0;border-radius:4px;background:#14243d;color:#fff}
[data-theme=auditor] .card.open .n{background:#b08d3c;color:#14243d}
[data-theme=cyberpunk] .ch{padding:15px 16px 16px 16px;min-height:55px;color:#f3e8ff}
[data-theme=cyberpunk] .ch .n{border:1.5px solid #a855f7;border-radius:4px;background:rgba(168,85,247,.16);color:#d8b4fe}
[data-theme=cyberpunk] .card.open .n{background:#ff2a85;border-color:#ff2a85;color:#fff}
[data-theme=hacker] .ch{padding:15px 16px 16px 16px;min-height:55px;color:#d9ffe5}
[data-theme=hacker] .ch .n{border:1.5px solid #00ff66;border-radius:3px;background:rgba(0,255,102,.14);color:#00ff66}
[data-theme=hacker] .card.open .n{background:#00ff66;border-color:#00ff66;color:#030804}
[data-theme=astronomi] .ch{padding:15px 16px 16px 16px;min-height:55px;color:#f4f4f5}
[data-theme=astronomi] .ch .n{border:1px solid rgba(228,228,231,.58);border-radius:4px;background:rgba(255,255,255,.1);color:#f4f4f5}
[data-theme=astronomi] .card.open .n{background:#ffffff;border-color:#ffffff;color:#050507}
[data-theme=ghost] .ch{padding:15px 16px 16px 16px;min-height:55px;color:#f4eaea}
[data-theme=ghost] .ch .n{border:1.5px solid #dc2626;border-radius:4px;background:rgba(185,28,28,.22);color:#fca5a5}
[data-theme=ghost] .card.open .n{background:#b91c1c;border-color:#ef4444;color:#fff}
[data-theme=halloween] .ch{padding:15px 16px 16px 16px;min-height:55px;color:#fff4e8}
[data-theme=halloween] .ch .n{border:1.5px solid #f97316;border-radius:4px;background:rgba(249,115,22,.2);color:#fdba74}
[data-theme=halloween] .card.open .n{background:#f97316;border-color:#fb923c;color:#09060d}
[data-theme=aquarium] .ch{padding:15px 16px 16px 16px;min-height:55px;color:#eef8ff}
[data-theme=aquarium] .ch .n{border:1.5px solid #0ea5e9;border-radius:6px;background:rgba(14,165,233,.22);color:#7dd3fc}
[data-theme=aquarium] .card.open .n{background:#38bdf8;border-color:#7dd3fc;color:#04182e}
[data-theme=detective] .ch{padding:15px 16px 16px 16px;min-height:55px;color:#f5ebe0}
[data-theme=detective] .ch .n{border:1.5px solid #a67c52;border-radius:4px;background:rgba(140,90,60,.28);color:#e6ccb2}
[data-theme=detective] .card.open .n{background:#d4a373;border-color:#e6ccb2;color:#1c120d}
[data-theme=summer] .ch{padding:15px 16px 16px 16px;min-height:55px;color:#422006}
[data-theme=summer] .ch .n{border:1.5px solid #ca8a04;border-radius:999px;background:#fef08a;color:#713f12}
[data-theme=summer] .card.open .n{background:#facc15;border-color:#b45309;color:#422006}
.cb{display:none;margin:0 14px 14px;padding-top:12px;border-top:3px dashed var(--ln)}.card.open .cb{display:block}
[data-theme=default] .cb,[data-theme=auditor] .cb,[data-theme=cyberpunk] .cb,[data-theme=hacker] .cb,[data-theme=astronomi] .cb,[data-theme=ghost] .cb,[data-theme=halloween] .cb,[data-theme=aquarium] .cb,[data-theme=detective] .cb,[data-theme=summer] .cb{margin:0 16px 16px;padding-top:14px}
[data-theme=default] .cb{border-top:1px solid #A9C6DC}
[data-theme=auditor] .cb{border-top:1px solid #e1e6ee}
[data-theme=cyberpunk] .cb{border-top:1px dashed rgba(168,85,247,.4)}
[data-theme=hacker] .cb{border-top:1px dashed rgba(0,255,102,.4)}
[data-theme=astronomi] .cb{border-top:1px solid rgba(212,212,216,.28)}
[data-theme=ghost] .cb{border-top:1px dashed rgba(220,38,38,.42)}
[data-theme=halloween] .cb{border-top:1px dashed rgba(249,115,22,.42)}
[data-theme=aquarium] .cb{border-top:1px dashed rgba(56,189,248,.4)}
[data-theme=detective] .cb{border-top:1px dashed rgba(212,163,115,.4)}
[data-theme=summer] .cb{border-top:1.5px dashed rgba(234,179,8,.56)}
.concl{margin-top:12px;border:3px solid var(--ln);background:var(--acc2);padding:16px;border-radius:var(--r);box-shadow:5px 5px 0 var(--ln);font-weight:500;line-height:1.5}
[data-theme=default] .concl{background:#fff;color:#0D0D0D;border:1px solid #4F7A99;border-top:2px solid #0D0D0D;padding:17px 18px 18px 18px;box-shadow:none}
[data-theme=auditor] .concl{background:#eef2f8;color:#14243d;border:1px solid #d5dbe5;border-top:3px solid #14243d;padding:16px 18px 18px 18px;border-radius:6px;box-shadow:none}
[data-theme=cyberpunk] .concl{background:rgba(24,12,46,.92);color:#f3e8ff;border:1px solid #ff2a85;border-left:4px solid #fcee0a;padding:18px 18px 18px 15px;box-shadow:0 8px 24px rgba(0,0,0,.55)}
[data-theme=hacker] .concl{background:rgba(4,16,9,.92);color:#d9ffe5;border:1px solid rgba(0,255,102,.55);border-top:2px solid #00ff66;padding:17px 18px 18px 18px;box-shadow:0 8px 24px rgba(0,0,0,.62),0 0 18px rgba(0,255,102,.14)}
[data-theme=astronomi] .concl{background:rgba(16,16,20,.94);color:#f4f4f5;border:1px solid rgba(212,212,216,.42);border-top:2px solid #ffffff;padding:17px 18px 18px 18px;box-shadow:0 10px 28px rgba(0,0,0,.68)}
[data-theme=ghost] .concl{background:rgba(20,7,9,.92);color:#f4eaea;border:1px solid rgba(220,38,38,.56);border-top:2px solid #dc2626;padding:17px 18px 18px 18px;box-shadow:0 10px 28px rgba(0,0,0,.7),0 0 18px rgba(185,28,28,.18)}
[data-theme=halloween] .concl{background:rgba(24,12,28,.92);color:#fff4e8;border:1px solid rgba(249,115,22,.56);border-top:2px solid #f97316;padding:17px 18px 18px 18px;box-shadow:0 10px 28px rgba(0,0,0,.7),0 0 18px rgba(249,115,22,.18)}
[data-theme=aquarium] .concl{background:rgba(6,32,60,.9);color:#eef8ff;border:1px solid rgba(56,189,248,.56);border-top:2px solid #38bdf8;padding:17px 18px 18px 18px;box-shadow:0 10px 28px rgba(2,14,30,.66),0 0 18px rgba(14,165,233,.2)}
[data-theme=detective] .concl{background:rgba(44,27,19,.92);color:#f5ebe0;border:1px solid rgba(212,163,115,.54);border-top:2px solid #d4a373;padding:17px 18px 18px 18px;box-shadow:0 10px 28px rgba(10,5,3,.68),0 0 18px rgba(212,163,115,.16)}
[data-theme=summer] .concl{background:rgba(254,249,195,.94);color:#422006;border:1.5px solid rgba(234,179,8,.78);border-top:3px solid #f59e0b;border-radius:10px;padding:17px 18px 18px 18px;box-shadow:0 10px 28px rgba(133,77,14,.16),0 0 18px rgba(250,204,21,.24)}
[data-theme=default] .cv .btn,[data-theme=auditor] .cv .btn,[data-theme=cyberpunk] .cv .btn,[data-theme=hacker] .cv .btn,[data-theme=astronomi] .cv .btn,[data-theme=ghost] .cv .btn,[data-theme=halloween] .cv .btn,[data-theme=aquarium] .cv .btn,[data-theme=detective] .cv .btn,[data-theme=summer] .cv .btn{padding:8px 14px}
.term{border:0;border-bottom:2px solid var(--acc);background:var(--acc3);padding:0 4px;font:inherit;font-weight:600;border-radius:3px;cursor:pointer}
[data-theme=default] .term{background:#EEF1F4;color:#7A5C00;border-bottom:2px solid #7A5C00}
[data-theme=cyberpunk] .term{background:rgba(252,238,10,.16);color:#fcee0a;border-bottom:2px solid #fcee0a}
[data-theme=hacker] .term{background:rgba(0,255,102,.15);color:#8dffb0;border-bottom:2px solid #00ff66}
[data-theme=astronomi] .term{background:rgba(255,255,255,.16);color:#ffffff;border-bottom:2px solid #ffffff}
[data-theme=ghost] .term{background:rgba(220,38,38,.2);color:#fecaca;border-bottom:2px solid #dc2626}
[data-theme=halloween] .term{background:rgba(249,115,22,.22);color:#fed7aa;border-bottom:2px solid #f97316}
[data-theme=aquarium] .term{background:rgba(14,165,233,.24);color:#bae6fd;border-bottom:2px solid #38bdf8}
[data-theme=detective] .term{background:rgba(212,163,115,.2);color:#f5ebe0;border-bottom:2px solid #d4a373}
[data-theme=summer] .term{background:rgba(250,204,21,.36);color:#422006;border-bottom:2px solid #ca8a04}
.term.mt{background:var(--acc2);border-bottom-color:var(--ln);cursor:pointer}
[data-theme=default] .term.mt{background:#A9C6DC;color:#0D0D0D;border-bottom-color:#0D0D0D}
[data-theme=cyberpunk] .term.mt{background:rgba(255,42,133,.2);color:#ff85bf;border-bottom-color:#ff2a85}
[data-theme=hacker] .term.mt{background:rgba(0,200,83,.22);color:#00ff66;border-bottom-color:#8dffb0}
[data-theme=astronomi] .term.mt{background:rgba(161,161,170,.2);color:#e4e4e7;border-bottom-color:#a1a1aa}
[data-theme=ghost] .term.mt{background:rgba(127,29,29,.36);color:#fca5a5;border-bottom-color:#ef4444}
[data-theme=halloween] .term.mt{background:rgba(251,191,36,.2);color:#fde68a;border-bottom-color:#fbbf24}
[data-theme=aquarium] .term.mt{background:rgba(2,132,199,.3);color:#7dd3fc;border-bottom-color:#0ea5e9}
[data-theme=detective] .term.mt{background:rgba(140,90,60,.34);color:#e6ccb2;border-bottom-color:#a67c52}
[data-theme=summer] .term.mt{background:rgba(251,146,60,.24);color:#7c2d12;border-bottom-color:#ea580c}
.s-s{font-size:14px;line-height:1.5}.s-m{font-size:18px;line-height:1.5}.s-l{font-size:28px;line-height:1.22}.s-xl{font-size:clamp(28px,5vw,46px);line-height:1.12}.s-xxl{font-size:clamp(38px,8vw,80px);line-height:1.06}
[data-theme=cyberpunk] .s-l,[data-theme=cyberpunk] .s-xl,[data-theme=cyberpunk] .s-xxl{text-shadow:0 0 18px rgba(168,85,247,.32)}
[data-theme=hacker] .s-l,[data-theme=hacker] .s-xl,[data-theme=hacker] .s-xxl{color:#e6fff0;text-shadow:0 0 16px rgba(0,255,102,.22)}
[data-theme=astronomi] .s-l,[data-theme=astronomi] .s-xl,[data-theme=astronomi] .s-xxl{color:#ffffff;text-shadow:0 0 22px rgba(255,255,255,.16)}
[data-theme=ghost] .s-l,[data-theme=ghost] .s-xl,[data-theme=ghost] .s-xxl{color:#faf0f0;text-shadow:0 2px 14px rgba(0,0,0,.85),0 0 18px rgba(220,38,38,.26)}
[data-theme=halloween] .s-l,[data-theme=halloween] .s-xl,[data-theme=halloween] .s-xxl{color:#fff6ed;text-shadow:0 2px 14px rgba(0,0,0,.86),0 0 18px rgba(249,115,22,.26)}
[data-theme=aquarium] .s-l,[data-theme=aquarium] .s-xl,[data-theme=aquarium] .s-xxl{color:#f0f9ff;text-shadow:0 2px 14px rgba(2,16,36,.85),0 0 18px rgba(56,189,248,.28)}
[data-theme=detective] .s-l,[data-theme=detective] .s-xl,[data-theme=detective] .s-xxl{color:#faf3ea;text-shadow:0 2px 14px rgba(10,5,3,.88),0 0 18px rgba(212,163,115,.22)}
[data-theme=summer] .s-l,[data-theme=summer] .s-xl,[data-theme=summer] .s-xxl{color:#422006;text-shadow:0 2px 12px rgba(255,251,235,.92),0 0 18px rgba(254,240,138,.72)}
.a-l{text-align:left}.a-c{text-align:center}.a-r{text-align:right}.bd{font-weight:700}
.box{padding:16px}[data-theme=default] .box{padding:18px}[data-theme=auditor] .box{padding:16px 18px 18px 18px}[data-theme=cyberpunk] .box,[data-theme=hacker] .box,[data-theme=astronomi] .box,[data-theme=ghost] .box,[data-theme=halloween] .box,[data-theme=aquarium] .box,[data-theme=detective] .box,[data-theme=summer] .box{padding:17px 18px 18px 18px}
.bt{font-weight:600;font-size:20px;line-height:1.4;margin-bottom:12px;padding-bottom:7px;border-bottom:2px solid rgba(17,17,17,.14)}
.cv .bt.bt-sub{margin-top:6px;margin-bottom:0}
.cv>.blk:first-child>.bt.bt-sub{margin-top:0}
[data-theme=default] .bt{color:#0D0D0D;border-bottom:1px solid #A9C6DC;padding-bottom:8px}
[data-theme=auditor] .bt{color:#14243d;border-bottom:1px solid #e1e6ee;padding-bottom:8px}
[data-theme=cyberpunk] .bt{color:#d8b4fe;border-bottom:1px solid rgba(168,85,247,.32);padding-bottom:8px}
[data-theme=hacker] .bt{color:#00ff66;border-bottom:1px solid rgba(0,255,102,.32);padding-bottom:8px}
[data-theme=astronomi] .bt{color:#ffffff;border-bottom:1px solid rgba(212,212,216,.28);padding-bottom:8px}
[data-theme=ghost] .bt{color:#fca5a5;border-bottom:1px solid rgba(220,38,38,.34);padding-bottom:8px}
[data-theme=halloween] .bt{color:#fdba74;border-bottom:1px solid rgba(249,115,22,.34);padding-bottom:8px}
[data-theme=aquarium] .bt{color:#7dd3fc;border-bottom:1px solid rgba(56,189,248,.34);padding-bottom:8px}
[data-theme=detective] .bt{color:#e6ccb2;border-bottom:1px solid rgba(212,163,115,.36);padding-bottom:8px}
[data-theme=summer] .bt{color:#713f12;border-bottom:1.5px solid rgba(234,179,8,.52);padding-bottom:8px}
.ptbl-wrap{width:100%;max-width:100%;overflow-x:auto;padding:0 0 5px 0}
.ptbl{width:100%;table-layout:fixed;border-collapse:collapse;font-size:15.5px;line-height:1.45}
.ptbl th,.ptbl td{padding:10px 14px;text-align:left;vertical-align:top;overflow-wrap:break-word;word-break:normal}
.ptbl th{font-weight:600;border-bottom:3px solid var(--ln);background:var(--acc3)}
.ptbl td{border-bottom:2px solid var(--ln);background:var(--card)}
.ptbl{border:3px solid var(--ln);box-shadow:5px 5px 0 var(--ln);background:var(--card)}
.ptbl tbody tr:last-child td{border-bottom:0}
.ptbl th+th,.ptbl td+td{border-left:2px solid var(--ln)}
[data-theme=default] .ptbl{border:0;box-shadow:none;background:transparent}
[data-theme=default] .ptbl th{background:#E1E7EE;color:#0D0D0D;border-top:1px solid #4F7A99;border-bottom:2px solid #0D0D0D;padding-top:11px;padding-bottom:11px}
[data-theme=default] .ptbl td{background:transparent;border-bottom:1px solid #C8D4E0;padding-top:11px;padding-bottom:11px}
[data-theme=default] .ptbl tbody tr:last-child td{border-bottom:1px solid #4F7A99}
[data-theme=default] .ptbl tbody tr:nth-child(even) td{background:rgba(255,255,255,.55)}
[data-theme=default] .ptbl th+th,[data-theme=default] .ptbl td+td{border-left:1px solid #D3DCE6}
[data-theme=auditor] .ptbl{border:1px solid #d5dbe5;border-top:3px solid #14243d;box-shadow:0 1px 3px rgba(16,24,40,.08);background:#fff}
[data-theme=auditor] .ptbl th{background:#14243d;color:#fff;border-bottom:2px solid #b08d3c;padding-top:11px;padding-bottom:11px}
[data-theme=auditor] .ptbl td{border-bottom:1px solid #e1e6ee;padding-top:11px;padding-bottom:11px}
[data-theme=auditor] .ptbl tbody tr:last-child td{border-bottom:0}
[data-theme=auditor] .ptbl th+th{border-left:1px solid rgba(255,255,255,.16)}
[data-theme=auditor] .ptbl td+td{border-left:1px solid #e1e6ee}
[data-theme=cyberpunk] .ptbl{border:1px solid rgba(168,85,247,.46);box-shadow:0 8px 26px rgba(0,0,0,.55);background:rgba(16,9,32,.9)}
[data-theme=cyberpunk] .ptbl th{background:rgba(168,85,247,.16);color:#d8b4fe;border-bottom:2px solid #a855f7;padding-top:11px;padding-bottom:11px}
[data-theme=cyberpunk] .ptbl td{background:transparent;border-bottom:1px solid rgba(168,85,247,.2);color:#f3e8ff;padding-top:11px;padding-bottom:11px}
[data-theme=cyberpunk] .ptbl tbody tr:nth-child(even) td{background:rgba(168,85,247,.04)}
[data-theme=cyberpunk] .ptbl tbody tr:last-child td{border-bottom:0}
[data-theme=cyberpunk] .ptbl th+th,[data-theme=cyberpunk] .ptbl td+td{border-left:1px solid rgba(168,85,247,.2)}
[data-theme=hacker] .ptbl{border:1px solid rgba(0,255,102,.45);box-shadow:0 8px 26px rgba(0,0,0,.62);background:rgba(4,14,8,.9)}
[data-theme=hacker] .ptbl th{background:rgba(0,255,102,.14);color:#00ff66;border-bottom:2px solid #00ff66;padding-top:11px;padding-bottom:11px}
[data-theme=hacker] .ptbl td{background:transparent;border-bottom:1px solid rgba(0,255,102,.22);color:#d9ffe5;padding-top:11px;padding-bottom:11px}
[data-theme=hacker] .ptbl tbody tr:nth-child(even) td{background:rgba(0,255,102,.04)}
[data-theme=hacker] .ptbl tbody tr:last-child td{border-bottom:0}
[data-theme=hacker] .ptbl th+th,[data-theme=hacker] .ptbl td+td{border-left:1px solid rgba(0,255,102,.22)}
[data-theme=astronomi] .ptbl{border:1px solid rgba(212,212,216,.34);box-shadow:0 10px 28px rgba(0,0,0,.68);background:rgba(14,14,18,.92)}
[data-theme=astronomi] .ptbl th{background:rgba(255,255,255,.11);color:#ffffff;border-bottom:2px solid #d4d4d8;padding-top:11px;padding-bottom:11px}
[data-theme=astronomi] .ptbl td{background:transparent;border-bottom:1px solid rgba(212,212,216,.18);color:#f4f4f5;padding-top:11px;padding-bottom:11px}
[data-theme=astronomi] .ptbl tbody tr:nth-child(even) td{background:rgba(255,255,255,.035)}
[data-theme=astronomi] .ptbl tbody tr:last-child td{border-bottom:0}
[data-theme=astronomi] .ptbl th+th,[data-theme=astronomi] .ptbl td+td{border-left:1px solid rgba(212,212,216,.18)}
[data-theme=ghost] .ptbl{border:1px solid rgba(220,38,38,.45);box-shadow:0 10px 28px rgba(0,0,0,.68);background:rgba(16,6,8,.92)}
[data-theme=ghost] .ptbl th{background:rgba(185,28,28,.22);color:#fecaca;border-bottom:2px solid #dc2626;padding-top:11px;padding-bottom:11px}
[data-theme=ghost] .ptbl td{background:transparent;border-bottom:1px solid rgba(220,38,38,.2);color:#f4eaea;padding-top:11px;padding-bottom:11px}
[data-theme=ghost] .ptbl tbody tr:nth-child(even) td{background:rgba(220,38,38,.045)}
[data-theme=ghost] .ptbl tbody tr:last-child td{border-bottom:0}
[data-theme=ghost] .ptbl th+th,[data-theme=ghost] .ptbl td+td{border-left:1px solid rgba(220,38,38,.2)}
[data-theme=halloween] .ptbl{border:1px solid rgba(249,115,22,.45);box-shadow:0 10px 28px rgba(0,0,0,.68);background:rgba(18,9,22,.92)}
[data-theme=halloween] .ptbl th{background:rgba(249,115,22,.2);color:#fed7aa;border-bottom:2px solid #f97316;padding-top:11px;padding-bottom:11px}
[data-theme=halloween] .ptbl td{background:transparent;border-bottom:1px solid rgba(249,115,22,.2);color:#fff4e8;padding-top:11px;padding-bottom:11px}
[data-theme=halloween] .ptbl tbody tr:nth-child(even) td{background:rgba(249,115,22,.045)}
[data-theme=halloween] .ptbl tbody tr:last-child td{border-bottom:0}
[data-theme=halloween] .ptbl th+th,[data-theme=halloween] .ptbl td+td{border-left:1px solid rgba(249,115,22,.2)}
[data-theme=aquarium] .ptbl{border:1px solid rgba(56,189,248,.45);box-shadow:0 10px 28px rgba(2,14,30,.64);background:rgba(6,28,52,.92)}
[data-theme=aquarium] .ptbl th{background:rgba(14,165,233,.22);color:#bae6fd;border-bottom:2px solid #0ea5e9;padding-top:11px;padding-bottom:11px}
[data-theme=aquarium] .ptbl td{background:transparent;border-bottom:1px solid rgba(56,189,248,.22);color:#eef8ff;padding-top:11px;padding-bottom:11px}
[data-theme=aquarium] .ptbl tbody tr:nth-child(even) td{background:rgba(14,165,233,.05)}
[data-theme=aquarium] .ptbl tbody tr:last-child td{border-bottom:0}
[data-theme=aquarium] .ptbl th+th,[data-theme=aquarium] .ptbl td+td{border-left:1px solid rgba(56,189,248,.22)}
[data-theme=detective] .ptbl{border:1px solid rgba(166,124,82,.48);box-shadow:0 10px 28px rgba(10,5,3,.66);background:rgba(34,20,14,.94)}
[data-theme=detective] .ptbl th{background:rgba(140,90,60,.3);color:#e6ccb2;border-bottom:2px solid #d4a373;padding-top:11px;padding-bottom:11px}
[data-theme=detective] .ptbl td{background:transparent;border-bottom:1px solid rgba(166,124,82,.24);color:#f5ebe0;padding-top:11px;padding-bottom:11px}
[data-theme=detective] .ptbl tbody tr:nth-child(even) td{background:rgba(212,163,115,.05)}
[data-theme=detective] .ptbl tbody tr:last-child td{border-bottom:0}
[data-theme=detective] .ptbl th+th,[data-theme=detective] .ptbl td+td{border-left:1px solid rgba(166,124,82,.24)}
[data-theme=summer] .ptbl{border:1.5px solid rgba(234,179,8,.72);box-shadow:0 10px 28px rgba(133,77,14,.15);background:rgba(255,251,235,.95);color:#422006}
[data-theme=summer] .ptbl th{background:#fef08a;color:#422006;border-bottom:2px solid #eab308;padding-top:11px;padding-bottom:11px}
[data-theme=summer] .ptbl td{background:transparent;border-bottom:1px solid rgba(234,179,8,.34);color:#422006;padding-top:11px;padding-bottom:11px}
[data-theme=summer] .ptbl tbody tr:nth-child(even) td{background:rgba(254,240,138,.25)}
[data-theme=summer] .ptbl tbody tr:last-child td{border-bottom:0}
[data-theme=summer] .ptbl th+th,[data-theme=summer] .ptbl td+td{border-left:1px solid rgba(234,179,8,.34)}
@media(max-width:639px){.ptbl{font-size:14px}.ptbl th,.ptbl td{padding:8px 10px}}
@media(max-width:480px){main{padding:14px 12px 28px}.s-xl{font-size:clamp(24px,6vw,32px)}.s-xxl{font-size:clamp(26px,7vw,32px)}.s-l{font-size:clamp(20px,5vw,24px)}}
.im-frame{position:relative;display:block;width:100%;padding:8px;border:3px solid var(--ln);border-radius:var(--r);background:var(--acc3);box-shadow:5px 5px 0 var(--ln);overflow:hidden}
.im-frame .im{display:block;width:100%;height:auto;border-radius:calc(var(--r) - 4px);border:2px solid var(--ln)}
[data-theme=default] .im-frame{padding:8px;border:1px solid #4F7A99;border-radius:2px;background:#fff;box-shadow:none}
[data-theme=default] .im-frame::after{content:"";position:absolute;top:0;right:0;width:10px;height:10px;background:#A9C6DC;clip-path:polygon(0 0,100% 0,100% 100%);pointer-events:none}
[data-theme=default] .im-frame .im{border:1px solid rgba(79,122,153,.28);border-radius:1px}
[data-theme=auditor] .im-frame{padding:10px;border:1px solid #d5dbe5;border-top:3px solid #14243d;border-radius:6px;background:#fff;box-shadow:0 2px 8px rgba(16,24,40,.08)}
[data-theme=auditor] .im-frame .im{border:1px solid #e1e6ee;border-radius:3px}
[data-theme=cyberpunk] .im-frame{padding:8px;border:1px solid rgba(168,85,247,.56);border-top:2px solid #ff2a85;border-bottom:2px solid #a855f7;border-radius:4px;background:rgba(18,10,34,.9);backdrop-filter:blur(10px);box-shadow:0 8px 26px rgba(0,0,0,.6),0 0 18px rgba(168,85,247,.2)}
[data-theme=cyberpunk] .im-frame .im{border:1px solid rgba(255,42,133,.35);border-radius:2px}
[data-theme=hacker] .im-frame{padding:8px;border:1px solid rgba(0,255,102,.54);border-top:2px solid #00ff66;border-radius:4px;background:rgba(4,14,8,.92);backdrop-filter:blur(8px);box-shadow:0 8px 26px rgba(0,0,0,.68),0 0 18px rgba(0,255,102,.14)}
[data-theme=hacker] .im-frame .im{border:1px solid rgba(0,255,102,.3);border-radius:2px}
[data-theme=astronomi] .im-frame{padding:9px;border:1px solid rgba(212,212,216,.38);border-top:2px solid #fff;border-radius:4px;background:rgba(16,16,20,.92);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.72),0 0 16px rgba(255,255,255,.08)}
[data-theme=astronomi] .im-frame .im{border:1px solid rgba(255,255,255,.18);border-radius:2px}
[data-theme=ghost] .im-frame{padding:9px;border:1px solid rgba(220,38,38,.52);border-top:2px solid #dc2626;border-radius:4px;background:rgba(18,7,9,.92);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.74),0 0 18px rgba(185,28,28,.18)}
[data-theme=ghost] .im-frame .im{border:1px solid rgba(220,38,38,.32);border-radius:2px}
[data-theme=halloween] .im-frame{padding:9px;border:1px solid rgba(249,115,22,.54);border-top:2px solid #f97316;border-bottom:2px solid #fbbf24;border-radius:4px;background:rgba(20,11,24,.92);backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.72),0 0 18px rgba(249,115,22,.2)}
[data-theme=halloween] .im-frame .im{border:1px solid rgba(251,191,36,.32);border-radius:2px}
[data-theme=aquarium] .im-frame{padding:9px;border:1.5px solid rgba(56,189,248,.52);border-top:2px solid #38bdf8;border-radius:8px;background:rgba(6,30,56,.92);box-shadow:0 10px 30px rgba(2,14,30,.68),0 0 18px rgba(14,165,233,.22),inset 0 0 14px rgba(56,189,248,.1)}
[data-theme=aquarium] .im-frame .im{border:1px solid rgba(125,211,252,.34);border-radius:4px}
[data-theme=detective] .im-frame{padding:9px;border:1px solid rgba(166,124,82,.62);border-top:2px solid #d4a373;border-radius:4px;background:rgba(38,23,16,.94);box-shadow:0 10px 28px rgba(10,5,3,.72),0 0 18px rgba(212,163,115,.14)}
[data-theme=detective] .im-frame::after{content:"";position:absolute;top:5px;right:6px;width:8px;height:8px;border-radius:999px;background:#d4a373;box-shadow:0 1px 3px rgba(10,5,3,.75);pointer-events:none}
[data-theme=detective] .im-frame .im{border:1px solid rgba(230,204,178,.3);border-radius:2px}
[data-theme=summer] .im-frame{padding:9px;border:1.5px solid rgba(234,179,8,.76);border-top:3px solid #f59e0b;border-radius:10px;background:rgba(255,251,235,.95);box-shadow:0 10px 26px rgba(133,77,14,.16),0 0 16px rgba(250,204,21,.22)}
[data-theme=summer] .im-frame::after{content:"";position:absolute;top:5px;right:6px;width:8px;height:8px;border-radius:999px;background:#facc15;box-shadow:0 0 6px rgba(234,179,8,.85);pointer-events:none}
[data-theme=summer] .im-frame .im{border:1px solid rgba(234,179,8,.42);border-radius:6px}
nav{flex:0 0 auto;position:relative;display:flex;align-items:center;gap:10px;padding:8px ${hasByok ? '84px' : '16px'} 12px 16px;background:transparent;border-top:0;z-index:15}
[data-theme=default] nav,[data-theme=auditor] nav{border-top:0;background:transparent}
[data-theme=cyberpunk] nav,[data-theme=hacker] nav,[data-theme=astronomi] nav,[data-theme=ghost] nav,[data-theme=halloween] nav,[data-theme=aquarium] nav,[data-theme=detective] nav{background:transparent;border-top:0;text-shadow:0 1px 8px rgba(2,4,12,.92)}
[data-theme=summer] nav{background:transparent;border-top:0;color:#422006;text-shadow:0 1px 6px rgba(255,251,235,.9)}
.prog{flex:1;height:14px;border:3px solid var(--ln);border-radius:99px;background:var(--card);overflow:hidden}.prog i{display:block;height:100%;background:var(--acc)}
[data-theme=default] .prog{height:6px;border:1px solid #4F7A99;border-radius:0}
[data-theme=cyberpunk] .prog{height:8px;border:1px solid rgba(168,85,247,.55);border-radius:2px;background:rgba(9,6,18,.9)}
[data-theme=cyberpunk] .prog i{background:linear-gradient(90deg,#a855f7,#ff2a85)}
[data-theme=hacker] .prog{height:8px;border:1px solid rgba(0,255,102,.55);border-radius:2px;background:rgba(3,10,5,.9)}
[data-theme=hacker] .prog i{background:linear-gradient(90deg,#00c853,#00ff66)}
[data-theme=astronomi] .prog{height:6px;border:1px solid rgba(212,212,216,.42);border-radius:2px;background:rgba(10,10,12,.92)}
[data-theme=astronomi] .prog i{background:linear-gradient(90deg,#71717a,#d4d4d8,#ffffff)}
[data-theme=ghost] .prog{height:7px;border:1px solid rgba(220,38,38,.55);border-radius:2px;background:rgba(10,4,5,.9)}
[data-theme=ghost] .prog i{background:linear-gradient(90deg,#7f1d1d,#dc2626,#ef4444)}
[data-theme=halloween] .prog{height:7px;border:1px solid rgba(249,115,22,.55);border-radius:2px;background:rgba(12,7,16,.9)}
[data-theme=halloween] .prog i{background:linear-gradient(90deg,#c2410c,#f97316,#fbbf24)}
[data-theme=aquarium] .prog{height:7px;border:1px solid rgba(56,189,248,.55);border-radius:999px;background:rgba(4,22,44,.9)}
[data-theme=aquarium] .prog i{background:linear-gradient(90deg,#0284c7,#0ea5e9,#7dd3fc)}
[data-theme=detective] .prog{height:7px;border:1px solid rgba(166,124,82,.56);border-radius:3px;background:rgba(24,15,10,.9)}
[data-theme=detective] .prog i{background:linear-gradient(90deg,#8c5a3c,#d4a373,#e6ccb2)}
[data-theme=summer] .prog{height:8px;border:1.5px solid rgba(202,138,4,.72);border-radius:999px;background:rgba(255,251,235,.92)}
[data-theme=summer] .prog i{background:linear-gradient(90deg,#f59e0b,#facc15,#fde047)}
.cnt{font-family:'Space Mono',monospace;font-size:13px;min-width:42px;text-align:center}
#pm{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:30;padding:16px}#pm[hidden]{display:none}
.pmc{background:var(--card);border:3px solid var(--ln);border-radius:14px;padding:18px;width:min(620px,100%);max-height:86vh;overflow:auto}
[data-theme=default] .pmc{border:1.5px solid #0D0D0D;border-radius:2px}
[data-theme=cyberpunk] .pmc{background:rgba(16,9,32,.96);color:#f3e8ff;border:1.5px solid #a855f7;border-radius:8px;box-shadow:0 20px 50px rgba(0,0,0,.78),0 0 24px rgba(168,85,247,.26)}
[data-theme=hacker] .pmc{background:rgba(4,14,8,.96);color:#d9ffe5;border:1.5px solid #00ff66;border-radius:6px;box-shadow:0 20px 50px rgba(0,0,0,.82),0 0 24px rgba(0,255,102,.2)}
[data-theme=astronomi] .pmc{background:rgba(16,16,20,.96);color:#f4f4f5;border:1px solid #d4d4d8;border-radius:6px;box-shadow:0 20px 52px rgba(0,0,0,.86),0 0 24px rgba(255,255,255,.12)}
[data-theme=ghost] .pmc{background:rgba(18,7,9,.96);color:#f4eaea;border:1.5px solid #dc2626;border-radius:6px;box-shadow:0 20px 52px rgba(0,0,0,.86),0 0 24px rgba(220,38,38,.24)}
[data-theme=halloween] .pmc{background:rgba(18,9,22,.96);color:#fff4e8;border:1.5px solid #f97316;border-radius:6px;box-shadow:0 20px 52px rgba(0,0,0,.86),0 0 24px rgba(249,115,22,.24)}
[data-theme=aquarium] .pmc{background:rgba(6,28,52,.96);color:#eef8ff;border:1.5px solid #0ea5e9;border-radius:8px;box-shadow:0 20px 52px rgba(2,12,26,.84),0 0 24px rgba(14,165,233,.24)}
[data-theme=detective] .pmc{background:rgba(34,20,14,.96);color:#f5ebe0;border:1.5px solid #a67c52;border-radius:6px;box-shadow:0 20px 55px rgba(10,5,3,.86),0 0 28px rgba(212,163,115,.2)}
[data-theme=summer] .pmc{background:rgba(255,251,235,.98);color:#422006;border:1.5px solid #eab308;border-radius:10px;box-shadow:0 20px 52px rgba(133,77,14,.24),0 0 26px rgba(250,204,21,.3)}
.fab{position:fixed;right:16px;bottom:12px;width:54px;height:54px;border-radius:50%;border:3px solid var(--ln);background:var(--acc);color:#111;box-shadow:4px 4px 0 var(--ln);z-index:35;font-size:20px;display:grid;place-items:center;cursor:pointer}
[data-theme=default] .fab{border:1.5px solid #0D0D0D;border-radius:2px;background:#D4A72C;color:#0D0D0D;box-shadow:none}
[data-theme=cyberpunk] .fab{border:1.5px solid #fcee0a;background:linear-gradient(135deg,#a855f7,#ff2a85);color:#fff;box-shadow:0 0 18px rgba(168,85,247,.48)}
[data-theme=hacker] .fab{border:1.5px solid #8dffb0;background:#00ff66;color:#030804;box-shadow:0 0 18px rgba(0,255,102,.45)}
[data-theme=astronomi] .fab{border:1px solid #ffffff;background:linear-gradient(135deg,#d4d4d8,#ffffff);color:#050507;box-shadow:0 0 18px rgba(255,255,255,.28)}
[data-theme=ghost] .fab{border:1.5px solid #fca5a5;background:linear-gradient(135deg,#991b1b,#dc2626);color:#fff5f5;box-shadow:0 0 18px rgba(220,38,38,.5)}
[data-theme=halloween] .fab{border:1.5px solid #fed7aa;background:linear-gradient(135deg,#ea580c,#fb923c);color:#09060d;box-shadow:0 0 18px rgba(249,115,22,.5)}
[data-theme=aquarium] .fab{border:1.5px solid #bae6fd;background:linear-gradient(135deg,#0284c7,#38bdf8);color:#031528;box-shadow:0 0 18px rgba(14,165,233,.52)}
[data-theme=detective] .fab{border:1.5px solid #e6ccb2;background:linear-gradient(135deg,#8c5a3c,#d4a373);color:#1c120d;box-shadow:0 0 18px rgba(212,163,115,.44)}
[data-theme=summer] .fab{border:1.5px solid #b45309;background:linear-gradient(135deg,#f59e0b,#fde047);color:#422006;box-shadow:0 6px 18px rgba(133,77,14,.24),0 0 16px rgba(250,204,21,.56)}
.bub{position:fixed;right:16px;bottom:78px;width:min(380px,calc(100vw - 24px));max-height:60vh;display:flex;flex-direction:column;border:3px solid var(--ln);background:var(--card);border-radius:14px;box-shadow:6px 6px 0 var(--ln);z-index:35;overflow:hidden}
[data-theme=default] .bub{border:1px solid #0D0D0D;border-radius:2px;box-shadow:none}
[data-theme=cyberpunk] .bub{border:1.5px solid #a855f7;border-radius:8px;background:rgba(16,9,32,.96);color:#f3e8ff;box-shadow:0 16px 40px rgba(0,0,0,.75)}
[data-theme=hacker] .bub{border:1.5px solid #00ff66;border-radius:6px;background:rgba(4,14,8,.96);color:#d9ffe5;box-shadow:0 16px 40px rgba(0,0,0,.8)}
[data-theme=astronomi] .bub{border:1px solid #d4d4d8;border-radius:6px;background:rgba(16,16,20,.96);color:#f4f4f5;box-shadow:0 16px 42px rgba(0,0,0,.84)}
[data-theme=ghost] .bub{border:1.5px solid #dc2626;border-radius:6px;background:rgba(16,6,8,.96);color:#f4eaea;box-shadow:0 16px 42px rgba(0,0,0,.84)}
[data-theme=halloween] .bub{border:1.5px solid #f97316;border-radius:6px;background:rgba(18,9,22,.96);color:#fff4e8;box-shadow:0 16px 42px rgba(0,0,0,.84)}
[data-theme=aquarium] .bub{border:1.5px solid #0ea5e9;border-radius:8px;background:rgba(6,28,52,.96);color:#eef8ff;box-shadow:0 16px 42px rgba(2,12,26,.82)}
[data-theme=detective] .bub{border:1.5px solid #a67c52;border-radius:6px;background:rgba(34,20,14,.96);color:#f5ebe0;box-shadow:0 16px 42px rgba(10,5,3,.84)}
[data-theme=summer] .bub{border:1.5px solid #eab308;border-radius:10px;background:rgba(255,251,235,.96);color:#422006;box-shadow:0 16px 40px rgba(133,77,14,.22)}
.bubh{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--acc3);border-bottom:3px solid var(--ln);font-weight:700}
[data-theme=default] .bubh{background:#0D0D0D;color:#EEF1F4;border-bottom:2px solid #D4A72C}
[data-theme=cyberpunk] .bubh{background:rgba(168,85,247,.18);color:#f3e8ff;border-bottom:1.5px solid #a855f7}
[data-theme=hacker] .bubh{background:rgba(0,255,102,.14);color:#d9ffe5;border-bottom:1.5px solid #00ff66}
[data-theme=astronomi] .bubh{background:rgba(255,255,255,.08);color:#ffffff;border-bottom:1px solid rgba(212,212,216,.4)}
[data-theme=ghost] .bubh{background:rgba(185,28,28,.22);color:#f4eaea;border-bottom:1.5px solid #dc2626}
[data-theme=halloween] .bubh{background:rgba(249,115,22,.2);color:#fff4e8;border-bottom:1.5px solid #f97316}
[data-theme=aquarium] .bubh{background:rgba(14,165,233,.22);color:#eef8ff;border-bottom:1.5px solid #0ea5e9}
[data-theme=detective] .bubh{background:rgba(140,90,60,.28);color:#f5ebe0;border-bottom:1.5px solid #a67c52}
[data-theme=summer] .bubh{background:#fef08a;color:#422006;border-bottom:1.5px solid #eab308}
.bubm{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px;font-size:14px}
.bmsg{padding:8px 10px;border:2px solid var(--ln);border-radius:10px;max-width:92%}.bmsg.u{align-self:flex-end;background:var(--acc2)}.bmsg.a{align-self:flex-start}
[data-theme=default] .bmsg{border:1px solid #4F7A99;border-radius:2px}[data-theme=default] .bmsg.u{background:#0D0D0D;color:#EEF1F4;border-color:#0D0D0D}[data-theme=default] .bmsg.a{background:#EEF1F4;border-color:#A9C6DC}
[data-theme=cyberpunk] .bmsg{border:1px solid rgba(168,85,247,.38);border-radius:6px}[data-theme=cyberpunk] .bmsg.u{background:rgba(255,42,133,.22);color:#fff;border-color:#ff2a85}[data-theme=cyberpunk] .bmsg.a{background:rgba(24,13,46,.92);color:#f3e8ff}
[data-theme=hacker] .bmsg{border:1px solid rgba(0,255,102,.35);border-radius:4px}[data-theme=hacker] .bmsg.u{background:rgba(0,255,102,.2);color:#e8fff0;border-color:#00ff66}[data-theme=hacker] .bmsg.a{background:rgba(5,18,10,.94);color:#d9ffe5}
[data-theme=astronomi] .bmsg{border:1px solid rgba(212,212,216,.28);border-radius:4px}[data-theme=astronomi] .bmsg.u{background:rgba(255,255,255,.16);color:#ffffff;border-color:#d4d4d8}[data-theme=astronomi] .bmsg.a{background:rgba(24,24,28,.94);color:#f4f4f5}
[data-theme=ghost] .bmsg{border:1px solid rgba(220,38,38,.34);border-radius:4px}[data-theme=ghost] .bmsg.u{background:rgba(185,28,28,.32);color:#fff5f5;border-color:#dc2626}[data-theme=ghost] .bmsg.a{background:rgba(22,9,11,.94);color:#f4eaea}
[data-theme=halloween] .bmsg{border:1px solid rgba(249,115,22,.34);border-radius:4px}[data-theme=halloween] .bmsg.u{background:rgba(234,88,12,.32);color:#fff6ed;border-color:#f97316}[data-theme=halloween] .bmsg.a{background:rgba(24,12,28,.94);color:#fff4e8}
[data-theme=aquarium] .bmsg{border:1px solid rgba(56,189,248,.34);border-radius:6px}[data-theme=aquarium] .bmsg.u{background:rgba(2,132,199,.36);color:#f0f9ff;border-color:#38bdf8}[data-theme=aquarium] .bmsg.a{background:rgba(8,34,62,.94);color:#eef8ff}
[data-theme=detective] .bmsg{border:1px solid rgba(166,124,82,.36);border-radius:4px}[data-theme=detective] .bmsg.u{background:rgba(140,90,60,.38);color:#faf3ea;border-color:#d4a373}[data-theme=detective] .bmsg.a{background:rgba(44,27,19,.94);color:#f5ebe0}
[data-theme=summer] .bmsg{border:1px solid rgba(234,179,8,.48);border-radius:8px}[data-theme=summer] .bmsg.u{background:#fde047;color:#422006;border-color:#ca8a04}[data-theme=summer] .bmsg.a{background:#ffffff;color:#422006}
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
  if(b.t==='title'&&!String(b.text||'').trim())return '';
  let h='';
  if(b.t==='text')h='<div class="s-'+(b.size||'m')+' a-'+(b.align||'l')+(b.b?' bd':'')+'">'+fmt(b.text)+'</div>';
  else if(b.t==='title')h='<div class="bt bt-sub'+(b.align?' a-'+b.align:'')+'">'+fmt(b.text)+'</div>';
  else if(b.t==='img')h=b.src?'<div class="im-frame"><img class="im" src="'+esc(b.src)+'" alt="'+esc(b.alt)+'"></div>':'';
  else if(b.t==='dd'){n++;const o=open.has(b.id);const bd=(b.badge&&String(b.badge).trim())?b.badge:String(n);h='<div class="card'+(o?' open':'')+'"><button class="ch" data-card="'+b.id+'"><span class="n">'+esc(bd)+'</span><span>'+esc(b.text)+'</span></button><div class="cb">'+fmt(b.detail)+'</div></div>'}
  else if(b.t==='box')h='<div class="card box">'+(b.title?'<div class="bt">'+fmt(b.title)+'</div>':'')+'<div class="cv">'+renderBlocks(b.children||[])+'</div></div>';
  else if(b.t==='table'){const hdrs=b.headers||['Kolom 1'],rows=b.rows||[],ws=tblWidths(hdrs,rows,b.w);h='<div class="ptbl-wrap"><table class="ptbl"><colgroup>'+ws.map(w=>'<col style="width:'+w.toFixed(2)+'%">').join('')+'</colgroup><thead><tr>'+hdrs.map(hd=>'<th>'+fmt(hd)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(rw=>'<tr>'+hdrs.map((_,ci)=>'<td>'+fmt((rw||[])[ci]||'')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
  else{const o=open.has(b.id);h='<button class="btn" data-concl="'+b.id+'">'+(o?'Tutup kesimpulan':esc(b.label||'★ Kesimpulan'))+'</button>'+(o?'<div class="concl">'+fmt(b.text)+'</div>':'')}
  const style=b.y!=null?'left:'+Math.max(0,Math.min(100-b.w/12*100,b.x||0))+'%;top:'+b.y+'px;width:'+b.w/12*100+'%':'grid-column:span '+b.w;
  return '<div class="blk" style="'+style+'">'+h+'</div>';
}).join('')};
const descBlocks=(arr,sc)=>{const out=[];arr.forEach(b=>{if(b.t==='text'){const t=stText(b.text);if(t)out.push((sc?'['+sc+'] ':'')+t)}else if(b.t==='title'){const t=stText(b.text);if(t)out.push((sc?'['+sc+' > Judul] ':'[Judul] ')+t)}else if(b.t==='box'){const bt=stText(b.title);const ns=bt?(sc?sc+' > ':'')+'Kartu "'+bt+'"':sc||'Kartu';if(bt)out.push('['+ns+']');out.push(...descBlocks(b.children||[],ns))}else if(b.t==='dd'){const t=stText(b.text),d=stText(b.detail);out.push((sc?'['+sc+'] ':'')+'Poin: '+t+(d?' — '+d:''))}else if(b.t==='concl'){const t=stText(b.text);if(t)out.push('['+(stText(b.label)||'Kesimpulan')+'] '+t)}else if(b.t==='table'){const hs=(b.headers||[]).map(stText).filter(Boolean).join(' | ');const rs=(b.rows||[]).slice(0,8).map(r=>(r||[]).map(stText).join(' | ')).filter(Boolean).join(' ; ');if(hs||rs)out.push('['+(sc?sc+' > ':'')+'Tabel] '+(hs?'Header: '+hs+' ; ':'')+rs)}else if(b.t==='img'&&b.alt){out.push('[Gambar: '+b.alt+']')}});return out};
const callAi=async(q,localCtx)=>{
  if(!byok.length||aiBusy)return;
  msgs.push({r:'u',t:q});aiBusy=true;aiOpen=true;render();
  const sl=deck.slides[idx];
  const slideLines=descBlocks(sl.blocks);
  (sl.modals||[]).forEach(m=>{const ml=descBlocks(m.children||[],'Modal "'+stText(m.title)+'"');if(ml.length)slideLines.push(...ml)});
  const overview=deck.slides.map((s,i)=>'Slide '+(i+1)+(i===idx?' [AKTIF]':'')+': '+descBlocks(s.blocks).slice(0,2).join(' — ').slice(0,160)).join('\\n');
  const curHdr=(typeof sl.headerTitle==='string'?sl.headerTitle:deck.title)||deck.title||'Presentasi';
  const sys='Kamu adalah Orias AI, asisten dalam presentasi "'+curHdr+'" (Slide '+(idx+1)+' dari '+deck.slides.length+').\\nAlur presentasi:\\n'+overview+'\\nMateri lengkap slide aktif:\\n'+slideLines.join('\\n').slice(0,2400)+(localCtx?'\\nKonteks spesifik istilah: '+localCtx:'')+'\\nPahami topik yang sebenarnya sedang dibahas secara menyeluruh. Jika istilah/pertanyaan singkat atau implisit, tafsirkan maknanya sesuai konteks materi di atas. Jawab dalam bahasa Indonesia secara ringkas dan jelas (~100-150 kata).';
  const hist=msgs.filter(m=>m.r!=='e').slice(-8).map(m=>({role:m.r==='u'?'user':'assistant',content:m.t}));
  let reply='';
  for(const k of byok){
    try{
      if(k.provider==='gemini'){
        const gm=k.model||'gemini-4-hydrogen';
        const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(gm)+':generateContent?key='+encodeURIComponent(k.key),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({systemInstruction:{parts:[{text:sys}]},contents:hist.map(h=>({role:h.role==='assistant'?'model':'user',parts:[{text:h.content}]}))})});
        const j=await r.json();if(r.ok&&j.candidates?.[0]?.content?.parts?.[0]?.text){reply=j.candidates[0].content.parts[0].text;break}
      }else if(k.provider==='claude'){
        const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':k.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:k.model||'claude-sonnet-5-5',max_tokens:800,system:sys,messages:hist})});
        const j=await r.json();if(r.ok&&j.content?.[0]?.text){reply=j.content[0].text;break}
      }else{
        const urls={openai:'https://api.openai.com/v1/chat/completions',groq:'https://api.groq.com/openai/v1/chat/completions',openrouter:'https://openrouter.ai/api/v1/chat/completions',deepseek:'https://api.deepseek.com/chat/completions',xai:'https://api.x.ai/v1/chat/completions',mistral:'https://api.mistral.ai/v1/chat/completions'};
        const mods={openai:'gpt-6-luna',groq:'openai/gpt-oss-120b',openrouter:'openai/gpt-6-luna',deepseek:'deepseek-flash',xai:'grok-4.3',mistral:'mistral-small-latest'};
        const r=await fetch(urls[k.provider]||urls.openai,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+k.key},body:JSON.stringify({model:k.model||mods[k.provider]||'gpt-6-luna',messages:[{role:'system',content:sys},...hist]})});
        const j=await r.json();if(r.ok&&j.choices?.[0]?.message?.content){reply=j.choices[0].message.content;break}
      }
    }catch{}
  }
  msgs.push(reply?{r:'a',t:reply}:{r:'e',t:'Gagal menghubungi provider AI.'});
  aiBusy=false;render();
};
const render=()=>{
  const sl=deck.slides[idx],free=sl.blocks.some(b=>b.y!=null);
  const hdrTitle=(typeof sl.headerTitle==='string'?sl.headerTitle:deck.title)||'Presentasi';
  const aiHtml=byok.length?('<button class="fab" id="fab">✦</button>'+(aiOpen?'<div class="bub"><div class="bubh"><span>Orias AI</span><button class="btn" id="cbub" style="padding:2px 8px">✕</button></div><div class="bubm">'+(msgs.length?msgs.map(m=>'<div class="bmsg '+m.r+'">'+fmt(m.t)+'</div>').join(''):'<div class="bmsg a">Klik istilah bertanda kuning untuk penjelasan.</div>')+(aiBusy?'<div class="bmsg a">Sedang berpikir…</div>':'')+'</div></div>':'')):'';
  document.getElementById('app').innerHTML='<div class="theme-backdrop" aria-hidden="true"><span class="tb-a"></span><span class="tb-b"></span><span class="tb-c"></span><span class="tb-d"></span></div><header><div class="brand">'+esc(hdrTitle)+'</div><button class="btn" id="fs">▶</button></header><div class="scroll-area"><main><div class="slide"><div class="cv'+(free?' free':'')+'">'+renderBlocks(sl.blocks)+'</div></div></main></div><nav><button class="btn" id="pv"'+(idx<=0?' disabled':'')+'>◀</button><div class="prog"><i style="width:'+((idx+1)/deck.slides.length*100)+'%"></i></div><span class="cnt">'+(idx+1)+'/'+deck.slides.length+'</span><button class="btn" id="nx"'+(idx>=deck.slides.length-1?' disabled':'')+'>▶</button></nav>'+aiHtml+'<div id="pm"'+(pmId?'':' hidden')+'>'+(pmId?(() => {const m=(sl.modals||[]).find(x=>x.id===pmId);return m?'<div class="pmc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2>'+esc(m.title)+'</h2><button class="btn" id="cpm">✕</button></div><div class="cv">'+renderBlocks(m.children||[])+'</div></div>':'';})():'')+'</div>';
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
if(deck.theme==='hacker'){const mc=document.createElement('canvas');mc.id='matrix-bg';document.body.insertBefore(mc,document.body.firstChild);const ctx=mc.getContext('2d');if(ctx){const ch='01{}[]()<>=;:/\\\\*+->$_&|アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF';let w=0,h=0,cols=0,drops=[],fs=16;const rs=()=>{const d=Math.min(window.devicePixelRatio||1,2);w=window.innerWidth;h=window.innerHeight;mc.width=Math.max(1,Math.floor(w*d));mc.height=Math.max(1,Math.floor(h*d));ctx.setTransform(d,0,0,d,0,0);fs=w<640?14:16;cols=Math.max(1,Math.ceil(w/fs));drops=Array.from({length:cols},()=>Math.floor(Math.random()*Math.ceil(h/fs)));ctx.fillStyle='#030804';ctx.fillRect(0,0,w,h)};const step=()=>{ctx.fillStyle='rgba(3,8,4,0.08)';ctx.fillRect(0,0,w,h);ctx.font=fs+'px "JetBrains Mono",monospace';for(let i=0;i<drops.length;i++){const x=i*fs,y=drops[i]*fs,c=ch[Math.floor(Math.random()*ch.length)];ctx.fillStyle=Math.random()>0.88?'#dcffe8':'#00ff66';ctx.fillText(c,x,y);if(y>h&&Math.random()>0.975)drops[i]=0;else drops[i]++}};rs();for(let k=0;k<22;k++)step();window.addEventListener('resize',rs);if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){let last=0;const loop=ts=>{if(ts-last>=42){last=ts;step()}requestAnimationFrame(loop)};requestAnimationFrame(loop)}}}
else if(deck.theme==='astronomi'){const sc=document.createElement('canvas');sc.id='space-bg';document.body.insertBefore(sc,document.body.firstChild);const ctx=sc.getContext('2d');if(ctx){const bgc=document.createElement('canvas');const bgx=bgc.getContext('2d');let w=0,h=0,stars=[],meteors=[],t=0;const sp=['#ffffff','#f4f4f5','#e4e4e7','#d4d4d8','#a1a1aa'];const mkBg=()=>{if(!bgx)return;bgc.width=w;bgc.height=h;const g=bgx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#030305');g.addColorStop(.5,'#0b0b0f');g.addColorStop(1,'#040406');bgx.fillStyle=g;bgx.fillRect(0,0,w,h);bgx.save();bgx.translate(w*.46,h*.54);bgx.rotate(-.48);const span=Math.max(w,h)*1.5;const bg=bgx.createLinearGradient(0,-h*.38,0,h*.38);bg.addColorStop(0,'rgba(63,63,70,0)');bg.addColorStop(.5,'rgba(212,212,216,0.2)');bg.addColorStop(1,'rgba(63,63,70,0)');bgx.fillStyle=bg;bgx.fillRect(-span*.6,-h*.38,span*1.2,h*.76);bgx.restore();const neb=[[w*.2,h*.74,w*.48,'rgba(161,161,170,0.16)'],[w*.44,h*.46,w*.42,'rgba(228,228,231,0.12)'],[w*.62,h*.36,w*.34,'rgba(113,113,122,0.14)'],[w*.3,h*.64,w*.26,'rgba(244,244,245,0.09)']];neb.forEach(([nx,ny,nr,nc])=>{const rg=bgx.createRadialGradient(nx,ny,0,nx,ny,nr);rg.addColorStop(0,nc);rg.addColorStop(1,'rgba(0,0,0,0)');bgx.fillStyle=rg;bgx.fillRect(0,0,w,h)});};const rs=()=>{w=Math.max(1,window.innerWidth);h=Math.max(1,window.innerHeight);sc.width=w;sc.height=h;stars=Array.from({length:240},(_,i)=>{const l=i%10===0?3:i%3===0?2:1;return{x:Math.random()*w,y:Math.random()*h,l,r:l===3?1.55+Math.random()*1.15:l===2?.95+Math.random()*.65:.55+Math.random()*.55,a:.48+Math.random()*.5,ph:Math.random()*Math.PI*2,sp:.7+Math.random()*1.8,c:sp[i%sp.length],spk:l===3&&i%20===0}});mkBg()};const draw=(dt)=>{t+=dt;if(bgx)ctx.drawImage(bgc,0,0);for(const s of stars){s.x-=s.l*.075;if(s.x<-4)s.x=w+4;const al=Math.max(.18,Math.min(1,s.a*(.68+.32*Math.sin(t*s.sp+s.ph))));ctx.globalAlpha=al;ctx.fillStyle=s.c;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();if(s.spk){ctx.strokeStyle=s.c;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(s.x-s.r*4.5,s.y);ctx.lineTo(s.x+s.r*4.5,s.y);ctx.moveTo(s.x,s.y-s.r*4.5);ctx.lineTo(s.x,s.y+s.r*4.5);ctx.stroke()}}ctx.globalAlpha=1;const cx=w*.8,cy=h*.25,pr=Math.max(48,Math.min(118,Math.min(w,h)*.13)),tilt=-.32,rr=pr*2.42;const drawRing=(front)=>{ctx.save();ctx.translate(cx,cy);ctx.rotate(tilt);ctx.scale(1,.26);ctx.beginPath();if(front)ctx.rect(-rr*1.15,0,rr*2.3,rr*1.15);else ctx.rect(-rr*1.15,-rr*1.15,rr*2.3,rr*1.15);ctx.clip();const rg=ctx.createRadialGradient(0,0,pr*1.22,0,0,rr);rg.addColorStop(0,'rgba(155,138,114,0)');rg.addColorStop(.11,'rgba(148,132,108,0.24)');rg.addColorStop(.36,'rgba(246,232,200,0.62)');rg.addColorStop(.52,'rgba(8,7,6,0.10)');rg.addColorStop(.58,'rgba(8,7,6,0.08)');rg.addColorStop(.64,'rgba(226,206,172,0.46)');rg.addColorStop(.88,'rgba(198,178,148,0.28)');rg.addColorStop(1,'rgba(140,126,106,0)');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.fill();ctx.restore()};drawRing(false);ctx.save();ctx.beginPath();ctx.arc(cx,cy,pr,0,Math.PI*2);ctx.clip();const pg=ctx.createLinearGradient(cx-pr,cy-pr,cx+pr,cy+pr);pg.addColorStop(0,'#f5e9ce');pg.addColorStop(.32,'#dfc28d');pg.addColorStop(.68,'#a47d47');pg.addColorStop(1,'#261d12');ctx.fillStyle=pg;ctx.fillRect(cx-pr,cy-pr,pr*2,pr*2);ctx.save();ctx.translate(cx,cy);ctx.rotate(tilt);[[-pr*.92,pr*.24,'rgba(116,112,96,0.28)'],[-pr*.42,pr*.18,'rgba(198,162,106,0.28)'],[-pr*.14,pr*.22,'rgba(252,241,212,0.36)'],[pr*.14,pr*.16,'rgba(182,140,86,0.30)']].forEach(([by,bh,bc])=>{ctx.fillStyle=bc;ctx.fillRect(-pr*1.2,by,pr*2.4,bh)});ctx.restore();const sh=ctx.createRadialGradient(cx-pr*.48,cy-pr*.4,pr*.1,cx+pr*.24,cy+pr*.22,pr*1.38);sh.addColorStop(0,'rgba(255,250,235,0.16)');sh.addColorStop(.52,'rgba(32,24,16,0.20)');sh.addColorStop(1,'rgba(4,3,2,0.96)');ctx.fillStyle=sh;ctx.fillRect(cx-pr,cy-pr,pr*2,pr*2);ctx.restore();drawRing(true);const mx=cx+Math.cos(t*.11+.55)*pr*2.72,my=cy+Math.sin(t*.11+.55)*pr*.82,mr=Math.max(7,pr*.13);ctx.save();ctx.beginPath();ctx.arc(mx,my,mr,0,Math.PI*2);ctx.fillStyle='#d4d4d8';ctx.fill();const mg=ctx.createRadialGradient(mx-mr*.44,my-mr*.36,mr*.08,mx+mr*.22,my+mr*.22,mr*1.25);mg.addColorStop(0,'rgba(255,255,255,0.24)');mg.addColorStop(.6,'rgba(39,39,42,0.58)');mg.addColorStop(1,'rgba(5,5,7,0.98)');ctx.fillStyle=mg;ctx.fill();ctx.restore();if(Math.random()<.02&&meteors.length<2)meteors.push({x:Math.random()*w*.78,y:Math.random()*h*.42,vx:8.5+Math.random()*5,vy:3.4+Math.random()*2.4,life:1});for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];m.x+=m.vx;m.y+=m.vy;m.life-=.036;if(m.life<=0){meteors.splice(i,1);continue}const mg=ctx.createLinearGradient(m.x,m.y,m.x-m.vx*6,m.y-m.vy*6);mg.addColorStop(0,'rgba(255,255,255,'+m.life+')');mg.addColorStop(1,'rgba(161,161,170,0)');ctx.strokeStyle=mg;ctx.lineWidth=1.9;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x-m.vx*6,m.y-m.vy*6);ctx.stroke()}};rs();draw(0);window.addEventListener('resize',rs);if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){let last=0;const loop=ts=>{if(ts-last>=33){const dt=last?Math.min(.1,(ts-last)/1000):.033;last=ts;draw(dt)}requestAnimationFrame(loop)};requestAnimationFrame(loop)}}}
else if(deck.theme==='ghost'){const gc=document.createElement('canvas');gc.id='ghost-bg';document.body.insertBefore(gc,document.body.firstChild);const ctx=gc.getContext('2d');if(ctx){const rc=document.createElement('canvas');const rx=rc.getContext('2d');let w=0,h=0,t=0;const red=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const lay=(W,H)=>{const n=W<640,bl=W*(n?.08:.19),br=W*(n?.92:.81),bt=H*.14,bb=H*.72,dx=n?W*.12:W*.215,dw=Math.max(58,(br-bl)*(n?.2:.135)),dt=bt+(bb-bt)*.14,dh=bb-dt,wx=n?W*.72:W*.67,ww=Math.max(56,(br-bl)*(n?.2:.145)),wt=bt+(bb-bt)*.13,wh=(bb-wt)*.56,tw=Math.max(66,Math.min(132,W*(n?.2:.105))),th=tw*.78,tx=n?W*.05:W*.065,ty=H*.65,cx=n?W*.8:W*.835,cy=H*.745,cs=Math.max(.68,Math.min(1.22,Math.min(W,H)/760));return{bl,br,bt,bb,dx,dw,dt,dh,wx,ww,wt,wh,tx,ty,tw,th,cx,cy,cs}};const mk=()=>{if(!rx)return;rc.width=w;rc.height=h;const L=lay(w,h);rx.fillStyle='#070304';rx.fillRect(0,0,w,h);rx.fillStyle='#180c0e';rx.fillRect(L.bl,L.bt,L.br-L.bl,L.bb-L.bt);rx.fillStyle='#100608';rx.beginPath();rx.moveTo(0,0);rx.lineTo(L.bl,L.bt);rx.lineTo(L.bl,L.bb);rx.lineTo(0,h);rx.closePath();rx.fill();rx.beginPath();rx.moveTo(L.br,L.bt);rx.lineTo(w,0);rx.lineTo(w,h);rx.lineTo(L.br,L.bb);rx.closePath();rx.fill();rx.fillStyle='#0c0506';rx.beginPath();rx.moveTo(L.bl,L.bb);rx.lineTo(L.br,L.bb);rx.lineTo(w,h);rx.lineTo(0,h);rx.closePath();rx.fill();rx.strokeStyle='rgba(0,0,0,0.6)';rx.lineWidth=1.2;for(let i=0;i<=12;i++){const p=i/12;rx.beginPath();rx.moveTo(L.bl+(L.br-L.bl)*p,L.bb);rx.lineTo(w*(p*1.36-.18),h);rx.stroke()}rx.fillStyle='#020102';rx.fillRect(L.dx,L.dt,L.dw,L.dh);rx.strokeStyle='#1e0e10';rx.lineWidth=4;rx.strokeRect(L.dx,L.dt,L.dw,L.dh);rx.fillStyle='#180b0d';rx.fillRect(L.dx,L.dt,L.dw*.32,L.dh);rx.fillStyle='rgba(120,24,32,0.22)';rx.fillRect(L.wx,L.wt,L.ww,L.wh);rx.fillStyle='#1d0f0d';rx.fillRect(L.wx-4,L.wt+L.wh*.3,L.ww+8,8);rx.fillRect(L.wx-4,L.wt+L.wh*.65,L.ww+8,8);rx.fillStyle='#190c0e';rx.fillRect(L.tx-4,L.ty+L.th-2,L.tw+10,Math.max(38,h-L.ty-L.th+2))};const rs=()=>{w=Math.max(1,window.innerWidth);h=Math.max(1,window.innerHeight);gc.width=w;gc.height=h;mk()};const ghostFig=(gx,gy,sc,al,ln,tr)=>{if(al<=.01)return;ctx.save();ctx.translate(gx,gy);ctx.rotate(ln);ctx.scale(sc,sc);if(tr){for(let k=1;k<=4;k++){ctx.fillStyle='rgba(218,202,206,'+(al*(.24/k))+')';ctx.beginPath();ctx.ellipse(-tr*k*28,10,28+k*9,46,0,0,Math.PI*2);ctx.fill()}}ctx.fillStyle='rgba(195,182,188,'+(al*.72)+')';ctx.beginPath();ctx.moveTo(-15,-6);ctx.quadraticCurveTo(0,-18,15,-6);ctx.lineTo(25,84);ctx.lineTo(13,66);ctx.lineTo(4,90);ctx.lineTo(-6,68);ctx.lineTo(-17,88);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(220,206,210,'+(al*.84)+')';ctx.beginPath();ctx.moveTo(-11,-34);ctx.quadraticCurveTo(0,-42,11,-34);ctx.quadraticCurveTo(13,-18,7,-7);ctx.quadraticCurveTo(0,-3,-7,-7);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(10,4,6,'+(al*.88)+')';ctx.beginPath();ctx.moveTo(-14,-28);ctx.quadraticCurveTo(0,-45,14,-28);ctx.lineTo(18,12);ctx.lineTo(11,-22);ctx.lineTo(0,-21);ctx.lineTo(-11,-22);ctx.lineTo(-18,10);ctx.closePath();ctx.fill();ctx.fillStyle='rgba(4,1,2,'+(al*.96)+')';ctx.beginPath();ctx.ellipse(-4.6,-21,3.2,4.4,-.16,0,Math.PI*2);ctx.ellipse(4.6,-21,3.2,4.4,.16,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,78,78,'+(al*.85)+')';ctx.beginPath();ctx.arc(-4.6,-21,1,0,Math.PI*2);ctx.arc(4.6,-21,1,0,Math.PI*2);ctx.fill();ctx.restore()};const draw=(dt)=>{t+=dt;if(rx)ctx.drawImage(rc,0,0);const L=lay(w,h),tm=red?1.4:t,rk=Math.sin(tm*1.45)*.115;ctx.save();ctx.translate(L.cx,L.cy);ctx.scale(L.cs,L.cs);ctx.fillStyle='rgba(0,0,0,0.6)';ctx.beginPath();ctx.ellipse(rk*40,4,46,8,0,0,Math.PI*2);ctx.fill();ctx.rotate(rk);ctx.strokeStyle='#421e21';ctx.lineWidth=4.5;ctx.beginPath();ctx.moveTo(-42,-6);ctx.quadraticCurveTo(0,11,44,-5);ctx.moveTo(-22,0);ctx.lineTo(-18,-38);ctx.moveTo(20,0);ctx.lineTo(18,-36);ctx.moveTo(-20,-38);ctx.lineTo(-30,-108);ctx.moveTo(-3,-37);ctx.lineTo(-11,-106);ctx.stroke();ctx.fillStyle='#2d1416';ctx.fillRect(-25,-38,50,6);ctx.restore();const cyc=tm%9.5,jb=L.dx+L.dw,gs=Math.max(.76,Math.min(1.3,L.dh/250));let sg=0;if(cyc<3.6){const p=cyc<.75?cyc/.75:cyc>3?(3.6-cyc)/.6:1,ez=Math.sin(Math.max(0,Math.min(1,p))*Math.PI*.5);ctx.save();ctx.beginPath();ctx.rect(L.dx,L.dt,L.dw,L.dh);ctx.clip();ghostFig(jb+12-ez*24,L.dt+L.dh*.44,gs,.9*ez,-.22*ez,0);ctx.restore();if(ez>.25){ctx.strokeStyle='rgba(205,188,192,'+(.78*ez)+')';ctx.lineWidth=2.1;for(let f=0;f<4;f++){const fy=L.dt+L.dh*.44+14+f*5.2;ctx.beginPath();ctx.moveTo(jb-2,fy);ctx.lineTo(jb+8*ez,fy+2);ctx.stroke()}}}else if(cyc>=4.4&&cyc<5.15){const dp=(cyc-4.4)/.75,ez=1-Math.pow(1-dp,2.2);sg=Math.sin(dp*Math.PI)*.85;ghostFig(jb-10+(L.br-jb+40)*ez,L.dt+L.dh*.5,gs*1.12,Math.sin(dp*Math.PI)*.94,.3,1)}const fl=Math.max(.35,Math.min(1.25,.72+.2*Math.sin(t*19.3)+sg*.35)),gx=L.tx+L.tw*.45,gy=L.ty+L.th*.45,sp=ctx.createRadialGradient(gx,gy,L.tw*.15,gx,gy,L.tw*1.85);sp.addColorStop(0,'rgba(220,48,56,'+(.22*fl)+')');sp.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sp;ctx.fillRect(gx-L.tw*2,gy-L.tw*2,L.tw*4,L.tw*4);ctx.save();ctx.translate(L.tx+L.tw*.5,L.ty+L.th*.5);ctx.rotate(-.045);ctx.fillStyle='#1b1113';ctx.fillRect(-L.tw*.5,-L.th*.5,L.tw,L.th);ctx.fillStyle=sg>.3?'rgba(255,90,90,0.8)':'rgba(215,224,230,0.75)';ctx.fillRect(-L.tw*.42,-L.th*.38,L.tw*.68,L.th*.76);ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(-L.tw*.42,-L.th*.38+((t*42)%(L.th*.76)),L.tw*.68,3);ctx.strokeStyle='#080304';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(L.tw*.12,-L.th*.2);ctx.lineTo(-L.tw*.05,L.th*.05);ctx.lineTo(-L.tw*.15,L.th*.28);ctx.stroke();ctx.restore()};rs();draw(0);window.addEventListener('resize',rs);if(!red){let last=0;const loop=ts=>{if(ts-last>=33){const dt=last?Math.min(.1,(ts-last)/1000):.033;last=ts;draw(dt)}requestAnimationFrame(loop)};requestAnimationFrame(loop)}}}
else if(deck.theme==='halloween'){const hc=document.createElement('canvas');hc.id='halloween-bg';document.body.insertBefore(hc,document.body.firstChild);const ctx=hc.getContext('2d');if(ctx){const sc=document.createElement('canvas');const sx=sc.getContext('2d');let w=0,h=0,t=0,bats=[],embers=[];const red=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const lay=(W,H)=>{const n=W<640,mx=W*(n?.23:.22),my=H*(n?.16:.22),mr=Math.max(40,Math.min(82,Math.min(W,H)*.088)),cx=W*(n?.68:.72),cy=H*(n?.72:.74),cs=Math.max(.62,Math.min(1.18,Math.min(W,H)/760)),fy=H*(n?.8:.79),ltx=W*(n?.05:.08),ox=ltx+(n?72:112),oy=H*(n?.43:.41),rtx=W*(n?.96:.94);const pm=[{x:W*(n?.15:.14),y:H*.85,r:n?15:21,p:.4},{x:W*(n?.31:.27),y:fy-6,r:n?11:14,p:1.7},{x:W*(n?.56:.53),y:H*.86,r:n?14:18,p:2.9},{x:W*(n?.84:.85),y:H*.84,r:n?17:24,p:4.1}];const cw=[{x:cx-58*cs,y:cy-96*cs,w:10*cs,h:18*cs},{x:cx-24*cs,y:cy-146*cs,w:12*cs,h:22*cs},{x:cx,y:cy-196*cs,w:12*cs,h:24*cs},{x:cx+26*cs,y:cy-146*cs,w:12*cs,h:22*cs},{x:cx+60*cs,y:cy-98*cs,w:10*cs,h:18*cs},{x:cx,y:cy-82*cs,w:22*cs,h:36*cs}];return{n,mx,my,mr,cx,cy,cs,fy,ltx,ox,oy,rtx,pm,cw}};const mk=()=>{if(!sx)return;sc.width=w;sc.height=h;const L=lay(w,h);const sg=sx.createLinearGradient(0,0,0,h);sg.addColorStop(0,'#07040b');sg.addColorStop(.5,'#13091a');sg.addColorStop(.82,'#220f17');sg.addColorStop(1,'#09050b');sx.fillStyle=sg;sx.fillRect(0,0,w,h);const hg=sx.createRadialGradient(L.mx,L.my,L.mr*.5,L.mx,L.my,L.mr*4.4);hg.addColorStop(0,'rgba(254,243,199,0.44)');hg.addColorStop(.35,'rgba(251,191,36,0.16)');hg.addColorStop(.7,'rgba(249,115,22,0.06)');hg.addColorStop(1,'rgba(9,5,12,0)');sx.fillStyle=hg;sx.fillRect(0,0,w,h);sx.save();sx.beginPath();sx.arc(L.mx,L.my,L.mr,0,Math.PI*2);sx.fillStyle='#fde68a';sx.fill();sx.restore();sx.save();sx.translate(L.cx,L.cy);sx.scale(L.cs,L.cs);sx.fillStyle='#07040a';sx.beginPath();sx.moveTo(-108,40);sx.lineTo(-108,-72);sx.lineTo(-92,-138);sx.lineTo(-76,-72);sx.lineTo(-46,-72);sx.lineTo(-46,-152);sx.lineTo(-32,-238);sx.lineTo(-12,-152);sx.lineTo(-20,-214);sx.lineTo(0,-310);sx.lineTo(20,-214);sx.lineTo(12,-152);sx.lineTo(34,-236);sx.lineTo(46,-152);sx.lineTo(46,-72);sx.lineTo(76,-72);sx.lineTo(94,-142);sx.lineTo(110,-72);sx.lineTo(110,40);sx.closePath();sx.fill();sx.restore();sx.fillStyle='#0a050d';sx.fillRect(0,L.fy,w,h-L.fy);sx.fillStyle='#07040b';sx.fillRect(0,L.fy-32,w,3);sx.fillRect(0,L.fy+6,w,3);for(let fx=6;fx<w;fx+=20){if(Math.abs(fx-w*.62)<26)continue;sx.fillRect(fx-1.5,L.fy-42,3,56)}sx.strokeStyle='#120919';sx.lineWidth=2.5;sx.beginPath();sx.arc(w*.62,L.fy-38,28,Math.PI,0);sx.stroke();sx.fillStyle='#fb923c';sx.beginPath();sx.arc(w*.62,L.fy-62,3,0,Math.PI*2);sx.fill();[[w*.1,h*.89,26,46,-0.08],[w*.22,h*.86,22,50,0.08],[w*.44,h*.84,20,46,0.05],[w*.77,h*.85,26,44,0.09]].forEach(([gx,gy,gw,gh,tl])=>{sx.save();sx.translate(gx,gy);sx.rotate(tl);sx.fillStyle='#120b18';sx.fillRect(-gw*.45,-gh,gw*.9,gh);sx.restore()});const tree=(bx,by,mir,ox,oy)=>{sx.save();sx.strokeStyle='#07040a';sx.fillStyle='#07040a';sx.lineCap='round';sx.beginPath();sx.moveTo(bx-18*mir,by+30);sx.quadraticCurveTo(bx+20*mir,by-h*.38,bx+16*mir,by-h*.6);sx.lineTo(bx+4*mir,by-h*.58);sx.quadraticCurveTo(bx+8*mir,by-h*.34,bx+14*mir,by+30);sx.fill();sx.lineWidth=8;if(ox!=null){sx.beginPath();sx.moveTo(bx+16*mir,by-h*.36);sx.quadraticCurveTo((bx+ox)*.5,oy+12,ox+26,oy+4);sx.stroke()}sx.lineWidth=5;sx.beginPath();sx.moveTo(bx+18*mir,by-h*.42);sx.quadraticCurveTo(bx+80*mir,by-h*.54,bx+135*mir,by-h*.58);sx.stroke();sx.restore()};tree(L.ltx,L.fy+14,1,L.ox,L.oy);tree(L.rtx,L.fy+18,-1);L.pm.forEach(p=>{sx.save();sx.translate(p.x,p.y);sx.fillStyle='#3f2e18';sx.fillRect(-p.r*.14,-p.r*1.1,p.r*.28,p.r*.32);sx.fillStyle='#f97316';sx.beginPath();sx.ellipse(0,0,p.r*.88,p.r*.88,0,0,Math.PI*2);sx.fill();sx.restore()})};const rs=()=>{w=Math.max(1,window.innerWidth);h=Math.max(1,window.innerHeight);hc.width=w;hc.height=h;bats=Array.from({length:w<640?5:8},(_,i)=>({x:((i+.5)/8)*w,y:h*(.12+((i*37)%34)/100),vx:(i%2===0?1:-1)*(32+(i%4)*14),vy:((i%3)-1)*7,sc:.58+(i%4)*.19,fs:6.5+(i%3)*1.9,ph:i*1.15}));embers=Array.from({length:28},()=>({x:Math.random()*w,y:h*(.45+Math.random()*.55),vx:-8+Math.random()*16,vy:-14-Math.random()*20,sz:1.6,ph:Math.random()*6.28}));mk()};const draw=(dt)=>{t+=dt;if(sx)ctx.drawImage(sc,0,0);const L=lay(w,h),tm=red?1.2:t,fl=.72+.28*Math.sin(tm*7.3);ctx.fillStyle='rgba(251,146,60,'+(.78*fl)+')';L.cw.forEach(cw=>ctx.fillRect(cw.x-cw.w*.5,cw.y-cw.h*.5,cw.w,cw.h));const eo=(tm%4.6)>4.42&&(tm%4.6)<4.56?.15:1;ctx.save();ctx.translate(L.ox,L.oy);ctx.fillStyle='#09050d';ctx.beginPath();ctx.ellipse(0,-14,13,18,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(0,-32,11,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fb923c';ctx.beginPath();ctx.ellipse(-4.3,-33,2.7,2.7*eo,0,0,Math.PI*2);ctx.ellipse(4.3,-33,2.7,2.7*eo,0,0,Math.PI*2);ctx.fill();ctx.restore();L.pm.forEach(p=>{const pf=.78+.22*Math.sin(tm*9.5+p.p);ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='rgba(254,240,138,'+(.95*pf)+')';ctx.beginPath();ctx.moveTo(-p.r*.4,-p.r*.08);ctx.lineTo(-p.r*.22,-p.r*.32);ctx.lineTo(-p.r*.06,-p.r*.08);ctx.moveTo(p.r*.06,-p.r*.08);ctx.lineTo(p.r*.22,-p.r*.32);ctx.lineTo(p.r*.4,-p.r*.08);ctx.moveTo(-p.r*.4,p.r*.2);ctx.lineTo(p.r*.4,p.r*.2);ctx.lineTo(0,p.r*.52);ctx.closePath();ctx.fill();ctx.restore()});bats.forEach(b=>{if(dt>0){b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x>w+50)b.x=-50;if(b.x<-50)b.x=w+50}const wy=-Math.sin(tm*b.fs+b.ph)*10,dr=b.vx>=0?1:-1;ctx.save();ctx.translate(b.x,b.y);ctx.scale(b.sc*dr*1.15,b.sc*1.15);ctx.fillStyle='#140a1e';ctx.beginPath();ctx.ellipse(0,0,5.2,3.2,0,0,Math.PI*2);ctx.moveTo(-2,0);ctx.quadraticCurveTo(-11,wy-8,-23,wy);ctx.quadraticCurveTo(-12,5,-2,1.5);ctx.moveTo(2,0);ctx.quadraticCurveTo(11,wy-8,23,wy);ctx.quadraticCurveTo(12,5,2,1.5);ctx.fill();ctx.restore()});embers.forEach(e=>{if(dt>0){e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.y<-10){e.y=h+10;e.x=Math.random()*w}}ctx.fillStyle='rgba(251,146,60,0.55)';ctx.fillRect(e.x,e.y,e.sz,e.sz)})};rs();draw(0);window.addEventListener('resize',rs);if(!red){let last=0;const loop=ts=>{if(ts-last>=33){const dt=last?Math.min(.1,(ts-last)/1000):.033;last=ts;draw(dt)}requestAnimationFrame(loop)};requestAnimationFrame(loop)}}}
else if(deck.theme==='aquarium'){const ac=document.createElement('canvas');ac.id='aquarium-bg';document.body.insertBefore(ac,document.body.firstChild);const ctx=ac.getContext('2d');if(ctx){const sc=document.createElement('canvas');const sx=sc.getContext('2d');let w=0,h=0,t=0,bub=[],fish=[],mack=[],jell=[],kelp=[];const red=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let shk={x:0,y:0,vx:38,s:1},meg={x:0,y:0,vx:-24,s:1},ang={x:0,y:0,vx:22,s:1},oct={x:0,y:0,vx:-16,s:1},snl={x:0,y:0,vx:6.5,s:1};const mk=()=>{if(!sx)return;sc.width=w;sc.height=h;const g=sx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0c5286');g.addColorStop(.3,'#083a68');g.addColorStop(.7,'#052242');g.addColorStop(1,'#021024');sx.fillStyle=g;sx.fillRect(0,0,w,h);sx.fillStyle='#03162b';sx.beginPath();sx.moveTo(0,h);sx.lineTo(0,h*.82);sx.quadraticCurveTo(w*.22,h*.75,w*.45,h*.83);sx.quadraticCurveTo(w*.74,h*.74,w,h*.81);sx.lineTo(w,h);sx.closePath();sx.fill();const sy=h*.87;const sg=sx.createLinearGradient(0,sy,0,h);sg.addColorStop(0,'#c9a66b');sg.addColorStop(1,'#826338');sx.fillStyle=sg;sx.beginPath();sx.moveTo(0,sy);sx.quadraticCurveTo(w*.35,sy-16,w*.68,sy+8);sx.quadraticCurveTo(w*.88,sy-6,w,sy+4);sx.lineTo(w,h);sx.lineTo(0,h);sx.closePath();sx.fill();[[w*.2,h*.93,20,'#f97316'],[w*.54,h*.91,17,'#fb7185'],[w*.82,h*.94,21,'#f59e0b']].forEach(([bx,by,br,bc])=>{sx.save();sx.translate(bx,by);sx.scale(1,.62);sx.fillStyle=bc;sx.beginPath();for(let k=0;k<10;k++){const a=k*Math.PI/5-.3,r=k%2===0?br:br*.42;k===0?sx.moveTo(Math.cos(a)*r,Math.sin(a)*r):sx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}sx.closePath();sx.fill();sx.restore()})};const rs=()=>{w=Math.max(1,window.innerWidth);h=Math.max(1,window.innerHeight);ac.width=w;ac.height=h;const n=w<640,scBase=Math.max(.72,Math.min(1.1,w/1280));kelp=[];[w*.06,w*.12,w*.88,w*.94].forEach((kx,i)=>kelp.push({x:kx,y:h*.88,h:h*(.28+(i%2)*.08),w:9,c:i%2===0?'#15803d':'#0d9488',p:i*1.2}));jell=[{x:w*.18,y:h*.28,vx:8,r:24*scBase,p:0},{x:w*.72,y:h*.22,vx:-7,r:20*scBase,p:2.1}];mack=Array.from({length:5},(_,i)=>({x:w*(.15+i*.09),y:h*.34+(i%3-1)*18,vx:62,s:17*scBase,p:i*.9}));fish=[{x:w*.24,y:h*.55,vx:34,s:22*scBase,c:'#fb923c',p:0},{x:w*.76,y:h*.48,vx:-30,s:20*scBase,c:'#38bdf8',p:1.8},{x:w*.52,y:h*.64,vx:26,s:18*scBase,c:'#facc15',p:3.1}];bub=Array.from({length:36},()=>({x:Math.random()*w,y:Math.random()*h,r:1.8+Math.random()*4,vy:22+Math.random()*26,p:Math.random()*6.28}));meg={x:w*.66,y:h*.28,vx:-22,s:scBase*(n?.72:1)};shk={x:w*.28,y:h*.42,vx:34,s:scBase*(n?.75:1)};ang={x:w*.22,y:h*.72,vx:20,s:scBase*(n?.78:1)};oct={x:w*.74,y:h*.76,vx:-14,s:scBase*(n?.75:1)};snl={x:w*.36,y:h*.93,vx:6,s:scBase};mk()};const draw=(dt)=>{t+=dt;const tm=red?1.4:t;if(sx)ctx.drawImage(sc,0,0);ctx.fillStyle='rgba(125,211,252,0.06)';for(let i=0;i<4;i++){const rx=w*(.15+i*.24)+Math.sin(tm*.4+i)*24;ctx.beginPath();ctx.moveTo(rx-18,0);ctx.lineTo(rx+28,0);ctx.lineTo(rx+110,h*.82);ctx.lineTo(rx-30,h*.82);ctx.closePath();ctx.fill()}if(dt>0){meg.x+=meg.vx*dt;if(meg.x<-260)meg.x=w+260}ctx.save();ctx.translate(meg.x,meg.y+Math.sin(tm*1.1)*6);ctx.scale(meg.vx>=0?meg.s:-meg.s,meg.s);ctx.fillStyle='#1e3a5f';ctx.beginPath();ctx.ellipse(0,0,126,34,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-18,-28);ctx.lineTo(-4,-72);ctx.lineTo(26,-24);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-112,0);ctx.lineTo(-162,-42);ctx.lineTo(-142,0);ctx.lineTo(-158,36);ctx.closePath();ctx.fill();ctx.restore();kelp.forEach(k=>{ctx.save();ctx.strokeStyle=k.c;ctx.lineWidth=k.w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(k.x,k.y);const tip=k.x+Math.sin(tm*1.4+k.p)*18;ctx.quadraticCurveTo(k.x-Math.sin(tm*1.4+k.p)*10,k.y-k.h*.5,tip,k.y-k.h);ctx.stroke();ctx.restore()});if(dt>0){shk.x+=shk.vx*dt;if(shk.x>w+180)shk.x=-180}ctx.save();ctx.translate(shk.x,shk.y+Math.sin(tm*1.8)*5);ctx.scale(shk.vx>=0?shk.s:-shk.s,shk.s);ctx.fillStyle='#475569';ctx.beginPath();ctx.ellipse(0,0,74,20,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-8,-16);ctx.lineTo(2,-46);ctx.lineTo(18,-14);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-64,0);ctx.lineTo(-96,-26);ctx.lineTo(-82,0);ctx.lineTo(-92,20);ctx.closePath();ctx.fill();ctx.restore();jell.forEach(j=>{if(dt>0){j.x+=j.vx*dt;if(j.x>w+60)j.x=-60;if(j.x<-60)j.x=w+60}const p=Math.sin(tm*2.6+j.p),jy=j.y+p*10;ctx.save();ctx.translate(j.x,jy);ctx.fillStyle='rgba(125,211,252,0.52)';ctx.beginPath();ctx.arc(0,0,j.r,Math.PI,0);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(186,230,253,0.6)';ctx.lineWidth=1.8;for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(k*j.r*.28,2);ctx.quadraticCurveTo(k*j.r*.32+Math.sin(tm*3+k)*6,j.r*1.1,k*j.r*.26,j.r*1.9);ctx.stroke()}ctx.restore()});mack.forEach(m=>{if(dt>0){m.x+=m.vx*dt;if(m.x>w+80)m.x=-80}ctx.save();ctx.translate(m.x,m.y+Math.sin(tm*3+m.p)*4);ctx.fillStyle='#94a3b8';ctx.beginPath();ctx.ellipse(0,0,m.s,m.s*.32,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1e3a8a';ctx.fillRect(-m.s*.3,-m.s*.26,m.s*.65,m.s*.14);ctx.restore()});fish.forEach(f=>{if(dt>0){f.x+=f.vx*dt;if(f.x>w+70)f.x=-70;if(f.x<-70)f.x=w+70}ctx.save();ctx.translate(f.x,f.y+Math.sin(tm*2.2+f.p)*6);ctx.scale(f.vx>=0?1:-1,1);ctx.fillStyle=f.c;ctx.beginPath();ctx.ellipse(0,0,f.s,f.s*.62,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-f.s*.85,0);ctx.lineTo(-f.s*1.35,-f.s*.46);ctx.lineTo(-f.s*1.35,f.s*.46);ctx.closePath();ctx.fill();ctx.fillStyle='#0f172a';ctx.beginPath();ctx.arc(f.s*.5,-f.s*.12,2.2,0,Math.PI*2);ctx.fill();ctx.restore()});if(dt>0){oct.x+=oct.vx*dt;if(oct.x<-120)oct.x=w+120}ctx.save();ctx.translate(oct.x,oct.y+Math.sin(tm*2.1)*8);ctx.scale(oct.s,oct.s);ctx.strokeStyle='#ea580c';ctx.lineWidth=6;ctx.lineCap='round';for(let k=0;k<6;k++){const a=(k-2.5)*.45;ctx.beginPath();ctx.moveTo(k*6-15,6);ctx.quadraticCurveTo(k*12-28+Math.sin(tm*3+k)*8,34,k*14-35,54);ctx.stroke()}ctx.fillStyle='#f97316';ctx.beginPath();ctx.ellipse(0,-8,26,22,0,0,Math.PI*2);ctx.fill();ctx.restore();if(dt>0){ang.x+=ang.vx*dt;if(ang.x>w+140)ang.x=-140}ctx.save();ctx.translate(ang.x,ang.y+Math.sin(tm*1.7)*5);ctx.scale(ang.s,ang.s);ctx.fillStyle='#1e293b';ctx.beginPath();ctx.ellipse(0,0,38,28,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#cbd5e1';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(14,-22);ctx.quadraticCurveTo(44,-48,66,-16);ctx.stroke();ctx.fillStyle='#fef08a';ctx.beginPath();ctx.arc(66,-14,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#67e8f9';ctx.beginPath();ctx.arc(66,-14,3.5,0,Math.PI*2);ctx.fill();ctx.restore();if(dt>0){snl.x+=snl.vx*dt;if(snl.x>w+60)snl.x=-60}ctx.save();ctx.translate(snl.x,snl.y);ctx.fillStyle='#fde68a';ctx.beginPath();ctx.ellipse(0,6,18,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b45309';ctx.beginPath();ctx.arc(-4,-3,11,0,Math.PI*2);ctx.fill();ctx.restore();ctx.strokeStyle='rgba(224,242,254,0.72)';ctx.lineWidth=1.2;bub.forEach(b=>{if(dt>0){b.y-=b.vy*dt;if(b.y<-10){b.y=h+10;b.x=Math.random()*w}}ctx.beginPath();ctx.arc(b.x+Math.sin(tm*2+b.p)*4,b.y,b.r,0,Math.PI*2);ctx.stroke()})};rs();draw(0);window.addEventListener('resize',rs);if(!red){let last=0;const loop=ts=>{if(ts-last>=45){const dt=last?Math.min(.1,(ts-last)/1000):.045;last=ts;draw(dt)}requestAnimationFrame(loop)};requestAnimationFrame(loop)}}}
else if(deck.theme==='detective'){const dc=document.createElement('canvas');dc.id='detective-bg';document.body.insertBefore(dc,document.body.firstChild);const ctx=dc.getContext('2d');if(ctx){const rc=document.createElement('canvas');const rx=rc.getContext('2d');let w=0,h=0,t=0,fp=[],dm=[],ww=[],sc=1.1;const red=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const lay=(W,H)=>{const n=W<640,wx=W*(n?.04:.06),wy=H*(n?.09:.11),wwd=Math.max(76,Math.min(148,W*(n?.22:.125))),wh=Math.max(116,Math.min(220,H*.3)),bw=Math.max(190,Math.min(390,W*(n?.56:.34))),bh=Math.max(115,Math.min(205,H*.27)),bx=W*(n?.36:.34),by=H*(n?.1:.11),rkx=W*(n?.9:.87),rkt=H*.16,rkb=H*.72,dy=H*(n?.68:.65),lx=W*(n?.45:.48),ly=dy+H*.015,lw=Math.max(115,Math.min(185,W*(n?.33:.155))),lh=lw*.64,lsx=W*(n?.14:.22),rsx=W*(n?.78:.73),mx=lx+lw*.85,my=dy+H*.135,px=lsx+W*.09,py=dy+H*.145;return{wx,wy,ww:wwd,wh,bx,by,bw,bh,rkx,rkt,rkb,dy,lx,ly,lw,lh,lsx,rsx,mx,my,px}};const sp=(W,H,lf)=>{const L=lay(W,H);return{x:(lf?L.lsx:L.rsx)+(Math.random()-.5)*30,y:L.dy-10+Math.random()*14,vx:72+Math.random()*75,vy:-(48+Math.random()*54),r:(Math.random()-.5)*.6,vr:(Math.random()-.5)*2.6,w:22+Math.random()*14,h:28+Math.random()*15,f:Math.random()*6.28,p:Math.random()*6.28,a:.9}};const mk=()=>{if(!rx)return;rc.width=w;rc.height=h;const L=lay(w,h);const wg=rx.createLinearGradient(0,0,0,L.dy);wg.addColorStop(0,'#140c08');wg.addColorStop(.55,'#241610');wg.addColorStop(1,'#1b100b');rx.fillStyle=wg;rx.fillRect(0,0,w,h);rx.fillStyle='#2d1b12';rx.fillRect(0,L.dy-22,w,12);rx.fillStyle='#0f0805';rx.fillRect(L.wx-7,L.wy-7,L.ww+14,L.wh+14);const sg=rx.createLinearGradient(L.wx,L.wy,L.wx,L.wy+L.wh);sg.addColorStop(0,'#4f3a2c');sg.addColorStop(.55,'#8f6a46');sg.addColorStop(1,'#c99963');rx.fillStyle=sg;rx.fillRect(L.wx,L.wy,L.ww,L.wh);rx.fillStyle='rgba(24,14,9,0.55)';for(let sy=L.wy+12;sy<L.wy+L.wh*.52;sy+=13)rx.fillRect(L.wx,sy,L.ww,4);rx.fillStyle='#2a1910';rx.fillRect(L.wx+L.ww*.5-3,L.wy,6,L.wh);rx.fillRect(L.wx,L.wy+L.wh*.52-3,L.ww,6);rx.fillStyle='#4b2e1e';rx.fillRect(L.bx-7,L.by-7,L.bw+14,L.bh+14);rx.fillStyle='#6d472f';rx.fillRect(L.bx,L.by,L.bw,L.bh);const pins=[{x:L.bx+L.bw*.16,y:L.by+L.bh*.26,w:38,h:46,ph:1},{x:L.bx+L.bw*.48,y:L.by+L.bh*.22,w:42,h:50,ph:1},{x:L.bx+L.bw*.8,y:L.by+L.bh*.28,w:36,h:44,ph:0},{x:L.bx+L.bw*.28,y:L.by+L.bh*.68,w:46,h:32,ph:0},{x:L.bx+L.bw*.68,y:L.by+L.bh*.72,w:44,h:36,ph:1}];rx.strokeStyle='rgba(214,48,49,0.86)';rx.lineWidth=1.6;[[0,1],[1,2],[0,3],[1,3],[1,4],[2,4],[3,4]].forEach(([a,b])=>{rx.beginPath();rx.moveTo(pins[a].x,pins[a].y);rx.quadraticCurveTo((pins[a].x+pins[b].x)*.5,(pins[a].y+pins[b].y)*.5+8,pins[b].x,pins[b].y);rx.stroke()});pins.forEach((p,i)=>{rx.save();rx.translate(p.x,p.y);rx.rotate((i%2===0?-1:1)*.06);rx.fillStyle=p.ph?'#f2e5d5':'#e6ccb2';rx.fillRect(-p.w*.5,-p.h*.5,p.w,p.h);if(p.ph){rx.fillStyle='#2d1c14';rx.fillRect(-p.w*.38,-p.h*.34,p.w*.76,p.h*.56);rx.fillStyle='#8b6346';rx.beginPath();rx.arc(0,-p.h*.14,p.w*.16,0,6.28);rx.fill()}rx.fillStyle='#dc2626';rx.beginPath();rx.arc(0,-p.h*.4,3.2,0,6.28);rx.fill();rx.restore()});rx.strokeStyle='#3b2214';rx.lineWidth=7;rx.lineCap='round';rx.beginPath();rx.moveTo(L.rkx,L.rkt);rx.lineTo(L.rkx,L.rkb);rx.stroke();const dg=rx.createLinearGradient(0,L.dy,0,h);dg.addColorStop(0,'#5a3622');dg.addColorStop(.2,'#462818');dg.addColorStop(1,'#1e0f08');rx.fillStyle=dg;rx.fillRect(0,L.dy,w,h-L.dy);rx.fillStyle='#7a4d32';rx.fillRect(0,L.dy,w,4);const st=(sx,sy,cn)=>{for(let i=0;i<cn;i++){const fw=76-(i%3)*4,ox=((i*7)%13)-6,oy=sy-i*8;rx.fillStyle=i%2===0?'#c89f72':'#dfc19c';rx.fillRect(sx-fw*.5+ox,oy,fw,11);rx.fillStyle='#f5ebe0';rx.fillRect(sx-fw*.45+ox,oy+2,fw*.88,3)}};st(L.lsx,L.dy+26,7);st(L.lsx+54,L.dy+34,4);st(L.rsx,L.dy+28,6)};const rs=()=>{w=Math.max(1,window.innerWidth);h=Math.max(1,window.innerHeight);dc.width=w;dc.height=h;dm=Array.from({length:w<640?22:40},()=>({x:Math.random()*w,y:Math.random()*h*.78,vx:8+Math.random()*14,vy:-3-Math.random()*7,r:1.1+Math.random()*1.8,a:.16+Math.random()*.32,p:Math.random()*6.28}));ww=Array.from({length:6},(_,i)=>({x:Math.random()*w,y:h*(.26+i*.09),ln:70+Math.random()*90,sp:140+Math.random()*110,a:.08+Math.random()*.1,p:Math.random()*6.28}));fp=[sp(w,h,1),sp(w,h,0)];fp[0].x=w*.34;fp[0].y=h*.52;fp[1].x=w*.62;fp[1].y=h*.44;mk()};const draw=(dt)=>{t+=dt;const tm=red?1.4:t,L=lay(w,h),gw=Math.max(0,Math.sin(tm*.85)*.55+Math.sin(tm*1.9+.7)*.45),g=Math.pow(gw,1.4);if(rx)ctx.drawImage(rc,0,0);const sw=Math.sin(tm*2.1)*.045+g*(.14+Math.sin(tm*5.2)*.035);ctx.save();ctx.translate(L.rkx,L.rkt+6);ctx.rotate(sw);ctx.fillStyle='#6f4e37';ctx.beginPath();ctx.moveTo(-20,4);ctx.quadraticCurveTo(0,-4,20,4);ctx.lineTo(31,128);ctx.lineTo(-28,124);ctx.closePath();ctx.fill();ctx.fillStyle='#4a3121';ctx.beginPath();ctx.ellipse(0,-5,22,5,-.1,0,6.28);ctx.fill();ctx.fillRect(-10,-22,20,16);ctx.fillStyle='#d4a373';ctx.fillRect(-11,-10,22,3);ctx.restore();[{x:L.lsx+96,y:L.dy+42,w:42,h:52,b:-.14},{x:L.lx-L.lw*.78,y:L.dy+34,w:48,h:34,b:.09},{x:L.rsx-72,y:L.dy+48,w:40,h:48,b:.16}].forEach((s,i)=>{const fl=Math.sin(tm*3.2+i*1.7)*.03+g*Math.sin(tm*9+i*2.1)*.11;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.b+fl);ctx.fillStyle='#f3e4d0';ctx.fillRect(-s.w*.5,-s.h*.5,s.w,s.h);ctx.fillStyle='rgba(110,72,44,0.34)';ctx.fillRect(-s.w*.34,-s.h*.25,s.w*.68,2.5);ctx.fillRect(-s.w*.34,-s.h*.05,s.w*.56,2.5);ctx.restore()});ctx.save();ctx.translate(L.lx,L.ly);const swd=L.lw,sh=L.lh;ctx.fillStyle='#1a110c';ctx.fillRect(-swd*.5,-sh,swd,sh);ctx.fillStyle='#21181c';ctx.fillRect(-swd*.5+5,-sh+5,swd-10,sh-10);const sx= -swd*.5+5,sy=-sh+5,scw=swd-10,sch=sh-10;ctx.fillStyle='#7c2d12';ctx.fillRect(sx,sy,scw,12);ctx.fillStyle='#fef3c7';ctx.font='bold 7px monospace';ctx.fillText('CASE FILE // SUSPECT',sx+6,sy+8.5);const mw=scw*.42,mh=sch-20,mx=sx+6,my=sy+16;ctx.fillStyle='#3b2d26';ctx.fillRect(mx,my,mw,mh);ctx.fillStyle='#c89f7d';ctx.beginPath();ctx.ellipse(mx+mw*.5,my+mh*.46,mw*.22,mh*.24,0,0,6.28);ctx.fill();ctx.fillStyle='#1f120c';ctx.fillRect(mx+mw*.3,my+mh*.12,mw*.4,mh*.2);ctx.fillStyle='#1c120d';ctx.fillRect(mx+mw*.5-12,my+mh-13,24,9);ctx.fillStyle='#f5ebe0';ctx.font='bold 6px monospace';ctx.fillText('409-B',mx+mw*.5-10,my+mh-6);const ix=mx+mw+8,iw=scw-mw-20;ctx.fillStyle='#d4a373';ctx.fillRect(ix,my+3,iw*.85,4);ctx.fillStyle='rgba(245,235,224,0.55)';ctx.fillRect(ix,my+12,iw*.92,3);ctx.fillRect(ix,my+19,iw*.72,3);ctx.fillStyle='rgba(217,119,6,'+(.65+.35*Math.sin(tm*3.2))+')';ctx.fillRect(ix,my+mh-15,iw*.75,11);ctx.fillStyle='#1c120d';ctx.font='bold 7px monospace';ctx.fillText('MATCH 94%',ix+4,my+mh-7);ctx.fillStyle='#2d1c14';ctx.beginPath();ctx.moveTo(-swd*.5,0);ctx.lineTo(swd*.5,0);ctx.lineTo(swd*.62,24);ctx.lineTo(-swd*.62,24);ctx.closePath();ctx.fill();ctx.restore();ctx.save();ctx.translate(L.mx,L.my);ctx.rotate(-.42+g*.025);ctx.fillStyle='#2c180e';ctx.fillRect(14,-3.5,34,7);ctx.fillStyle='rgba(245,235,224,0.22)';ctx.beginPath();ctx.arc(0,0,15,0,6.28);ctx.fill();ctx.strokeStyle='#d4a373';ctx.lineWidth=3.5;ctx.stroke();ctx.restore();ctx.save();ctx.translate(L.px+g*Math.sin(tm*6.5),L.py);ctx.rotate(.28+g*.03*Math.sin(tm*7));ctx.fillStyle='#1a0f0a';ctx.fillRect(-20,-2.5,34,5);ctx.fillStyle='#d4a373';ctx.fillRect(8,-2.5,6,5);ctx.restore();const bg=ctx.createLinearGradient(L.wx+L.ww*.4,L.wy,L.lx+160,h);bg.addColorStop(0,'rgba(246,213,165,0.2)');bg.addColorStop(.6,'rgba(212,163,115,0.1)');bg.addColorStop(1,'rgba(212,163,115,0)');ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(L.wx,L.wy);ctx.lineTo(L.wx+L.ww,L.wy+10);ctx.lineTo(L.lx+220,h);ctx.lineTo(L.lsx-80,h);ctx.closePath();ctx.fill();dm.forEach(m=>{if(dt>0){m.x+=(m.vx+g*45)*dt;m.y+=m.vy*dt;if(m.x>w+10)m.x=-10;if(m.y<0)m.y=h*.8}ctx.fillStyle='rgba(245,222,185,'+m.a+')';ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,6.28);ctx.fill()});if(g>.18){ww.forEach(wi=>{if(dt>0){wi.x+=wi.sp*(.6+g)*dt;if(wi.x>w+wi.ln)wi.x=-wi.ln}ctx.strokeStyle='rgba(245,235,224,'+(wi.a*g)+')';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(wi.x,wi.y);ctx.lineTo(wi.x+wi.ln,wi.y+4);ctx.stroke()})}if(dt>0&&!red){sc-=dt*(.7+g*1.4);if(sc<=0&&fp.length<5){fp.push(sp(w,h,Math.random()>.25));sc=1.6+Math.random()*1.8}}for(let i=fp.length-1;i>=0;i--){const p=fp[i];if(dt>0){p.x+=(p.vx+g*95)*dt;p.y+=(p.vy+Math.sin(tm*3.4+p.p)*28)*dt;p.vy+=12*dt;p.r+=p.vr*dt;p.f+=4.2*dt}ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.scale(1,.55+.45*Math.abs(Math.cos(p.f)));ctx.fillStyle='rgba(245,235,220,'+p.a+')';ctx.fillRect(-p.w*.5,-p.h*.5,p.w,p.h);ctx.restore();if(p.x>w+80||p.y<-80||p.y>h+80)fp.splice(i,1)}};rs();draw(0);window.addEventListener('resize',rs);if(!red){let last=0;const loop=ts=>{if(ts-last>=45){const dt=last?Math.min(.1,(ts-last)/1000):.045;last=ts;draw(dt)}requestAnimationFrame(loop)};requestAnimationFrame(loop)}}}
else if(deck.theme==='summer'){const sm=document.createElement('canvas');sm.id='summer-bg';document.body.insertBefore(sm,document.body.firstChild);const ctx=sm.getContext('2d');if(ctx){const sc=document.createElement('canvas');const sx=sc.getContext('2d');let w=0,h=0,t=0,bz=[],hb=[],sp=[];const red=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const lay=(W,H)=>{const n=W<640,hy=H*(n?.34:.37),sy=H*(n?.56:.58),ux=W*(n?.22:.18),uy=H*(n?.14:.16),ur=Math.max(30,Math.min(58,Math.min(W,H)*.068)),lpx=W*(n?.05:.06),rpx=W*(n?.96:.94),rx=W*(n?.78:.885),ry=hy+(sy-hy)*.54,wx=W*(n?.26:.135),wy=sy-H*.015,stx=W*(n?.18:.135),sty=H*.73,sts=n?.74:Math.max(.84,Math.min(1.12,W/1280)),ubx=W*(n?.75:.815),uby=H*(n?.72:.71),ubs=n?.74:Math.max(.86,Math.min(1.14,W/1260)),rkx=W*(n?.89:.915),rky=sy+H*.09,rks=n?.72:Math.max(.82,Math.min(1.06,W/1280)),wgx=W*(n?.3:.33),wgy=H*.88,ggx=W*(n?.67:.65),ggy=H*(n?.86:.85);return{n,hy,sy,ux,uy,ur,lpx,rpx,rx,ry,wx,wy,stx,sty,sts,ubx,uby,ubs,rkx,rky,rks,wgx,wgy,ggx,ggy}};const mk=()=>{if(!sx)return;sc.width=w;sc.height=h;const L=lay(w,h),sk=sx.createLinearGradient(0,0,0,L.hy);sk.addColorStop(0,'#fef08a');sk.addColorStop(.52,'#fef9c3');sk.addColorStop(.86,'#fde68a');sk.addColorStop(1,'#bae6fd');sx.fillStyle=sk;sx.fillRect(0,0,w,L.hy+4);const hl=sx.createRadialGradient(L.ux,L.uy,L.ur*.4,L.ux,L.uy,L.ur*4.5);hl.addColorStop(0,'rgba(254,240,138,.95)');hl.addColorStop(.35,'rgba(250,204,21,.35)');hl.addColorStop(1,'rgba(254,249,195,0)');sx.fillStyle=hl;sx.fillRect(0,0,w,L.hy+30);sx.fillStyle='#facc15';sx.beginPath();sx.arc(L.ux,L.uy,L.ur,0,6.28);sx.fill();const og=sx.createLinearGradient(0,L.hy,0,L.sy+24);og.addColorStop(0,'#0284c7');og.addColorStop(.55,'#0ea5e9');og.addColorStop(1,'#7dd3fc');sx.fillStyle=og;sx.fillRect(0,L.hy,w,L.sy-L.hy+28);const sg=sx.createLinearGradient(0,L.sy-10,0,h);sg.addColorStop(0,'#fde68a');sg.addColorStop(.35,'#fcd34d');sg.addColorStop(.75,'#facc15');sg.addColorStop(1,'#eab308');sx.fillStyle=sg;sx.beginPath();sx.moveTo(0,L.sy+8);sx.quadraticCurveTo(w*.28,L.sy-10,w*.56,L.sy+6);sx.quadraticCurveTo(w*.8,L.sy+18,w,L.sy-4);sx.lineTo(w,h);sx.lineTo(0,h);sx.closePath();sx.fill();const pt=(bx,by,tx,ty)=>{sx.strokeStyle='#78350f';sx.lineWidth=L.n?11:15;sx.lineCap='round';sx.beginPath();sx.moveTo(bx,by);sx.quadraticCurveTo((bx+tx)*.5+(tx>bx?-18:18),(by+ty)*.5,tx,ty);sx.stroke()};pt(L.lpx-8,h*.76,L.lpx+(L.n?34:52),h*.24);pt(L.rpx+8,h*.74,L.rpx-(L.n?32:48),h*.22);sx.save();sx.translate(L.rkx,L.rky);sx.scale(L.rks,L.rks);sx.fillStyle='#92400e';sx.fillRect(-34,-22,6,54);sx.fillRect(28,-22,6,54);sx.fillStyle='#b45309';sx.fillRect(-38,18,76,6);sx.fillRect(-38,-8,76,5);[[-18,-0.07,'#fef08a'],[0,0.02,'#fb923c'],[18,0.08,'#38bdf8']].forEach(([ox,rt,cl])=>{sx.save();sx.translate(ox,20);sx.rotate(rt);sx.fillStyle=cl;sx.beginPath();sx.moveTo(0,-68);sx.quadraticCurveTo(13,-38,10,12);sx.lineTo(-10,12);sx.quadraticCurveTo(-13,-38,0,-68);sx.closePath();sx.fill();sx.restore()});sx.restore();sx.save();sx.translate(L.stx,L.sty);sx.scale(L.sts,L.sts);sx.fillStyle='#92400e';sx.fillRect(-48,-56,7,98);sx.fillRect(41,-56,7,98);sx.fillStyle='#b45309';sx.fillRect(-52,4,104,38);sx.fillStyle='#d97706';sx.fillRect(-56,-2,112,8);sx.fillStyle='#facc15';sx.beginPath();sx.moveTo(-64,-52);sx.lineTo(64,-52);sx.lineTo(54,-78);sx.lineTo(-54,-78);sx.closePath();sx.fill();sx.fillStyle='#78350f';sx.fillRect(-30,-45,60,15);sx.fillStyle='#fef08a';sx.font='bold 8px sans-serif';sx.textAlign='center';sx.fillText('FRESH JUICE',0,-35);sx.restore();sx.save();sx.translate(L.ubx,L.uby);sx.scale(L.ubs,L.ubs);sx.save();sx.translate(22,34);sx.rotate(-.08);sx.fillStyle='#fffbeb';sx.strokeStyle='#eab308';sx.lineWidth=2;sx.beginPath();sx.roundRect(-38,-11,76,22,6);sx.fill();sx.stroke();sx.fillStyle='#facc15';sx.fillRect(-26,-10,12,20);sx.fillRect(0,-10,12,20);sx.fillStyle='#f59e0b';sx.beginPath();sx.roundRect(22,-9,13,18,5);sx.fill();sx.restore();sx.strokeStyle='#92400e';sx.lineWidth=5;sx.beginPath();sx.moveTo(-4,38);sx.lineTo(-4,-54);sx.stroke();sx.fillStyle='#92400e';sx.fillRect(-38,18,4,22);sx.fillRect(-22,18,4,22);sx.fillStyle='#fef3c7';sx.strokeStyle='#d97706';sx.lineWidth=2;sx.beginPath();sx.roundRect(-52,11,48,8,4);sx.fill();sx.stroke();sx.restore();sx.save();sx.translate(L.wgx,L.wgy);sx.rotate(-.24);sx.fillStyle='#f97316';sx.beginPath();sx.roundRect(-18,0,9,16,3);sx.fill();sx.fillStyle='#facc15';sx.beginPath();sx.roundRect(-22,-10,38,12,5);sx.fill();sx.fillStyle='#38bdf8';sx.beginPath();sx.roundRect(-14,-18,22,9,4);sx.fill();sx.fillRect(15,-7,9,6);sx.restore();sx.save();sx.translate(L.ggx,L.ggy);sx.rotate(.32);sx.strokeStyle='#eab308';sx.lineWidth=3;sx.beginPath();sx.moveTo(-16,0);sx.bezierCurveTo(-26,-12,18,-22,16,0);sx.stroke();sx.fillStyle='#facc15';sx.beginPath();sx.roundRect(-17,-6,15,11,5);sx.roundRect(2,-6,15,11,5);sx.fill();sx.fillStyle='#38bdf8';sx.beginPath();sx.roundRect(-14.5,-4,10,7,3.5);sx.roundRect(4.5,-4,10,7,3.5);sx.fill();sx.restore()};const rs=()=>{w=Math.max(1,window.innerWidth);h=Math.max(1,window.innerHeight);sm.width=w;sm.height=h;const L=lay(w,h);bz=Array.from({length:w<640?4:7},(_,i)=>({x:Math.random()*w,y:h*(.14+i*.09),l:65+Math.random()*85,s:62+Math.random()*55,a:.22+Math.random()*.22,p:Math.random()*6.28}));hb=[{x:w*.35,y:h*.14,vx:38,s:w<640?.72:1,fs:5.4,p:.4},{x:w*.72,y:h*.21,vx:-34,s:w<640?.65:.86,fs:6.1,p:2.3}];sp=Array.from({length:18},()=>({x:Math.random()*w,y:L.hy+8+Math.random()*(L.sy-L.hy-14),r:1.5+Math.random()*1.6,p:Math.random()*6.28}));mk()};const gl=(gx,gy,gw,gh,ang,bp,st)=>{ctx.save();ctx.translate(gx,gy);ctx.strokeStyle=st;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gw*.15,-gh+4);ctx.lineTo(gw*.48,-gh-9);ctx.stroke();ctx.save();ctx.beginPath();ctx.moveTo(-gw*.5,-gh);ctx.lineTo(gw*.5,-gh);ctx.lineTo(gw*.38,0);ctx.lineTo(-gw*.38,0);ctx.closePath();ctx.clip();ctx.fillStyle='rgba(255,255,255,.45)';ctx.fillRect(-gw,-gh,gw*2,gh);ctx.save();ctx.translate(0,-gh*.58);ctx.rotate(ang);ctx.fillStyle='#facc15';ctx.fillRect(-gw*1.4,0,gw*2.8,gh*1.4);ctx.fillStyle='rgba(255,255,255,.72)';ctx.fillRect(-gw*.25,2+Math.sin(bp)*1.6,5,5);ctx.fillRect(gw*.05,4+Math.cos(bp+1.2)*1.5,4.5,4.5);ctx.restore();ctx.restore();ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-gw*.5,-gh);ctx.lineTo(-gw*.38,0);ctx.lineTo(gw*.38,0);ctx.lineTo(gw*.5,-gh);ctx.stroke();ctx.restore()};const pm=(tx,ty,sw,s)=>{ctx.save();ctx.translate(tx,ty);ctx.scale(s,s);ctx.fillStyle='#713f12';ctx.beginPath();ctx.arc(-6,6,6,0,6.28);ctx.arc(6,7,6,0,6.28);ctx.fill();[-2.55,-2.05,-1.35,-.55,.15,.75].forEach((ba,i)=>{ctx.save();ctx.rotate(ba+sw*(.85+(i%2)*.28));ctx.fillStyle=i%2===0?'#16a34a':'#22c55e';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(38,-18,84,8);ctx.quadraticCurveTo(42,6,0,4);ctx.closePath();ctx.fill();ctx.restore()});ctx.restore()};const draw=(dt)=>{t+=dt;const tm=red?1.2:t,L=lay(w,h),br=Math.sin(tm*1.4)*.055+Math.sin(tm*2.7+.6)*.025;if(sx)ctx.drawImage(sc,0,0);sp.forEach(s=>{ctx.fillStyle='rgba(254,249,195,'+(0.2+0.6*Math.max(0,Math.sin(tm*2.8+s.p))).toFixed(2)+')';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);ctx.fill()});for(let b=0;b<3;b++){const by=L.hy+(L.sy-L.hy)*(.34+b*.31),am=4+b*2.5,of=Math.sin(tm*(1.2+b*.22)+b)*(5+b*3);ctx.strokeStyle=b===2?'rgba(255,255,255,.85)':'rgba(224,242,254,.56)';ctx.lineWidth=b===2?4.5:2.5;ctx.beginPath();for(let wx=0;wx<=w;wx+=28){const wy=by+of+Math.sin(wx*.016+tm*(1.7+b*.3)+b*1.4)*am;wx===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy)}ctx.stroke()}ctx.save();ctx.translate(L.rx+Math.sin(tm*.7)*8,L.ry+Math.sin(tm*2.1)*5);ctx.rotate(Math.sin(tm*1.55)*.1);ctx.scale(L.n?.78:1,(L.n?.78:1)*.65);ctx.lineWidth=11;ctx.strokeStyle='#facc15';ctx.beginPath();ctx.arc(0,0,19,0,6.28);ctx.stroke();ctx.strokeStyle='#fb7185';ctx.beginPath();ctx.arc(0,0,19,-.3,.55);ctx.stroke();ctx.beginPath();ctx.arc(0,0,19,2.84,3.69);ctx.stroke();ctx.restore();const hbb=Math.sin(tm*1.6)*2.5;ctx.save();ctx.translate(L.wx,L.wy);ctx.scale(L.n?.78:1,L.n?.78:1);ctx.strokeStyle='#ea580c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,-2);ctx.lineTo(-6,18);ctx.moveTo(4,-2);ctx.lineTo(5,18);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,-6,14,7.5,-.15,0,6.28);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(10,-8);ctx.bezierCurveTo(15,-18,9,-28+hbb,15,-32+hbb);ctx.stroke();ctx.fillStyle='#f59e0b';ctx.beginPath();ctx.moveTo(18,-33+hbb);ctx.lineTo(30,-30+hbb);ctx.lineTo(18,-29+hbb);ctx.closePath();ctx.fill();ctx.restore();hb.forEach(b=>{if(dt>0&&!red){b.x+=b.vx*dt;if(b.vx>0&&b.x>w+60)b.x=-60;if(b.vx<0&&b.x<-60)b.x=w+60}const fl=Math.sin(tm*b.fs+b.p);ctx.save();ctx.translate(b.x,b.y+Math.sin(tm*2.1+b.p)*4);ctx.scale(b.s*(b.vx>=0?1:-1),b.s);ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(-2,2,13,5,-.05,0,6.28);ctx.fill();ctx.fillStyle='#f59e0b';ctx.beginPath();ctx.moveTo(22,-9);ctx.lineTo(33,-7.5);ctx.lineTo(22,-6.5);ctx.closePath();ctx.fill();ctx.fillStyle='#fffbeb';ctx.beginPath();ctx.moveTo(-4,0);ctx.quadraticCurveTo(2,-24+fl*22,-21,-18+fl*26);ctx.quadraticCurveTo(-10,-2,-4,3);ctx.fill();ctx.restore()});pm(L.lpx+(L.n?34:52),h*.24,br,L.n?.72:1.04);pm(L.rpx-(L.n?32:48),h*.22,-br*.9,L.n?.72:1.02);ctx.save();ctx.translate(L.ubx,L.uby);ctx.scale(L.ubs,L.ubs);ctx.save();ctx.translate(-4,-52);ctx.rotate(br*.65);[[-64,-36,'#facc15'],[-36,-12,'#fffbeb'],[-12,12,'#eab308'],[12,36,'#fffbeb'],[36,64,'#facc15']].forEach(([x0,x1,c])=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(x0,8);ctx.quadraticCurveTo((x0+x1)*.5,14,x1,8);ctx.closePath();ctx.fill()});ctx.restore();gl(-38,11,13,18,Math.sin(tm*3.1)*.14+br*.7,tm*3.4,'#fb7185');gl(-18,11,12,16,Math.sin(tm*3.1+.9)*.14-br*.5,tm*3.4+1.4,'#38bdf8');ctx.restore();ctx.save();ctx.translate(L.stx,L.sty);ctx.scale(L.sts,L.sts);gl(14,-2,13,18,Math.sin(tm*2.9+.4)*.13,tm*3.2,'#ef4444');gl(34,-2,12,16,Math.sin(tm*2.9+1.5)*.13,tm*3.2+1.1,'#22c55e');ctx.restore();bz.forEach(z=>{if(dt>0&&!red){z.x+=z.s*dt;if(z.x>w+z.l+20)z.x=-z.l-20}ctx.strokeStyle='rgba(255,251,235,'+z.a.toFixed(2)+')';ctx.lineWidth=1.6;ctx.beginPath();const yo=Math.sin(tm*1.8+z.p)*5;ctx.moveTo(z.x,z.y+yo);ctx.quadraticCurveTo(z.x+z.l*.5,z.y-8+yo,z.x+z.l,z.y+2+yo);ctx.stroke()})};rs();draw(0);window.addEventListener('resize',rs);if(!red){let last=0;const loop=ts=>{if(ts-last>=42){const dt=last?Math.min(.1,(ts-last)/1000):.042;last=ts;draw(dt)}requestAnimationFrame(loop)};requestAnimationFrame(loop)}}}})();
</script>
</body>
</html>`;
}

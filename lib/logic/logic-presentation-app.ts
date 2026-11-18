import type {
  Block,
  Deck,
  DropdownBlock,
  Slide,
  SlideAiContext,
} from '../deck-types';
import {
  clamp,
  createDefaultDeck,
  flattenBlocks,
  getDeckDisplayTitle,
  getSlideHeaderTitle,
  getSlideTitle,
  loadAndNormalizeDeck,
  stripMarkup,
  syncSlideModals,
  uid,
} from '../deck-logic';

export {
  clamp,
  createDefaultDeck,
  getDeckDisplayTitle,
  getSlideHeaderTitle,
  getSlideTitle,
  loadAndNormalizeDeck,
  stripMarkup,
  syncSlideModals,
  uid,
};

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

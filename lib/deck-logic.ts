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
  TextAlign,
  TextBlock,
  TextSize,
  ThemeId,
} from './deck-types';

export const THEME_META: Record<ThemeId, { name: string; description: string }> = {
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

export function scanModalTitles(slide: Slide): string[] {
  const out: string[] = [];
  walkBlocks(slide.blocks, (b) => {
    const str =
      b.t === 'text' || b.t === 'concl'
        ? b.text
        : b.t === 'dd'
          ? b.detail
          : b.t === 'box'
            ? b.title
            : '';
    String(str || '').replace(/\[\[\[(.*?)\]\]\]/g, (match, inner) => {
      const clean = String(inner).trim();
      if (!out.includes(clean)) {
        out.push(clean);
      }
      return match;
    });
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
    theme: legacy.theme && THEME_META[legacy.theme] ? legacy.theme : 'brutal',
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
  const theme: ThemeId = THEME_META[migrated.theme] ? migrated.theme : 'brutal';
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
    theme: 'brutal',
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

export function getSlideTitle(slide: Slide): string {
  if (slide.name) return slide.name;
  const firstText = flattenBlocks(slide.blocks).find(
    (b): b is TextBlock => b.t === 'text' && b.text.trim().length > 0
  );
  return firstText ? stripMarkup(firstText.text).split('\n')[0] : 'Slide';
}

export function buildSlideAiContext(deck: Deck, slide: Slide): SlideAiContext {
  const flat = flattenBlocks(slide.blocks);
  const pointsText = flat
    .filter((b): b is DropdownBlock => b.t === 'dd')
    .map((b) => stripMarkup(b.text))
    .filter(Boolean)
    .join('; ');
  const slideText = flat
    .filter((b): b is TextBlock => b.t === 'text')
    .map((b) => stripMarkup(b.text))
    .filter(Boolean)
    .join(' / ')
    .slice(0, 700);
  return {
    deckTitle: deck.title || 'Presentasi',
    slideTitle: getSlideTitle(slide),
    slideText,
    pointsText,
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
  const theme = deck.theme === 'auditor' ? 'auditor' : 'brutal';

  return `<!doctype html>
<html lang="id" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#fff4d6;--fg:#111;--card:#fff;--ln:#111;--acc:#ff6b35;--acc2:#2ec4b6;--acc3:#ffd23f;--mut:#555;--r:10px}
:root[data-theme=auditor]{--bg:#f4f6f9;--fg:#1b2430;--card:#fff;--ln:#14243d;--acc:#b08d3c;--acc2:#14243d;--acc3:#14243d;--mut:#5b6677;--r:6px}
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{background:var(--bg);color:var(--fg);font-family:'Bricolage Grotesque',system-ui,sans-serif;font-size:16px;line-height:1.5}
[data-theme=auditor] body{font-family:'Plus Jakarta Sans',system-ui,sans-serif}
#app{min-height:100vh;display:flex;flex-direction:column}
header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:3px solid var(--ln);background:var(--acc3);color:#111;position:sticky;top:0;z-index:20}
[data-theme=auditor] header{background:#14243d;color:#fff;border-bottom:3px solid #b08d3c}
.brand{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.btn{border:3px solid var(--ln);background:var(--card);color:var(--fg);padding:6px 12px;border-radius:var(--r);box-shadow:3px 3px 0 var(--ln);font-weight:600;cursor:pointer}
[data-theme=auditor] .btn{border:1px solid #c5ccd8;border-radius:6px;box-shadow:0 1px 2px rgba(16,24,40,.08)}
main{flex:1;padding:20px 16px 100px;max-width:1000px;width:100%;margin:0 auto}
.cv{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px;align-items:start}
.cv.free{display:block;position:relative}.cv.free>.blk{position:absolute;transition:top .24s ease}
.card{border:3px solid var(--ln);background:var(--card);border-radius:var(--r);box-shadow:5px 5px 0 var(--ln)}
[data-theme=auditor] .card{border:1px solid #d5dbe5;border-top:3px solid #14243d;box-shadow:0 1px 3px rgba(16,24,40,.08)}
.ch{display:flex;width:100%;gap:10px;align-items:center;text-align:left;background:none;border:0;padding:14px;font-weight:700;font-size:17px;cursor:pointer}
.ch .n{flex:none;min-width:30px;height:30px;padding:0 6px;border:3px solid var(--ln);border-radius:999px;display:grid;place-items:center;background:var(--acc2);font-size:14px}
.cb{display:none;margin:0 14px 14px;padding-top:12px;border-top:3px dashed var(--ln)}.card.open .cb{display:block}
.concl{margin-top:12px;border:3px solid var(--ln);background:var(--acc2);padding:16px;border-radius:var(--r);box-shadow:5px 5px 0 var(--ln);font-weight:600}
.term{border:0;border-bottom:3px solid var(--acc);background:var(--acc3);padding:0 4px;font:inherit;font-weight:600;border-radius:3px;cursor:pointer}
.term.mt{background:var(--acc2);border-bottom-color:var(--ln);cursor:pointer}
.s-s{font-size:14px}.s-m{font-size:18px}.s-l{font-size:28px;line-height:1.25}.s-xl{font-size:clamp(28px,6vw,46px);line-height:1.1}.s-xxl{font-size:clamp(38px,9vw,84px);line-height:1.05}
.a-l{text-align:left}.a-c{text-align:center}.a-r{text-align:right}.bd{font-weight:700}
.box{padding:14px}.bt{font-weight:700;font-size:20px;margin-bottom:12px}
.im{display:block;width:100%;height:auto;border-radius:6px}
nav{position:fixed;left:0;right:0;bottom:0;display:flex;align-items:center;gap:10px;padding:10px ${hasByok ? '84px' : '16px'} 12px 16px;background:var(--bg);border-top:3px solid var(--ln);z-index:15}
.prog{flex:1;height:14px;border:3px solid var(--ln);border-radius:99px;background:var(--card);overflow:hidden}.prog i{display:block;height:100%;background:var(--acc)}
.cnt{font-family:'Space Mono',monospace;font-size:13px;min-width:42px;text-align:center}
#pm{position:fixed;inset:0;background:rgba(0,0,0,.5);display:grid;place-items:center;z-index:30;padding:16px}#pm[hidden]{display:none}
.pmc{background:var(--card);border:3px solid var(--ln);border-radius:14px;padding:18px;width:min(620px,100%);max-height:86vh;overflow:auto}
.fab{position:fixed;right:16px;bottom:12px;width:54px;height:54px;border-radius:50%;border:3px solid var(--ln);background:var(--acc);color:#111;box-shadow:4px 4px 0 var(--ln);z-index:35;font-size:20px;display:grid;place-items:center;cursor:pointer}
.bub{position:fixed;right:16px;bottom:78px;width:min(380px,calc(100vw - 24px));max-height:60vh;display:flex;flex-direction:column;border:3px solid var(--ln);background:var(--card);border-radius:14px;box-shadow:6px 6px 0 var(--ln);z-index:35;overflow:hidden}
.bubh{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--acc3);border-bottom:3px solid var(--ln);font-weight:700}
.bubm{flex:1;overflow:auto;padding:10px;display:flex;flex-direction:column;gap:8px;font-size:14px}
.bmsg{padding:8px 10px;border:2px solid var(--ln);border-radius:10px;max-width:92%}.bmsg.u{align-self:flex-end;background:var(--acc2)}.bmsg.a{align-self:flex-start}
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
const renderBlocks=(arr)=>{let n=0;return arr.map(b=>{
  let h='';
  if(b.t==='text')h='<div class="s-'+(b.size||'m')+' a-'+(b.align||'l')+(b.b?' bd':'')+'">'+fmt(b.text)+'</div>';
  else if(b.t==='img')h=b.src?'<img class="im" src="'+esc(b.src)+'" alt="'+esc(b.alt)+'">':'';
  else if(b.t==='dd'){n++;const o=open.has(b.id);const bd=(b.badge&&String(b.badge).trim())?b.badge:String(n);h='<div class="card'+(o?' open':'')+'"><button class="ch" data-card="'+b.id+'"><span class="n">'+esc(bd)+'</span><span>'+esc(b.text)+'</span></button><div class="cb">'+fmt(b.detail)+'</div></div>'}
  else if(b.t==='box')h='<div class="card box">'+(b.title?'<div class="bt">'+fmt(b.title)+'</div>':'')+'<div class="cv">'+renderBlocks(b.children||[])+'</div></div>';
  else{const o=open.has(b.id);h='<button class="btn" data-concl="'+b.id+'">'+(o?'Tutup kesimpulan':esc(b.label||'★ Kesimpulan'))+'</button>'+(o?'<div class="concl">'+fmt(b.text)+'</div>':'')}
  const style=b.y!=null?'left:'+Math.max(0,Math.min(100-b.w/12*100,b.x||0))+'%;top:'+b.y+'px;width:'+b.w/12*100+'%':'grid-column:span '+b.w;
  return '<div class="blk" style="'+style+'">'+h+'</div>';
}).join('')};
const callAi=async(q)=>{
  if(!byok.length||aiBusy)return;
  msgs.push({r:'u',t:q});aiBusy=true;aiOpen=true;render();
  const sys='Kamu asisten presentasi "'+deck.title+'". Jawab dalam bahasa Indonesia secara ringkas dan jelas.';
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
  const aiHtml=byok.length?('<button class="fab" id="fab">✦</button>'+(aiOpen?'<div class="bub"><div class="bubh"><span>Asisten AI</span><button class="btn" id="cbub" style="padding:2px 8px">✕</button></div><div class="bubm">'+(msgs.length?msgs.map(m=>'<div class="bmsg '+m.r+'">'+fmt(m.t)+'</div>').join(''):'<div class="bmsg a">Klik istilah bertanda kuning untuk penjelasan.</div>')+(aiBusy?'<div class="bmsg a">Sedang berpikir…</div>':'')+'</div></div>':'')):'';
  document.getElementById('app').innerHTML='<header><div class="brand">'+esc(deck.title)+'</div><button class="btn" id="fs">▶</button></header><main><div class="cv'+(free?' free':'')+'">'+renderBlocks(sl.blocks)+'</div></main><nav><button class="btn" id="pv"'+(idx<=0?' disabled':'')+'>◀</button><div class="prog"><i style="width:'+((idx+1)/deck.slides.length*100)+'%"></i></div><span class="cnt">'+(idx+1)+'/'+deck.slides.length+'</span><button class="btn" id="nx"'+(idx>=deck.slides.length-1?' disabled':'')+'>▶</button></nav>'+aiHtml+'<div id="pm"'+(pmId?'':' hidden')+'>'+(pmId?(() => {const m=(sl.modals||[]).find(x=>x.id===pmId);return m?'<div class="pmc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><h2>'+esc(m.title)+'</h2><button class="btn" id="cpm">✕</button></div><div class="cv">'+renderBlocks(m.children||[])+'</div></div>':'';})():'')+'</div>';
  if(free){const r=document.querySelector('.cv.free');let b=0;[...r.children].forEach(e=>{b=Math.max(b,e.offsetTop+e.offsetHeight)});r.style.height=(b+40)+'px'}
};
document.addEventListener('click',e=>{
  const t=e.target;
  if(t.closest('#pv')&&idx>0){idx--;render()}
  else if(t.closest('#nx')&&idx<deck.slides.length-1){idx++;render()}
  else if(t.closest('#fs')){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}
  else if(t.closest('#fab')){aiOpen=!aiOpen;render()}
  else if(t.closest('#cbub')){aiOpen=false;render()}
  else if(t.closest('[data-ai]')){callAi('Jelaskan istilah atau poin ini: "'+t.closest('[data-ai]').dataset.ai+'"')}
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

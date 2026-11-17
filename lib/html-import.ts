import {
  clamp,
  createTextBlock,
  loadAndNormalizeDeck,
  stripMarkup,
  syncSlideModals,
  uid,
} from './deck-logic';
import type {
  Block,
  BoxBlock,
  Deck,
  Slide,
  TextAlign,
  TextSize,
  ThemeId,
} from './deck-types';

export interface HtmlImportResult {
  deck: Deck;
  source: 'opres' | 'html';
  slideCount: number;
  blockCount: number;
}

interface HtmlElementNode {
  kind: 'element';
  tag: string;
  attrs: Record<string, string>;
  children: HtmlNode[];
}

interface HtmlTextNode {
  kind: 'text';
  text: string;
}

type HtmlNode = HtmlElementNode | HtmlTextNode;

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const SKIP_CONTENT_TAGS = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'svg',
]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rarr: '→',
  larr: '←',
  uarr: '↑',
  darr: '↓',
  bull: '•',
  copy: '©',
  reg: '®',
  trade: '™',
  times: '×',
  divide: '÷',
  plusmn: '±',
};

export function decodeHtmlEntities(input: string): string {
  return input.replace(
    /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g,
    (full, entity: string) => {
      if (entity.startsWith('#x') || entity.startsWith('#X')) {
        const cp = Number.parseInt(entity.slice(2), 16);
        return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : full;
      }
      if (entity.startsWith('#')) {
        const cp = Number.parseInt(entity.slice(1), 10);
        return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : full;
      }
      return NAMED_ENTITIES[entity] ?? full;
    }
  );
}

function parseAttributes(attrText: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re =
    /([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrText)) !== null) {
    const key = match[1].toLowerCase();
    const rawVal = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = decodeHtmlEntities(rawVal);
  }
  return attrs;
}

function parseHtmlTree(html: string): HtmlElementNode {
  const root: HtmlElementNode = { kind: 'element', tag: 'root', attrs: {}, children: [] };
  const stack: HtmlElementNode[] = [root];

  const cleaned = html
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  let i = 0;
  const len = cleaned.length;

  while (i < len) {
    const lt = cleaned.indexOf('<', i);
    if (lt === -1) {
      const tail = cleaned.slice(i);
      if (tail) {
        stack[stack.length - 1].children.push({
          kind: 'text',
          text: decodeHtmlEntities(tail),
        });
      }
      break;
    }

    if (lt > i) {
      const txt = cleaned.slice(i, lt);
      stack[stack.length - 1].children.push({
        kind: 'text',
        text: decodeHtmlEntities(txt),
      });
    }

    const gt = cleaned.indexOf('>', lt + 1);
    if (gt === -1) {
      stack[stack.length - 1].children.push({
        kind: 'text',
        text: decodeHtmlEntities(cleaned.slice(lt)),
      });
      break;
    }

    const rawTag = cleaned.slice(lt + 1, gt).trim();
    i = gt + 1;

    if (!rawTag) continue;

    // Closing tag
    if (rawTag.startsWith('/')) {
      const closeName = rawTag.slice(1).trim().toLowerCase().split(/\s+/)[0];
      for (let s = stack.length - 1; s > 0; s--) {
        if (stack[s].tag === closeName) {
          stack.length = s;
          break;
        }
      }
      continue;
    }

    const selfClosing = rawTag.endsWith('/');
    const body = selfClosing ? rawTag.slice(0, -1).trim() : rawTag;
    const spaceIdx = body.search(/\s/);
    const tag = (spaceIdx === -1 ? body : body.slice(0, spaceIdx)).toLowerCase();
    const attrText = spaceIdx === -1 ? '' : body.slice(spaceIdx + 1);

    if (!/^[a-z][a-z0-9:-]*$/.test(tag)) {
      continue;
    }

    // Raw text elements like <script>, <style>, <svg>
    if (SKIP_CONTENT_TAGS.has(tag) && !selfClosing) {
      const closeRe = new RegExp(`</${tag}\\s*>`, 'i');
      const rest = cleaned.slice(i);
      const closeMatch = closeRe.exec(rest);
      if (closeMatch) {
        i += closeMatch.index + closeMatch[0].length;
      } else {
        i = len;
      }
      continue;
    }

    const el: HtmlElementNode = {
      kind: 'element',
      tag,
      attrs: parseAttributes(attrText),
      children: [],
    };
    stack[stack.length - 1].children.push(el);

    if (!selfClosing && !VOID_TAGS.has(tag)) {
      stack.push(el);
    }
  }

  return root;
}

function getClasses(el: HtmlElementNode): string[] {
  return (el.attrs.class || '')
    .split(/\s+/)
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

function hasClass(el: HtmlElementNode, name: string): boolean {
  return getClasses(el).includes(name.toLowerCase());
}

function hasAnyClass(el: HtmlElementNode, patterns: RegExp[]): boolean {
  const classes = getClasses(el);
  return classes.some((cls) => patterns.some((p) => p.test(cls)));
}

function findFirstByTag(root: HtmlElementNode, tag: string): HtmlElementNode | null {
  for (const child of root.children) {
    if (child.kind === 'element') {
      if (child.tag === tag) return child;
      const found = findFirstByTag(child, tag);
      if (found) return found;
    }
  }
  return null;
}

function findAllByPredicate(
  root: HtmlElementNode,
  pred: (el: HtmlElementNode) => boolean,
  stopOnMatch = true
): HtmlElementNode[] {
  const out: HtmlElementNode[] = [];
  for (const child of root.children) {
    if (child.kind !== 'element') continue;
    if (pred(child)) {
      out.push(child);
      if (stopOnMatch) continue;
    }
    out.push(...findAllByPredicate(child, pred, stopOnMatch));
  }
  return out;
}

function getPlainText(node: HtmlNode): string {
  if (node.kind === 'text') return node.text;
  if (node.tag === 'br') return '\n';
  return node.children.map(getPlainText).join('');
}

function normalizeInlineWhitespace(str: string): string {
  return str
    .replace(/\r\n/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function serializeInline(node: HtmlNode): string {
  if (node.kind === 'text') {
    return node.text.replace(/\s+/g, ' ');
  }
  if (node.tag === 'br') return '\n';
  if (node.tag === 'img') return '';

  const inner = node.children.map(serializeInline).join('');
  const trimmed = inner.trim();
  if (!trimmed) return '';

  if (node.tag === 'strong' || node.tag === 'b') {
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) return ` ${trimmed} `;
    return ` **${trimmed}** `;
  }

  if (node.attrs['data-mt'] !== undefined || (hasClass(node, 'term') && hasClass(node, 'mt'))) {
    const title = node.attrs['data-mt'] || trimmed;
    return ` [[[${title.trim()}]]] `;
  }

  if (node.attrs['data-ai'] !== undefined || hasClass(node, 'term')) {
    const term = node.attrs['data-ai'] || trimmed;
    return ` [[${term.trim()}]] `;
  }

  if (node.tag === 'p' || node.tag === 'div' || node.tag === 'li') {
    return `${trimmed}\n`;
  }

  return inner;
}

function detectAlign(el: HtmlElementNode): TextAlign {
  const alignAttr = (el.attrs.align || '').toLowerCase();
  const styleAttr = (el.attrs.style || '').toLowerCase();
  const classes = getClasses(el);
  if (
    alignAttr === 'center' ||
    /text-align\s*:\s*center/.test(styleAttr) ||
    classes.includes('text-center') ||
    classes.includes('a-c')
  ) {
    return 'c';
  }
  if (
    alignAttr === 'right' ||
    /text-align\s*:\s*right/.test(styleAttr) ||
    classes.includes('text-right') ||
    classes.includes('a-r')
  ) {
    return 'r';
  }
  return 'l';
}

function isMultiColumnContainer(el: HtmlElementNode): boolean {
  const styleAttr = (el.attrs.style || '').toLowerCase();
  const classes = getClasses(el);
  return (
    /display\s*:\s*(grid|flex)/.test(styleAttr) ||
    classes.some((c) =>
      /^(grid|row|columns|cols|cards|card-grid|flex|cv)$/.test(c) ||
      /^grid-cols-[2-6]$/.test(c)
    )
  );
}

function isCardLike(el: HtmlElementNode): boolean {
  return (
    el.tag === 'article' ||
    hasAnyClass(el, [/^card$/, /^panel$/, /^box$/, /^feature$/, /^item$/])
  );
}

function isConclusionLike(el: HtmlElementNode): boolean {
  return (
    el.tag === 'aside' ||
    hasAnyClass(el, [/^concl/, /^conclusion/, /^callout/, /^summary$/, /^takeaway/])
  );
}

function isSlideElement(el: HtmlElementNode): boolean {
  if (hasAnyClass(el, [/^slides$/, /^slide-list$/, /^slideshow$/])) return false;
  return (
    el.attrs['data-slide'] !== undefined ||
    hasAnyClass(el, [/^slide$/, /^swiper-slide$/, /^deck-slide$/, /^pres-slide$/])
  );
}

function extractBlocksFromContainer(
  nodes: HtmlNode[],
  defaultWidth = 12
): Block[] {
  const blocks: Block[] = [];

  for (const node of nodes) {
    if (node.kind === 'text') {
      const txt = normalizeInlineWhitespace(node.text);
      if (txt) {
        blocks.push({ ...createTextBlock(txt, 'm', 'l', false), w: defaultWidth });
      }
      continue;
    }

    const tag = node.tag;
    if (tag === 'header' || tag === 'nav' || tag === 'footer') {
      continue;
    }

    if (tag === 'img') {
      const src = (node.attrs.src || '').trim();
      if (src) {
        blocks.push({
          id: uid(),
          t: 'img',
          src,
          alt: (node.attrs.alt || '').trim(),
          w: clamp(defaultWidth, 3, 12),
        });
      }
      continue;
    }

    if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
      const text = normalizeInlineWhitespace(node.children.map(serializeInline).join(''));
      if (!text) continue;
      const size: TextSize =
        tag === 'h1' ? 'xl' : tag === 'h2' ? 'l' : tag === 'h3' ? 'l' : 'm';
      blocks.push({
        ...createTextBlock(text, size, detectAlign(node), true),
        w: defaultWidth,
      });
      continue;
    }

    if (tag === 'p' || tag === 'blockquote') {
      // Check if paragraph just wraps an img
      const innerImgs = node.children.filter(
        (c): c is HtmlElementNode => c.kind === 'element' && c.tag === 'img'
      );
      const text = normalizeInlineWhitespace(node.children.map(serializeInline).join(''));
      if (text) {
        blocks.push({
          ...createTextBlock(text, 'm', detectAlign(node), false),
          w: defaultWidth,
        });
      }
      for (const img of innerImgs) {
        const src = (img.attrs.src || '').trim();
        if (src) {
          blocks.push({
            id: uid(),
            t: 'img',
            src,
            alt: (img.attrs.alt || '').trim(),
            w: clamp(defaultWidth, 4, 12),
          });
        }
      }
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      const items = node.children.filter(
        (c): c is HtmlElementNode => c.kind === 'element' && c.tag === 'li'
      );
      const lines = items
        .map((li, idx) => {
          const txt = normalizeInlineWhitespace(
            li.children.map(serializeInline).join('')
          );
          if (!txt) return '';
          return tag === 'ol' ? `${idx + 1}. ${txt}` : `- ${txt}`;
        })
        .filter(Boolean);
      if (lines.length > 0) {
        blocks.push({
          ...createTextBlock(lines.join('\n'), 'm', 'l', false),
          w: defaultWidth,
        });
      }
      continue;
    }

    if (tag === 'table') {
      const trs = findAllByPredicate(node, (el) => el.tag === 'tr');
      const matrix = trs
        .map((tr) =>
          tr.children
            .filter(
              (c): c is HtmlElementNode =>
                c.kind === 'element' && (c.tag === 'th' || c.tag === 'td')
            )
            .map((cell) => ({
              isTh: cell.tag === 'th',
              text: normalizeInlineWhitespace(
                cell.children.map(serializeInline).join('')
              ),
            }))
        )
        .filter((cells) => cells.length > 0 && cells.some((c) => c.text.length > 0));

      if (matrix.length > 0) {
        const colCount = Math.max(1, ...matrix.map((r) => r.length));
        const firstIsHeader = matrix[0].some((c) => c.isTh) || matrix.length > 1;
        const headers = firstIsHeader
          ? Array.from({ length: colCount }, (_, ci) => matrix[0][ci]?.text ?? '')
          : Array.from({ length: colCount }, (_, ci) => `Kolom ${ci + 1}`);
        const dataSlice = firstIsHeader ? matrix.slice(1) : matrix;
        const bodyRows =
          dataSlice.length > 0
            ? dataSlice.map((row) =>
                Array.from({ length: colCount }, (_, ci) => row[ci]?.text ?? '')
              )
            : [Array.from({ length: colCount }, () => '')];
        blocks.push({
          id: uid(),
          t: 'table',
          headers,
          rows: bodyRows,
          w: defaultWidth,
        });
      }
      continue;
    }

    if (tag === 'details') {
      const summaryEl = findFirstByTag(node, 'summary');
      const title = summaryEl
        ? normalizeInlineWhitespace(getPlainText(summaryEl))
        : 'Poin';
      const detailNodes = node.children.filter((c) => c !== summaryEl);
      const detail = normalizeInlineWhitespace(
        detailNodes.map(serializeInline).join('')
      );
      blocks.push({
        id: uid(),
        t: 'dd',
        text: title || 'Poin',
        detail,
        w: defaultWidth,
      });
      continue;
    }

    if (isConclusionLike(node)) {
      const text = normalizeInlineWhitespace(node.children.map(serializeInline).join(''));
      if (text) {
        blocks.push({
          id: uid(),
          t: 'concl',
          label: '★ Kesimpulan',
          text,
          w: defaultWidth,
        });
      }
      continue;
    }

    // Dropdown card format (.card with .ch + .cb)
    if (hasClass(node, 'card')) {
      const ch = findFirstByTag(node, 'button') ||
        node.children.find(
          (c): c is HtmlElementNode => c.kind === 'element' && hasClass(c, 'ch')
        );
      const cb = node.children.find(
        (c): c is HtmlElementNode => c.kind === 'element' && hasClass(c, 'cb')
      );
      if (ch && cb) {
        const badgeEl = ch.children.find(
          (c): c is HtmlElementNode => c.kind === 'element' && hasClass(c, 'n')
        );
        const titleNodes = ch.children.filter((c) => c !== badgeEl);
        const title = normalizeInlineWhitespace(titleNodes.map(getPlainText).join(''));
        const detail = normalizeInlineWhitespace(cb.children.map(serializeInline).join(''));
        const badgeText = badgeEl ? normalizeInlineWhitespace(getPlainText(badgeEl)) : '';
        blocks.push({
          id: uid(),
          t: 'dd',
          ...(badgeText && !/^\d+$/.test(badgeText) ? { badge: badgeText } : {}),
          text: title || 'Poin',
          detail,
          w: defaultWidth,
        });
        continue;
      }
    }

    if (isCardLike(node)) {
      // Extract card title from first heading or .bt/.card-title
      const titleEl = node.children.find(
        (c): c is HtmlElementNode =>
          c.kind === 'element' &&
          (/^h[1-6]$/.test(c.tag) || hasAnyClass(c, [/^bt$/, /^card-title$/, /^title$/]))
      );
      const title = titleEl
        ? normalizeInlineWhitespace(titleEl.children.map(serializeInline).join(''))
        : '';
      const restNodes = node.children.filter((c) => c !== titleEl);
      const children = extractBlocksFromContainer(restNodes, 12);
      if (title || children.length > 0) {
        const box: BoxBlock = {
          id: uid(),
          t: 'box',
          title,
          children,
          w: defaultWidth,
        };
        blocks.push(box);
      }
      continue;
    }

    // Multi-column grid / flex container: split width across element children
    if (isMultiColumnContainer(node)) {
      const elemChildren = node.children.filter(
        (c): c is HtmlElementNode => c.kind === 'element'
      );
      if (elemChildren.length >= 2) {
        const colW =
          elemChildren.length === 2
            ? 6
            : elemChildren.length === 3
              ? 4
              : elemChildren.length === 4
                ? 3
                : 6;
        for (const childEl of elemChildren) {
          blocks.push(...extractBlocksFromContainer([childEl], colW));
        }
        continue;
      }
    }

    // Generic container (div, main, span, figure, etc.)
    blocks.push(...extractBlocksFromContainer(node.children, defaultWidth));
  }

  return blocks;
}

function inferSlideName(slideEl: HtmlElementNode, blocks: Block[], index: number): string {
  const attrName =
    slideEl.attrs['data-title'] ||
    slideEl.attrs['data-name'] ||
    slideEl.attrs['aria-label'];
  if (attrName && attrName.trim()) {
    return stripMarkup(attrName).trim().slice(0, 60);
  }
  const firstHeading = blocks.find(
    (b) => b.t === 'text' && b.b && b.text.trim().length > 0
  );
  if (firstHeading && firstHeading.t === 'text') {
    return stripMarkup(firstHeading.text).split('\n')[0].slice(0, 60);
  }
  return `Slide ${index + 1}`;
}

function splitNodesIntoSlides(nodes: HtmlNode[]): HtmlNode[][] {
  const chunks: HtmlNode[][] = [];
  let current: HtmlNode[] = [];

  for (const node of nodes) {
    if (
      node.kind === 'element' &&
      (node.tag === 'header' || node.tag === 'nav' || node.tag === 'footer')
    ) {
      continue;
    }
    if (
      node.kind === 'element' &&
      (node.tag === 'h1' || node.tag === 'h2' || node.tag === 'hr')
    ) {
      if (current.length > 0) {
        chunks.push(current);
        current = [];
      }
      if (node.tag !== 'hr') {
        current.push(node);
      }
      continue;
    }
    current.push(node);
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

function countAllBlocks(slides: Slide[]): number {
  let count = 0;
  for (const s of slides) {
    for (const b of s.blocks) {
      count++;
      if (b.t === 'box') count += b.children.length;
    }
  }
  return count;
}

export function importDeckFromHtml(rawHtml: string): HtmlImportResult | null {
  if (!rawHtml || typeof rawHtml !== 'string') return null;

  // 1. Fast-path: HTML exported by this app embeds <script id="deck-data">
  const deckDataMatch = rawHtml.match(
    /<script\b[^>]*\bid=["']?deck-data["']?[^>]*>([\s\S]*?)<\/script>/i
  );
  if (deckDataMatch?.[1]) {
    try {
      const parsed = JSON.parse(deckDataMatch[1].trim());
      const normalized = loadAndNormalizeDeck(parsed);
      if (normalized) {
        return {
          deck: normalized,
          source: 'opres',
          slideCount: normalized.slides.length,
          blockCount: countAllBlocks(normalized.slides),
        };
      }
    } catch {
      // Fall through to generic HTML parsing
    }
  }

  // 2. Parse arbitrary HTML presentation into editable slides & blocks
  const tree = parseHtmlTree(rawHtml);
  const htmlEl = findFirstByTag(tree, 'html');
  const titleEl = findFirstByTag(tree, 'title');
  const bodyEl = findFirstByTag(tree, 'body') || tree;
  const mainEl = findFirstByTag(bodyEl, 'main') || bodyEl;

  const docTitle = titleEl
    ? normalizeInlineWhitespace(getPlainText(titleEl))
    : '';

  const themeAttr = htmlEl?.attrs['data-theme'];
  const theme: ThemeId =
    themeAttr === 'brutal' ||
    themeAttr === 'auditor' ||
    themeAttr === 'default' ||
    themeAttr === 'cyberpunk' ||
    themeAttr === 'hacker' ||
    themeAttr === 'astronomi'
      ? themeAttr
      : 'default';

  let slideNodes = findAllByPredicate(mainEl, isSlideElement, true);

  if (slideNodes.length === 0) {
    // Check Reveal.js / generic <section> slides (leaf sections without nested sections)
    const allSections = findAllByPredicate(
      mainEl,
      (el) => el.tag === 'section',
      false
    ).filter(
      (sec) =>
        !sec.children.some(
          (c) => c.kind === 'element' && c.tag === 'section'
        )
    );
    if (allSections.length > 0) {
      slideNodes = allSections;
    }
  }

  if (slideNodes.length === 0) {
    const articles = findAllByPredicate(mainEl, (el) => el.tag === 'article', true);
    if (articles.length >= 2) {
      slideNodes = articles;
    }
  }

  const slides: Slide[] = [];

  if (slideNodes.length > 0) {
    slideNodes.forEach((slideEl, idx) => {
      const blocks = extractBlocksFromContainer(slideEl.children);
      if (blocks.length === 0) return;
      const name = inferSlideName(slideEl, blocks, idx);
      slides.push(
        syncSlideModals({
          id: uid(),
          name,
          bg: '',
          vc: blocks.length <= 2 && blocks.every((b) => b.t === 'text'),
          blocks,
          modals: [],
        })
      );
    });
  } else {
    // Heading / HR split fallback
    const chunks = splitNodesIntoSlides(mainEl.children);
    chunks.forEach((chunkNodes, idx) => {
      const blocks = extractBlocksFromContainer(chunkNodes);
      if (blocks.length === 0) return;
      const firstHeading = blocks.find(
        (b) => b.t === 'text' && b.b && b.text.trim().length > 0
      );
      const name =
        firstHeading && firstHeading.t === 'text'
          ? stripMarkup(firstHeading.text).split('\n')[0].slice(0, 60)
          : `Slide ${idx + 1}`;
      slides.push(
        syncSlideModals({
          id: uid(),
          name,
          bg: '',
          vc: blocks.length <= 2 && blocks.every((b) => b.t === 'text'),
          blocks,
          modals: [],
        })
      );
    });
  }

  if (slides.length === 0) {
    return null;
  }

  const firstH1 = findFirstByTag(mainEl, 'h1');
  const fallbackTitle = firstH1
    ? normalizeInlineWhitespace(getPlainText(firstH1)).slice(0, 80)
    : slides[0].name || 'Presentasi Impor';

  const deck: Deck = {
    v: 2,
    title: docTitle || fallbackTitle || 'Presentasi Impor',
    theme,
    slides,
  };

  return {
    deck,
    source: 'html',
    slideCount: deck.slides.length,
    blockCount: countAllBlocks(deck.slides),
  };
}

import type {
  Block,
  BoxBlock,
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

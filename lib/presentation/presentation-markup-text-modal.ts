import type { Slide, SlideModal } from '../deck-types';
import { normalizeBlocks, uid, walkBlocks } from './presentation-utils';

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

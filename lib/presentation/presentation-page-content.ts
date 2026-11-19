import type {
  BoxBlock,
  ConclusionBlock,
  Deck,
  DropdownBlock,
  Slide,
  TableBlock,
  TextBlock,
  TitleBlock,
} from '../deck-types';
import { stripMarkup } from './presentation-clear-markup-text';
import { flattenBlocks } from './presentation-utils';

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

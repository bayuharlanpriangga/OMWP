import type {
  Block,
  Deck,
  LegacyDeck,
  Slide,
  SlideModal,
  ThemeId,
} from '../deck-types';
import { THEME_META } from '../theme/theme-data';
import { stripMarkup } from './presentation-clear-markup-text';
import { syncSlideModals } from './presentation-markup-text-modal';
import { createTextBlock, normalizeBlocks, uid } from './presentation-utils';

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

import { loadAndNormalizeDeck } from '../../presentation/presentation-migration';
import type { Deck, Slide } from '../../deck-types';

export interface JsonImportResult {
  deck: Deck;
  slideCount: number;
  blockCount: number;
}

function countAllBlocks(slides: Slide[]): number {
  let count = 0;
  for (const slide of slides) {
    for (const b of slide.blocks) {
      count++;
      if (b.t === 'box') count += b.children.length;
    }
  }
  return count;
}

/**
 * Parses and normalizes a raw JSON string into an editable Deck.
 * Returns null if the input is malformed or does not represent a valid presentation.
 */
export function importDeckFromJson(rawJson: string): JsonImportResult | null {
  if (!rawJson || typeof rawJson !== 'string') return null;

  const trimmed = rawJson.replace(/^\uFEFF/, '').trim();
  if (!trimmed) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    const normalized = loadAndNormalizeDeck(parsed);
    if (!normalized) return null;

    return {
      deck: normalized,
      slideCount: normalized.slides.length,
      blockCount: countAllBlocks(normalized.slides),
    };
  } catch {
    return null;
  }
}

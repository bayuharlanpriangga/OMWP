import { getDeckDisplayTitle } from '../presentation/presentation-page-content';
import type { Deck } from '../deck-types';
import { slugifyTitle } from './export-html';

export interface JsonExportPayload {
  filename: string;
  content: string;
  mimeType: string;
}

/**
 * Serializes a presentation deck into formatted JSON text.
 */
export function buildDeckJson(deck: Deck): string {
  return JSON.stringify(deck, null, 2);
}

/**
 * Builds the downloadable JSON export payload (filename, serialized content, and MIME type).
 */
export function buildDeckJsonExport(deck: Deck): JsonExportPayload {
  return {
    filename: `${slugifyTitle(getDeckDisplayTitle(deck))}.json`,
    content: buildDeckJson(deck),
    mimeType: 'application/json',
  };
}

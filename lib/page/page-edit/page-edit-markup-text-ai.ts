import type { InlineToken } from '../../deck-types';

export type AiTermToken = Extract<InlineToken, { type: 'ai-term' }>;

/**
 * Pure parser for AI-specific markup (`[[term]]`).
 * Ignores modal triggers (`[[[...]]]`) and general text formatting handled in `page-edit-markup-text.ts`.
 */
export function parseAiTermToken(
  text: string,
  idx: number
): { token: AiTermToken; nextIdx: number } | null {
  if (!text.startsWith('[[', idx) || text.startsWith('[[[', idx)) {
    return null;
  }
  const end = text.indexOf(']]', idx + 2);
  if (end === -1 || end <= idx + 2) {
    return null;
  }
  return {
    token: {
      type: 'ai-term',
      term: text.slice(idx + 2, end),
    },
    nextIdx: end + 2,
  };
}

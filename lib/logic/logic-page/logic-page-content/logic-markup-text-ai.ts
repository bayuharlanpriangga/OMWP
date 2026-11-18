import type { InlineToken } from '../../../deck-types';

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

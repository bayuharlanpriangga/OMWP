import type { InlineToken } from '../../deck-types';
import { parseAiTermToken } from './page-edit-markup-text-ai';

/**
 * Pure parser converting text-formatting markup
 * (`**bold**`, `*italic*`, `__underline__`, `{s|m|l|xl}...{/s}`, `{i}...{/i}`, `{u}...{/u}`, `[[[modal]]]`, `\n`)
 * into a safe token tree without HTML injection.
 * AI term markers (`[[term]]`) are delegated to `page-edit-markup-text-ai.ts`.
 */
export function parseInlineMarkup(input: string): InlineToken[] {
  return parseSegment(String(input || '').replace(/\r\n/g, '\n'));
}

function findItalicClose(text: string, startAfterStar: number): number {
  let pos = startAfterStar;
  while (pos < text.length) {
    const idx = text.indexOf('*', pos);
    if (idx === -1) return -1;
    // Do not match inside ** or *** as a single closing * unless it's a single * or part of ***
    if (text[idx + 1] === '*' && text[idx + 2] !== '*') {
      pos = idx + 2;
      continue;
    }
    if (idx > startAfterStar && text[idx - 1] !== '\n') {
      return idx;
    }
    pos = idx + 1;
  }
  return -1;
}

function parseSegment(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let idx = 0;

  const pushText = (chunk: string) => {
    if (!chunk) return;
    const parts = chunk.split('\n');
    parts.forEach((p, i) => {
      if (p) {
        const last = tokens[tokens.length - 1];
        if (last && last.type === 'text') {
          last.value += p;
        } else {
          tokens.push({ type: 'text', value: p });
        }
      }
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

    // 2. Delegate [[term]] AI markup to page-edit-markup-text-ai
    const aiMatch = parseAiTermToken(text, idx);
    if (aiMatch) {
      tokens.push(aiMatch.token);
      idx = aiMatch.nextIdx;
      continue;
    }

    // 3. Check ***bold+italic***
    if (text.startsWith('***', idx)) {
      const end = text.indexOf('***', idx + 3);
      if (end !== -1 && end > idx + 3) {
        tokens.push({
          type: 'bold',
          children: [
            {
              type: 'italic',
              children: parseSegment(text.slice(idx + 3, end)),
            },
          ],
        });
        idx = end + 3;
        continue;
      }
    }

    // 4. Check **bold**
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

    // 5. Check __underline__
    if (text.startsWith('__', idx)) {
      const end = text.indexOf('__', idx + 2);
      if (end !== -1 && end > idx + 2) {
        tokens.push({
          type: 'underline',
          children: parseSegment(text.slice(idx + 2, end)),
        });
        idx = end + 2;
        continue;
      }
    }

    // 6. Check *italic* (ignore bullet lists like "* item" or math "2 * 3")
    if (
      text[idx] === '*' &&
      text[idx + 1] !== undefined &&
      text[idx + 1] !== '*' &&
      !/\s/.test(text[idx + 1])
    ) {
      const end = findItalicClose(text, idx + 1);
      if (
        end !== -1 &&
        end > idx + 1 &&
        !text.slice(idx + 1, end).includes('\n')
      ) {
        tokens.push({
          type: 'italic',
          children: parseSegment(text.slice(idx + 1, end)),
        });
        idx = end + 1;
        continue;
      }
    }

    // 7. Check {i}...{/i} and {u}...{/u}
    const styleMatch = text.slice(idx).match(/^\{(i|u)\}/);
    if (styleMatch) {
      const tag = styleMatch[1] as 'i' | 'u';
      const closeTag = `{/${tag}}`;
      const closeIdx = text.indexOf(closeTag, idx + styleMatch[0].length);
      if (closeIdx !== -1) {
        tokens.push({
          type: tag === 'i' ? 'italic' : 'underline',
          children: parseSegment(text.slice(idx + styleMatch[0].length, closeIdx)),
        });
        idx = closeIdx + closeTag.length;
        continue;
      }
    }

    // 8. Check {s|m|l|xl}...{/s}
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
    for (const marker of [
      '[[',
      '***',
      '**',
      '__',
      '*',
      '{i}',
      '{u}',
      '{s}',
      '{m}',
      '{l}',
      '{xl}',
    ]) {
      const pos = text.indexOf(marker, idx + 1);
      if (pos !== -1 && pos < next) next = pos;
    }
    pushText(text.slice(idx, next));
    idx = next;
  }

  return tokens;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInlineMarkup } from '../page-edit-markup-text';

test('parseInlineMarkup tokenizes AI terms, modal triggers, bold, italic, underline, size tags, and line breaks', () => {
  const tokens = parseInlineMarkup(
    'Biaya **tetap**, *miring*, __garis bawah__, dan ***gabungan*** pada [[relevant range]] dan {l}detail{/l}\n[[[Grafik Biaya]]]'
  );
  assert.deepEqual(tokens, [
    { type: 'text', value: 'Biaya ' },
    { type: 'bold', children: [{ type: 'text', value: 'tetap' }] },
    { type: 'text', value: ', ' },
    { type: 'italic', children: [{ type: 'text', value: 'miring' }] },
    { type: 'text', value: ', ' },
    { type: 'underline', children: [{ type: 'text', value: 'garis bawah' }] },
    { type: 'text', value: ', dan ' },
    {
      type: 'bold',
      children: [{ type: 'italic', children: [{ type: 'text', value: 'gabungan' }] }],
    },
    { type: 'text', value: ' pada ' },
    { type: 'ai-term', term: 'relevant range' },
    { type: 'text', value: ' dan ' },
    { type: 'size', size: 'l', children: [{ type: 'text', value: 'detail' }] },
    { type: 'br' },
    { type: 'modal-trigger', title: 'Grafik Biaya' },
  ]);

  const bulletAndMath = parseInlineMarkup('* item satu\n2 * 3 * 4\n{i}tag{/i} {u}bawah{/u}');
  assert.deepEqual(bulletAndMath, [
    { type: 'text', value: '* item satu' },
    { type: 'br' },
    { type: 'text', value: '2 * 3 * 4' },
    { type: 'br' },
    { type: 'italic', children: [{ type: 'text', value: 'tag' }] },
    { type: 'text', value: ' ' },
    { type: 'underline', children: [{ type: 'text', value: 'bawah' }] },
  ]);
});

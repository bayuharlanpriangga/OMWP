import assert from 'node:assert/strict';
import test from 'node:test';
import { stripMarkup } from '../presentation-clear-markup-text';

test('stripMarkup removes brackets, bold, italic, underline markers, and size tags cleanly', () => {
  assert.equal(
    stripMarkup(
      '**Biaya** *miring* __garis bawah__ ***kombinasi*** [[overhead]] dan [[[Rumus]]] {xl}besar{/xl} {i}tagI{/i} {u}tagU{/u}'
    ),
    'Biaya miring garis bawah kombinasi overhead dan Rumus besar tagI tagU'
  );
  assert.equal(stripMarkup('* poin satu\n2 * 3 * 4'), '* poin satu\n2 * 3 * 4');
  assert.equal(stripMarkup(null), '');
  assert.equal(stripMarkup(undefined), '');
});

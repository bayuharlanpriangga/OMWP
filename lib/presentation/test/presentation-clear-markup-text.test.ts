import assert from 'node:assert/strict';
import test from 'node:test';
import { stripMarkup } from '../presentation-clear-markup-text';

test('stripMarkup removes brackets, bold markers, and size tags cleanly', () => {
  assert.equal(
    stripMarkup('**Biaya** [[overhead]] dan [[[Rumus]]] {xl}besar{/xl}'),
    'Biaya overhead dan Rumus besar'
  );
  assert.equal(stripMarkup(null), '');
  assert.equal(stripMarkup(undefined), '');
});

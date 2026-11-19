import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDefaultDeck,
  getDeckDisplayTitle,
  getSlideHeaderTitle,
  getSlideTitle,
} from '../presentation-page-content';

test('createDefaultDeck initializes an empty blank presentation without dummy data', () => {
  const deck = createDefaultDeck();
  assert.equal(deck.v, 2);
  assert.equal(deck.title, '');
  assert.equal(deck.theme, 'default');
  assert.equal(deck.slides.length, 1);
  assert.equal(deck.slides[0].name, '');
  assert.equal(deck.slides[0].blocks.length, 0);
});

test('each slide maintains an independent headerTitle while legacy decks fall back to deck.title', () => {
  const deck = createDefaultDeck();
  deck.slides[0].headerTitle = 'Konteks Slide 1 — Pendahuluan';
  deck.slides.push({
    id: 'slide-2',
    name: '',
    headerTitle: 'Konteks Slide 2 — Analisis Data',
    blocks: [],
  });
  deck.slides.push({
    id: 'slide-3',
    name: 'Legacy Slide',
    blocks: [],
  });
  deck.title = 'Judul Bawaan';

  assert.equal(getSlideHeaderTitle(deck, deck.slides[0]), 'Konteks Slide 1 — Pendahuluan');
  assert.equal(getSlideHeaderTitle(deck, deck.slides[1]), 'Konteks Slide 2 — Analisis Data');
  assert.equal(getSlideHeaderTitle(deck, deck.slides[2]), 'Judul Bawaan');

  deck.title = '';
  assert.equal(getDeckDisplayTitle(deck), 'Konteks Slide 1 — Pendahuluan');
});

test('getSlideTitle prefers explicit non-generic name and otherwise extracts clean text from first content block', () => {
  assert.equal(
    getSlideTitle({
      id: 's1',
      name: 'Ringkasan Eksekutif',
      blocks: [{ id: 'b1', t: 'text', text: 'Isi paragraf', w: 12 }],
    }),
    'Ringkasan Eksekutif'
  );

  assert.equal(
    getSlideTitle({
      id: 's2',
      name: 'Slide 2',
      blocks: [
        {
          id: 'b2',
          t: 'text',
          text: '**Arsitektur** [[Cloud]]\nBaris kedua',
          w: 12,
        },
      ],
    }),
    'Arsitektur Cloud'
  );

  assert.equal(
    getSlideTitle({
      id: 's3',
      name: '',
      blocks: [
        {
          id: 'tbl1',
          t: 'table',
          headers: ['[[Nama]]', '**Peran**'],
          rows: [['A', 'B']],
          w: 12,
        },
      ],
    }),
    'Nama · Peran'
  );
});

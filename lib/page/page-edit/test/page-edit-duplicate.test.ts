import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateLegacyDeck } from '../../../presentation/presentation-migration';
import { duplicateSlide } from '../page-edit-duplicate';

test('duplicateSlide assigns fresh IDs to slide, blocks, and nested children', () => {
  const deck = migrateLegacyDeck(
    {
      title: 'Presentasi Uji',
      slides: [
        {
          title: 'Slide Konten',
          points: [{ text: 'Poin Utama', detail: 'Penjelasan utama' }],
        },
      ],
    },
    true
  );
  const dup = duplicateSlide(deck.slides[1]);
  assert.notEqual(dup.id, deck.slides[1].id);
  assert.notEqual(dup.blocks[0].id, deck.slides[1].blocks[0].id);
});

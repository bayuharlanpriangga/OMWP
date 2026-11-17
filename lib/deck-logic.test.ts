import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addBlockToSlide,
  buildSlideAiContext,
  buildStandaloneHtml,
  computeReflowPositions,
  createBlock,
  createDefaultDeck,
  deleteBlockInSlide,
  duplicateSlide,
  loadAndNormalizeDeck,
  migrateLegacyDeck,
  moveBlockInParent,
  parseInlineMarkup,
  scanModalTitles,
  stripMarkup,
  syncSlideModals,
  updateBlockInSlide,
} from './deck-logic';

test('createDefaultDeck initializes an empty blank presentation without dummy data', () => {
  const deck = createDefaultDeck();
  assert.equal(deck.v, 2);
  assert.equal(deck.title, '');
  assert.equal(deck.theme, 'brutal');
  assert.equal(deck.slides.length, 1);
  assert.equal(deck.slides[0].name, '');
  assert.equal(deck.slides[0].blocks.length, 0);
});

test('migrateLegacyDeck converts legacy structure into normalized v2 slides', () => {
  const migrated = migrateLegacyDeck(
    {
      title: 'Materi Uji',
      conclusion: 'Ringkasan akhir.',
      slides: [
        {
          title: 'Bagian 1',
          points: [{ text: 'Poin A', detail: 'Detail A' }],
          conclusion: 'Kesimpulan 1',
        },
      ],
    },
    true
  );
  assert.equal(migrated.v, 2);
  assert.equal(migrated.title, 'Materi Uji');
  assert.equal(migrated.slides.length, 3);
  assert.equal(migrated.slides[0].name, 'Cover');
  assert.equal(migrated.slides[1].name, 'Bagian 1');
  assert.equal(migrated.slides[2].name, 'Kesimpulan');
});

test('parseInlineMarkup tokenizes AI terms, modal triggers, bold, size tags, and line breaks', () => {
  const tokens = parseInlineMarkup(
    'Biaya **tetap** pada [[relevant range]] dan {l}detail{/l}\n[[[Grafik Biaya]]]'
  );
  assert.deepEqual(tokens, [
    { type: 'text', value: 'Biaya ' },
    { type: 'bold', children: [{ type: 'text', value: 'tetap' }] },
    { type: 'text', value: ' pada ' },
    { type: 'ai-term', term: 'relevant range' },
    { type: 'text', value: ' dan ' },
    { type: 'size', size: 'l', children: [{ type: 'text', value: 'detail' }] },
    { type: 'br' },
    { type: 'modal-trigger', title: 'Grafik Biaya' },
  ]);
});

test('stripMarkup removes brackets, bold markers, and size tags cleanly', () => {
  assert.equal(
    stripMarkup('**Biaya** [[overhead]] dan [[[Rumus]]] {xl}besar{/xl}'),
    'Biaya overhead dan Rumus besar'
  );
});

test('syncSlideModals detects [[[ ]]] markers and preserves children across renames and archival', () => {
  const textBlock = createBlock('text');
  if (textBlock.t !== 'text') throw new Error('Expected text block');
  textBlock.text = 'Lihat [[[Rincian Overhead]]] untuk detail.';

  let slide = syncSlideModals({
    id: 's1',
    name: 'Test',
    blocks: [textBlock],
    modals: [],
  });

  assert.equal(slide.modals?.length, 1);
  assert.equal(slide.modals?.[0].title, 'Rincian Overhead');

  const childText = createBlock('text');
  if (childText.t !== 'text') throw new Error('Expected text block');
  childText.text = 'Listrik + penyusutan';

  slide = {
    ...slide,
    modals: [{ ...slide.modals![0], children: [childText] }],
  };

  // Rename the modal trigger in-place: positional modal retains children
  slide = updateBlockInSlide(slide, textBlock.id, (b) =>
    b.t === 'text' ? { ...b, text: 'Lihat [[[Komponen BOP]]] untuk detail.' } : b
  );
  assert.equal(slide.modals?.length, 1);
  assert.equal(slide.modals?.[0].title, 'Komponen BOP');
  assert.equal(slide.modals?.[0].children.length, 1);

  // Remove trigger temporarily -> archived in mold; re-add -> restored
  slide = updateBlockInSlide(slide, textBlock.id, (b) =>
    b.t === 'text' ? { ...b, text: 'Tanpa modal sementara.' } : b
  );
  assert.equal(slide.modals?.length, 0);
  assert.ok(slide.mold?.['Komponen BOP']);

  slide = updateBlockInSlide(slide, textBlock.id, (b) =>
    b.t === 'text' ? { ...b, text: 'Kembali ke [[[Komponen BOP]]].' } : b
  );
  assert.equal(slide.modals?.length, 1);
  assert.equal(slide.modals?.[0].children.length, 1);
});

test('block tree CRUD operations add, update, move, and delete cleanly', () => {
  const b1 = createBlock('text');
  const b2 = createBlock('dd');
  let slide = { id: 's1', name: 'Slide 1', blocks: [b1] };

  slide = addBlockToSlide(slide, b2);
  assert.equal(slide.blocks.length, 2);

  slide = moveBlockInParent(slide, b2.id, -1);
  assert.equal(slide.blocks[0].id, b2.id);

  slide = deleteBlockInSlide(slide, b1.id);
  assert.equal(slide.blocks.length, 1);
  assert.equal(slide.blocks[0].id, b2.id);
});

test('computeReflowPositions pushes down horizontally overlapping blocks below an expanded block', () => {
  const offsets = computeReflowPositions([
    { id: 'leftTop', x: 0, y: 100, w: 6, collapsedHeight: 60, extraExpandedHeight: 90 },
    { id: 'leftBottom', x: 0, y: 180, w: 6, collapsedHeight: 60, extraExpandedHeight: 0 },
    { id: 'rightColumn', x: 50, y: 180, w: 6, collapsedHeight: 60, extraExpandedHeight: 0 },
  ]);

  assert.equal(offsets.leftTop, 100);
  assert.equal(offsets.leftBottom, 270);
  assert.equal(offsets.rightColumn, 180);
});

test('duplicateSlide assigns fresh IDs and buildStandaloneHtml embeds deck JSON safely', () => {
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

  const ctx = buildSlideAiContext(deck, deck.slides[1]);
  assert.equal(ctx.slideTitle, 'Slide Konten');
  assert.ok(ctx.pointsText.includes('Poin Utama'));

  const html = buildStandaloneHtml(deck);
  assert.ok(html.includes('data-locked="1"'));
  assert.ok(html.includes('Presentasi Uji'));
  assert.ok(html.includes('<script id="byok-data" type="application/json">[]</script>'));

  const htmlWithKeys = buildStandaloneHtml(deck, [
    { provider: 'gemini', key: 'AIzaTestKey123' },
  ]);
  assert.ok(htmlWithKeys.includes('AIzaTestKey123'));

  const scanned = scanModalTitles(deck.slides[1]);
  assert.deepEqual(scanned, []);

  const invalid = loadAndNormalizeDeck({ slides: [] });
  assert.equal(invalid, null);
});

test('custom dropdown badge is preserved on normalize and embedded in standalone HTML', () => {
  const deck = createDefaultDeck();
  const ddBlock = createBlock('dd');
  if (ddBlock.t !== 'dd') throw new Error('Expected dd block');
  ddBlock.badge = '★A';
  ddBlock.text = 'Judul';
  deck.slides[0].blocks.push(ddBlock);

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);
  const normDd = normalized.slides[0].blocks.find((b) => b.t === 'dd');
  assert.equal(normDd?.t === 'dd' ? normDd.badge : undefined, '★A');

  const html = buildStandaloneHtml(normalized);
  assert.ok(html.includes('★A'));
  assert.ok(
    html.includes('b.badge&&String(b.badge).trim()?b.badge:String(n)') ||
      html.includes('(b.badge&&String(b.badge).trim())?b.badge:String(n)')
  );
});


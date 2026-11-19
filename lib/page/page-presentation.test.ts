import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addBlockToSlide,
  buildSlideAiContext,
  deleteBlockInSlide,
  moveBlockInParent,
} from './page-presentation';
import { createBlock } from './page-edit/page-edit';
import { migrateLegacyDeck } from '../presentation/presentation-migration';
import { createDefaultDeck } from '../presentation/presentation-page-content';

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

test('buildSlideAiContext captures migrated slide summary', () => {
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

  const ctx = buildSlideAiContext(deck, deck.slides[1]);
  assert.equal(ctx.slideTitle, 'Slide Konten');
  assert.ok(ctx.pointsText.includes('Poin Utama'));
});

test('buildSlideAiContext derives slide title automatically and captures full slide, modal, deck overview, and implicit term context', () => {
  const deck = createDefaultDeck();
  deck.title = 'Transformasi Infrastruktur Cloud';
  deck.slides[0].name = 'Slide 1';
  deck.slides[0].blocks.push({
    id: 't1',
    t: 'text',
    w: 12,
    text: 'Arsitektur Pemulihan Bencana',
    size: 'xl',
    align: 'l',
    b: true,
  });
  deck.slides[0].blocks.push({
    id: 'b1',
    t: 'box',
    w: 6,
    title: 'Target Layanan Kritis',
    children: [
      {
        id: 'dd1',
        t: 'dd',
        w: 12,
        text: 'Strategi [[Failover]] Aktif-Pasif',
        detail: 'Pemulihan node database harus selesai di bawah target [[RTO]] 15 menit tanpa kehilangan transaksi.',
      },
    ],
  });
  deck.slides[0].modals = [
    {
      id: 'm1',
      title: 'Checklist Verifikasi',
      children: [
        {
          id: 'mt1',
          t: 'text',
          w: 12,
          text: 'Simulasi replikasi lintas zona dilakukan tiap kuartal.',
          size: 'm',
          align: 'l',
        },
      ],
    },
  ];
  deck.slides.push({
    id: 's2',
    name: '',
    vc: false,
    blocks: [
      {
        id: 't2',
        t: 'text',
        w: 12,
        text: 'Estimasi Biaya & Jadwal Migrasi Q3',
        size: 'l',
        align: 'l',
        b: true,
      },
    ],
    modals: [],
  });

  const ctx = buildSlideAiContext(deck, deck.slides[0], 'RTO');
  assert.equal(ctx.slideTitle, 'Arsitektur Pemulihan Bencana');
  assert.equal(ctx.slideNumber, 1);
  assert.equal(ctx.totalSlides, 2);
  assert.ok(ctx.slideContentOutline?.includes('Target Layanan Kritis'));
  assert.ok(ctx.slideContentOutline?.includes('Pemulihan node database'));
  assert.ok(ctx.slideContentOutline?.includes('Checklist Verifikasi'));
  assert.ok(ctx.deckOverview?.includes('Estimasi Biaya & Jadwal Migrasi Q3'));
  assert.equal(ctx.clickedTerm, 'RTO');
  assert.ok(ctx.surroundingContext?.includes('Target Layanan Kritis'));
  assert.ok(ctx.surroundingContext?.includes('RTO 15 menit'));
});

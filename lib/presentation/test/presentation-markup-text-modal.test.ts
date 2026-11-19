import assert from 'node:assert/strict';
import test from 'node:test';
import { createBlock } from '../../page/page-edit/page-edit';
import { updateBlockInSlide } from '../../page/page-presentation';
import { scanModalTitles, syncSlideModals } from '../presentation-markup-text-modal';

test('scanModalTitles collects unique modal triggers across text, title, box, dropdown, and table blocks', () => {
  const titles = scanModalTitles({
    id: 's1',
    name: 'Scan',
    blocks: [
      { id: 't1', t: 'text', text: 'Lihat [[[A]]] dan [[[A]]]', w: 12 },
      { id: 'dd1', t: 'dd', text: 'Poin', detail: 'Detail [[[B]]]', w: 12 },
      {
        id: 'box1',
        t: 'box',
        title: 'Box [[[C]]]',
        children: [{ id: 'ttl1', t: 'title', text: 'Sub [[[D]]]', w: 12 }],
        w: 12,
      },
      {
        id: 'tbl1',
        t: 'table',
        headers: ['Kolom [[[E]]]'],
        rows: [['Sel [[[F]]]']],
        w: 12,
      },
    ],
  });

  assert.deepEqual(titles, ['A', 'B', 'C', 'D', 'E', 'F']);
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

import assert from 'node:assert/strict';
import test from 'node:test';
import { createBlock } from '../../page/page-edit/page-edit';
import { loadAndNormalizeDeck, migrateLegacyDeck } from '../presentation-migration';
import { createDefaultDeck } from '../presentation-page-content';

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

test('loadAndNormalizeDeck rejects empty or non-object deck inputs', () => {
  assert.equal(loadAndNormalizeDeck(null), null);
  assert.equal(loadAndNormalizeDeck({ slides: [] }), null);
});

test('loadAndNormalizeDeck preserves custom dropdown badge', () => {
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
});

test('loadAndNormalizeDeck normalizes TableBlock rows/columns and nested TitleBlock inside Container', () => {
  const deck = createDefaultDeck();
  const tbl = createBlock('table');
  if (tbl.t !== 'table') throw new Error('Expected table');
  tbl.headers = ['Nama', 'Keterangan', 'Catatan'];
  tbl.rows = [
    ['[[Overhead]]', 'Biaya produksi tidak langsung.', '[[[Detail Rumus]]]'],
    ['Tenaga Kerja'],
  ];

  const box = createBlock('box');
  if (box.t !== 'box') throw new Error('Expected box');
  box.title = 'Bagian Pertama';
  const subTitle = createBlock('title');
  if (subTitle.t !== 'title') throw new Error('Expected title');
  subTitle.text = 'Bagian Kedua [[[Detail Tambahan]]]';
  box.children.push(subTitle);

  deck.slides[0].blocks.push(tbl, box);

  const normalized = loadAndNormalizeDeck(JSON.parse(JSON.stringify(deck)));
  assert.ok(normalized);

  const normTbl = normalized.slides[0].blocks[0];
  assert.equal(normTbl.t, 'table');
  if (normTbl.t === 'table') {
    assert.equal(normTbl.headers.length, 3);
    assert.equal(normTbl.rows.length, 2);
    assert.deepEqual(normTbl.rows[1], ['Tenaga Kerja', '', '']);
  }

  const normBox = normalized.slides[0].blocks[1];
  assert.equal(normBox.t, 'box');
  if (normBox.t === 'box') {
    assert.equal(normBox.children.length, 1);
    assert.equal(normBox.children[0].t, 'title');
    if (normBox.children[0].t === 'title') {
      assert.equal(normBox.children[0].text, 'Bagian Kedua [[[Detail Tambahan]]]');
    }
  }

  assert.deepEqual(
    normalized.slides[0].modals?.map((m) => m.title),
    ['Detail Rumus', 'Detail Tambahan']
  );
});

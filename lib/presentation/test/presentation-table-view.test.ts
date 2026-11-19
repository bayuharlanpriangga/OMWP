import assert from 'node:assert/strict';
import test from 'node:test';
import { computeTableColumnWidths } from '../presentation-table-view';

test('computeTableColumnWidths stays symmetric for short balanced columns and adapts when a column has long text', () => {
  // 1. Short symmetrical 2 columns
  const sym2 = computeTableColumnWidths(
    ['Nama', 'Status'],
    [
      ['Andi', 'Aktif'],
      ['Budi Santoso', 'Lulus'],
    ]
  );
  assert.equal(sym2.mode, 'symmetric');
  assert.deepEqual(sym2.widths, [50, 50]);

  // 2. Short symmetrical 3 columns
  const sym3 = computeTableColumnWidths(
    ['Kode', 'Kategori', 'Satuan'],
    [['A-01', 'Material', 'Unit']]
  );
  assert.equal(sym3.mode, 'symmetric');
  assert.equal(sym3.widths.length, 3);
  assert.equal(Number(sym3.widths.reduce((a, b) => a + b, 0).toFixed(2)), 100);

  // 3. Adaptive 2 columns: "Nama" (short) vs "Keterangan" (long description)
  const adap2 = computeTableColumnWidths(
    ['Nama', 'Keterangan'],
    [
      [
        'Biaya Tetap',
        'Biaya operasional rutin yang jumlah totalnya tetap konstan meskipun volume produksi berubah sepanjang periode berjalan.',
      ],
    ]
  );
  assert.equal(adap2.mode, 'adaptive');
  assert.ok(adap2.widths[0] < 28, `Expected short col width < 28%, got ${adap2.widths[0]}`);
  assert.ok(adap2.widths[1] > 72, `Expected long col width > 72%, got ${adap2.widths[1]}`);
  assert.equal(Number(adap2.widths.reduce((a, b) => a + b, 0).toFixed(2)), 100);

  // 4. Strips markup before measuring & handles multi-line cells cleanly
  const markupShort = computeTableColumnWidths(
    ['**Nama**', '[[Istilah]]'],
    [['[[[Modal]]] singkat', '**Teks** pendek']]
  );
  assert.equal(markupShort.mode, 'symmetric');
  assert.deepEqual(markupShort.widths, [50, 50]);

  // 5. Single column always returns 100%
  const single = computeTableColumnWidths(['Ringkasan'], [['Isi panjang']]);
  assert.equal(single.mode, 'symmetric');
  assert.deepEqual(single.widths, [100]);
});

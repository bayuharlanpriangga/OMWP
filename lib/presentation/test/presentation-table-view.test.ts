import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEqualTableColumnWidths,
  removeTableColumnWidth,
  resizeTableColumnWidths,
  resolveTableColumnWidths,
} from '../presentation-table-view';
import { normalizeBlocks } from '../presentation-utils';

test('createEqualTableColumnWidths splits percentages cleanly to sum to 100', () => {
  assert.deepEqual(createEqualTableColumnWidths(1), [100]);
  assert.deepEqual(createEqualTableColumnWidths(2), [50, 50]);
  assert.deepEqual(createEqualTableColumnWidths(3), [34, 33, 33]);
  assert.deepEqual(createEqualTableColumnWidths(4), [25, 25, 25, 25]);
});

test('resolveTableColumnWidths uses manual percentages and normalizes proportional totals', () => {
  // Without colWidths -> equal split regardless of text length
  const defaultLayout = resolveTableColumnWidths(2);
  assert.equal(defaultLayout.isCustom, false);
  assert.deepEqual(defaultLayout.widths, [50, 50]);
  assert.equal(defaultLayout.rawTotal, 100);

  // Exact custom percentages summing to 100
  const exact = resolveTableColumnWidths(3, [20, 50, 30]);
  assert.equal(exact.isCustom, true);
  assert.deepEqual(exact.widths, [20, 50, 30]);
  assert.deepEqual(exact.rawWidths, [20, 50, 30]);
  assert.equal(exact.rawTotal, 100);

  // Non-100 manual percentages keep rawWidths intact and normalize rendered widths proportionally
  const nonHundred = resolveTableColumnWidths(2, [30, 30]);
  assert.equal(nonHundred.isCustom, true);
  assert.deepEqual(nonHundred.rawWidths, [30, 30]);
  assert.equal(nonHundred.rawTotal, 60);
  assert.deepEqual(nonHundred.widths, [50, 50]);

  // Single column always returns 100
  const single = resolveTableColumnWidths(1, [40]);
  assert.deepEqual(single.widths, [100]);
});

test('resizeTableColumnWidths and removeTableColumnWidth maintain valid percentage distributions', () => {
  const grown = resizeTableColumnWidths([20, 80], 2, 3);
  assert.equal(grown.length, 3);
  assert.equal(
    grown.reduce((s, w) => s + w, 0),
    100
  );

  const shrunk = resizeTableColumnWidths([20, 50, 30], 3, 2);
  assert.equal(shrunk.length, 2);
  assert.equal(
    shrunk.reduce((s, w) => s + w, 0),
    100
  );
  assert.ok(shrunk[0] < shrunk[1]);

  const removed = removeTableColumnWidth([20, 50, 30], 3, 1);
  assert.deepEqual(removed, [40, 60]);
});

test('normalizeBlocks preserves valid custom colWidths on TableBlock', () => {
  const normalized = normalizeBlocks([
    {
      id: 't1',
      t: 'table',
      headers: ['Kode', 'Uraian', 'Nilai'],
      rows: [['A', 'Keterangan panjang sekali', '100']],
      colWidths: [15, 65, 20],
      w: 12,
    },
  ]);

  assert.equal(normalized.length, 1);
  const tbl = normalized[0];
  assert.equal(tbl.t, 'table');
  if (tbl.t === 'table') {
    assert.deepEqual(tbl.colWidths, [15, 65, 20]);
  }
});

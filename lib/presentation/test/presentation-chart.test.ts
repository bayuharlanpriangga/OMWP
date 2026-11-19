import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHART_TYPE_LIST,
  computeNiceAxisScale,
  computePieSlices,
  computeSunburstArcs,
  createChartBlock,
  formatChartEditorTitle,
  formatChartNumber,
} from '../presentation-chart';
import { normalizeBlocks } from '../presentation-utils';

test('CHART_TYPE_LIST exposes Kolom, Garis, Pai, Batang, and Sunburst with Chart (<Jenis>) editor titles', () => {
  assert.deepEqual(
    CHART_TYPE_LIST.map((c) => c.id),
    ['column', 'line', 'pie', 'bar', 'sunburst']
  );
  assert.equal(formatChartEditorTitle('column'), 'Chart (Kolom)');
  assert.equal(formatChartEditorTitle('line'), 'Chart (Garis)');
  assert.equal(formatChartEditorTitle('pie'), 'Chart (Pai)');
  assert.equal(formatChartEditorTitle('bar'), 'Chart (Batang)');
  assert.equal(formatChartEditorTitle('sunburst'), 'Chart (Sunburst)');
});

test('createChartBlock creates valid default categories and series for each chart type', () => {
  const col = createChartBlock('column');
  assert.equal(col.t, 'chart');
  assert.equal(col.chartType, 'column');
  assert.equal(col.categories.length, 4);
  assert.equal(col.series.length, 3);
  assert.equal(col.series[0].values.length, 4);

  const pie = createChartBlock('pie');
  assert.equal(pie.chartType, 'pie');
  assert.equal(pie.categories.length, 4);
  assert.equal(pie.series.length, 1);
  assert.equal(pie.series[0].values.length, 4);

  const sun = createChartBlock('sunburst');
  assert.equal(sun.chartType, 'sunburst');
  assert.equal(sun.categories.length, 4);
  assert.equal(sun.series.length, 1);
  assert.deepEqual(sun.series[0].values, [32, 29, 23, 16]);
});

test('computeNiceAxisScale computes clean bounds for positive, zero, and negative ranges', () => {
  const zero = computeNiceAxisScale([0, 0, 0]);
  assert.equal(zero.min, 0);
  assert.ok(zero.max > 0);
  assert.ok(zero.ticks.includes(0));

  const pos = computeNiceAxisScale([1.2, 4.8, 3.1]);
  assert.equal(pos.min, 0);
  assert.ok(pos.max >= 4.8);
  assert.ok(pos.ticks[0] === 0);

  const mixed = computeNiceAxisScale([-12, 5, 28]);
  assert.ok(mixed.min <= -12);
  assert.ok(mixed.max >= 28);
  assert.ok(mixed.ticks.includes(0));
});

test('computePieSlices handles multi-slice, single 100% slice, and all-zero datasets', () => {
  assert.deepEqual(computePieSlices(['A', 'B'], [0, 0], 100, 100, 50), []);

  const single = computePieSlices(['A', 'B'], [25, 0], 100, 100, 50);
  assert.equal(single.length, 1);
  assert.equal(single[0].percentage, 100);
  assert.equal(single[0].isFullCircle, true);

  const multi = computePieSlices(['A', 'B', 'C'], [50, 30, 20], 100, 100, 50);
  assert.equal(multi.length, 3);
  assert.equal(Math.round(multi[0].percentage), 50);
  assert.equal(Math.round(multi[1].percentage), 30);
  assert.equal(Math.round(multi[2].percentage), 20);
  assert.equal(multi.every((s) => !s.isFullCircle && s.path.includes('A ')), true);
});

test('computeSunburstArcs handles all-zero, single-series 1-ring (including 100% full ring), and multi-series 2-ring hierarchy', () => {
  assert.deepEqual(
    computeSunburstArcs(
      ['A', 'B'],
      [{ id: 's1', name: 'Nilai', values: [0, 0] }],
      320,
      150,
      55,
      116
    ),
    []
  );

  const singleFull = computeSunburstArcs(
    ['Tunggal', 'Kosong'],
    [{ id: 's1', name: 'Nilai', values: [100, 0] }],
    320,
    150,
    55,
    116
  );
  assert.equal(singleFull.length, 1);
  assert.equal(singleFull[0].ring, 0);
  assert.equal(singleFull[0].isFullRing, true);
  assert.equal(singleFull[0].percentage, 100);

  const singleFour = computeSunburstArcs(
    ['Kategori 1', 'Kategori 2', 'Kategori 3', 'Kategori 4'],
    [{ id: 's1', name: 'Nilai', values: [32, 29, 23, 16] }],
    320,
    150,
    55,
    116
  );
  assert.equal(singleFour.length, 4);
  assert.ok(singleFour.every((a) => a.ring === 0 && !a.isFullRing));

  const multiTwoRing = computeSunburstArcs(
    ['Utara', 'Selatan'],
    [
      { id: 's1', name: 'Produk A', values: [30, 20] },
      { id: 's2', name: 'Produk B', values: [10, 40] },
    ],
    320,
    150,
    55,
    116
  );
  const inner = multiTwoRing.filter((a) => a.ring === 0);
  const outer = multiTwoRing.filter((a) => a.ring === 1);
  assert.equal(inner.length, 2);
  assert.equal(outer.length, 4);
  assert.equal(inner[0].value, 40);
  assert.equal(inner[1].value, 60);
  assert.equal(outer[0].seriesLabel, 'Produk A');
  assert.equal(outer[1].seriesLabel, 'Produk B');
});

test('normalizeBlocks sanitizes ChartBlock types including sunburst, category counts, and series values', () => {
  const normalized = normalizeBlocks([
    {
      id: 'c1',
      t: 'chart',
      chartType: 'bar',
      title: 'Pendapatan',
      categories: ['Q1', 'Q2', 'Q3'],
      series: [{ id: 's1', name: 'Target', values: [10, Number.NaN] }],
      w: 12,
    },
    {
      id: 'c2',
      t: 'chart',
      chartType: 'sunburst',
      title: 'Hirarki',
      categories: ['A', 'B'],
      series: [{ id: 's1', name: 'Nilai', values: [60, 40] }],
      w: 6,
    },
  ]);

  assert.equal(normalized.length, 2);
  const c1 = normalized[0];
  assert.equal(c1.t, 'chart');
  if (c1.t === 'chart') {
    assert.equal(c1.chartType, 'bar');
    assert.equal(c1.title, 'Pendapatan');
    assert.deepEqual(c1.categories, ['Q1', 'Q2', 'Q3']);
    assert.deepEqual(c1.series[0].values, [10, 0, 0]);
  }
  const c2 = normalized[1];
  assert.equal(c2.t, 'chart');
  if (c2.t === 'chart') {
    assert.equal(c2.chartType, 'sunburst');
    assert.equal(c2.w, 6);
  }
  assert.equal(formatChartNumber(1_500_000), '1.5jt');
});

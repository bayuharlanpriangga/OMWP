import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHART_PALETTE,
  CHART_TYPE_LIST,
  computeNiceAxisScale,
  computePieSlices,
  computeSunburstArcs,
  createChartBlock,
  createDefaultChartData,
  getChartTypeMeta,
  isChartZoomExemptTarget,
  truncateChartLabel,
} from '../page-edit-chart';

test('CHART_PALETTE exposes 8 distinct hex colors for chart series and categories', () => {
  assert.equal(CHART_PALETTE.length, 8);
  assert.ok(CHART_PALETTE.every((hex) => /^#[0-9a-f]{6}$/i.test(hex)));
  assert.equal(new Set(CHART_PALETTE).size, 8);
});

test('CHART_TYPE_LIST and getChartTypeMeta expose Kolom, Garis, Pai, Batang, and Sunburst metadata', () => {
  assert.deepEqual(
    CHART_TYPE_LIST.map((c) => c.id),
    ['column', 'line', 'pie', 'bar', 'sunburst']
  );
  assert.equal(getChartTypeMeta('column').editorTitle, 'Chart (Kolom)');
  assert.equal(getChartTypeMeta('line').editorTitle, 'Chart (Garis)');
  assert.equal(getChartTypeMeta('pie').editorTitle, 'Chart (Pai)');
  assert.equal(getChartTypeMeta('bar').editorTitle, 'Chart (Batang)');
  assert.equal(getChartTypeMeta('sunburst').editorTitle, 'Chart (Sunburst)');
});

test('createDefaultChartData and createChartBlock create valid categories and series for each chart type', () => {
  const pieStarter = createDefaultChartData('pie');
  assert.equal(pieStarter.categories.length, 4);
  assert.equal(pieStarter.series.length, 1);

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

test('truncateChartLabel trims and truncates labels cleanly with ellipsis', () => {
  assert.equal(truncateChartLabel('  Kuartal 1  ', 12), 'Kuartal 1');
  assert.equal(truncateChartLabel('Pendapatan Tahunan', 10), 'Pendapata…');
  assert.equal(truncateChartLabel('ABC', 1), 'A…');
});

test('isChartZoomExemptTarget ignores bars/slices/buttons while allowing chart background clicks', () => {
  const makeTarget = (matchedSelector: string | null) =>
    ({
      closest: (selector: string) =>
        matchedSelector && selector.includes(matchedSelector) ? {} : null,
    }) as unknown as EventTarget;

  assert.equal(isChartZoomExemptTarget(null), false);
  assert.equal(
    isChartZoomExemptTarget(makeTarget('[data-chart-element="true"]')),
    true
  );
  assert.equal(isChartZoomExemptTarget(makeTarget('button')), true);
  assert.equal(isChartZoomExemptTarget(makeTarget(null)), false);
});

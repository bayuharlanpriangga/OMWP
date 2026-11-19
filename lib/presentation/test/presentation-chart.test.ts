import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatChartEditorTitle,
  formatChartNumber,
  getChartTypeLabel,
} from '../presentation-chart';
import { normalizeBlocks } from '../presentation-utils';

test('formatChartEditorTitle and getChartTypeLabel return localized labels for all chart types', () => {
  assert.equal(getChartTypeLabel('column'), 'Kolom');
  assert.equal(formatChartEditorTitle('column'), 'Chart (Kolom)');
  assert.equal(formatChartEditorTitle('line'), 'Chart (Garis)');
  assert.equal(formatChartEditorTitle('pie'), 'Chart (Pai)');
  assert.equal(formatChartEditorTitle('bar'), 'Chart (Batang)');
  assert.equal(formatChartEditorTitle('sunburst'), 'Chart (Sunburst)');
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

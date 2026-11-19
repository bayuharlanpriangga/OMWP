import type { ChartType } from '../deck-types';
import { getChartTypeMeta } from '../page/page-edit/page-edit-chart';

export function getChartTypeLabel(chartType: ChartType): string {
  return getChartTypeMeta(chartType).label;
}

export function formatChartEditorTitle(chartType: ChartType): string {
  return `Chart (${getChartTypeLabel(chartType)})`;
}

export function formatChartNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}jt`;
  }
  if (Math.abs(n) >= 1_000 && Number.isInteger(n)) {
    return n.toLocaleString('id-ID');
  }
  return Number.isInteger(n)
    ? String(n)
    : Number(n.toFixed(2)).toString();
}

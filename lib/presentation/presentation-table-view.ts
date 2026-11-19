import { clamp } from './presentation-utils';

export interface TableColumnLayout {
  widths: number[];
  rawWidths: number[];
  rawTotal: number;
  isCustom: boolean;
}

/**
 * Generates clean integer equal percentage widths summing to 100
 * (e.g. [50, 50], [34, 33, 33], [25, 25, 25, 25]).
 */
export function createEqualTableColumnWidths(colCount: number): number[] {
  const count = Math.max(1, Math.round(colCount) || 1);
  if (count === 1) return [100];
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  return Array.from({ length: count }, (_, idx) =>
    idx < remainder ? base + 1 : base
  );
}

/**
 * Resolves table column widths strictly from user-defined manual percentages
 * (or equal distribution when no manual widths are configured).
 */
export function resolveTableColumnWidths(
  colCountInput: number,
  rawColWidths?: number[]
): TableColumnLayout {
  const colCount = Math.max(1, Math.round(colCountInput) || 1);
  if (colCount === 1) {
    return {
      widths: [100],
      rawWidths: [100],
      rawTotal: 100,
      isCustom: false,
    };
  }

  const equal = createEqualTableColumnWidths(colCount);
  const hasCustomArray = Array.isArray(rawColWidths) && rawColWidths.length > 0;
  if (!hasCustomArray) {
    return {
      widths: equal,
      rawWidths: equal,
      rawTotal: 100,
      isCustom: false,
    };
  }

  const fallback = Number((100 / colCount).toFixed(1));
  const rawWidths = Array.from({ length: colCount }, (_, idx) => {
    const val = Number(rawColWidths[idx]);
    return Number.isFinite(val) && val > 0 ? clamp(Number(val.toFixed(2)), 1, 100) : fallback;
  });

  const rawTotal = Number(
    rawWidths.reduce((sum, w) => sum + w, 0).toFixed(2)
  );
  const safeTotal = rawTotal > 0 ? rawTotal : 100;

  const normalized = rawWidths.map((w) =>
    Number(((w / safeTotal) * 100).toFixed(2))
  );
  const sumNorm = normalized.reduce((sum, w) => sum + w, 0);
  const residual = Number((100 - sumNorm).toFixed(2));
  normalized[colCount - 1] = Number(
    (normalized[colCount - 1] + residual).toFixed(2)
  );

  return {
    widths: normalized,
    rawWidths,
    rawTotal,
    isCustom: true,
  };
}

/**
 * Updates manual column widths when columns are added or removed via count stepper,
 * preserving relative proportions for remaining columns and assigning balanced share to new columns.
 */
export function resizeTableColumnWidths(
  prevWidths: number[] | undefined,
  curCols: number,
  nextColsInput: number
): number[] {
  const nextCols = clamp(Math.round(nextColsInput) || 1, 1, 12);
  if (nextCols === 1) return [100];
  if (!Array.isArray(prevWidths) || prevWidths.length === 0) {
    return createEqualTableColumnWidths(nextCols);
  }

  const current = resolveTableColumnWidths(Math.max(1, curCols), prevWidths).widths;
  if (nextCols === current.length) return current.map((w) => Number(w.toFixed(1)));

  if (nextCols < current.length) {
    const kept = current.slice(0, nextCols);
    const total = kept.reduce((s, w) => s + w, 0) || 1;
    const scaled = kept.map((w) => Math.max(1, Math.round((w / total) * 100)));
    const diff = 100 - scaled.reduce((s, w) => s + w, 0);
    scaled[scaled.length - 1] = Math.max(1, scaled[scaled.length - 1] + diff);
    return scaled;
  }

  // Increasing columns: allocate equal share to new columns, scale existing cleanly
  const addedCount = nextCols - current.length;
  const newColShare = Math.max(5, Math.round(100 / nextCols));
  const newTotal = newColShare * addedCount;
  const remainingForExisting = Math.max(current.length, 100 - newTotal);
  const curSum = current.reduce((s, w) => s + w, 0) || 100;

  const existingScaled = current.map((w) =>
    Math.max(1, Math.round((w / curSum) * remainingForExisting))
  );
  const result = [
    ...existingScaled,
    ...Array.from({ length: addedCount }, () => newColShare),
  ];
  const diff = 100 - result.reduce((s, w) => s + w, 0);
  result[result.length - 1] = Math.max(1, result[result.length - 1] + diff);
  return result;
}

/**
 * Removes a single column width and rescales the remaining columns to sum to 100.
 */
export function removeTableColumnWidth(
  prevWidths: number[] | undefined,
  curCols: number,
  removeIdx: number
): number[] {
  if (curCols <= 1) return [100];
  if (!Array.isArray(prevWidths) || prevWidths.length === 0) {
    return createEqualTableColumnWidths(curCols - 1);
  }
  const current = resolveTableColumnWidths(curCols, prevWidths).widths;
  const remaining = current.filter((_, i) => i !== removeIdx);
  if (remaining.length === 0) return [100];
  const sum = remaining.reduce((s, w) => s + w, 0) || 1;
  const scaled = remaining.map((w) => Math.max(1, Math.round((w / sum) * 100)));
  const diff = 100 - scaled.reduce((s, w) => s + w, 0);
  scaled[scaled.length - 1] = Math.max(1, scaled[scaled.length - 1] + diff);
  return scaled;
}

import { stripMarkup } from './presentation-clear-markup-text';
import { clamp } from './presentation-utils';

export interface TableColumnLayout {
  widths: number[];
  mode: 'symmetric' | 'adaptive';
  colMaxLens: number[];
  threshold: number;
}

/**
 * Computes responsive percentage widths for table columns based on their text length.
 * - If every column fits within its fair equal-division character budget, columns are
 *   distributed symmetrically (equal widths).
 * - If any column exceeds the fair budget (e.g. "Keterangan" with long text vs "Nama"),
 *   short columns shrink neatly to fit their longest text + cell padding while
 *   long-text columns expand proportionally to occupy the remaining width.
 */
export function computeTableColumnWidths(
  headers: string[],
  rows: string[][],
  blockWidth = 12
): TableColumnLayout {
  const colCount = Math.max(1, headers.length);
  if (colCount === 1) {
    const hLen = stripMarkup(headers[0] ?? '').trim().length;
    const maxCell = rows.reduce(
      (m, r) => Math.max(m, stripMarkup(r?.[0] ?? '').trim().length),
      0
    );
    return {
      widths: [100],
      mode: 'symmetric',
      colMaxLens: [Math.max(hLen, maxCell)],
      threshold: 64,
    };
  }

  const maxLineLen = (raw: string | null | undefined): number => {
    const clean = stripMarkup(raw ?? '').trim();
    if (!clean) return 0;
    return clean
      .split(/\n/)
      .reduce((m, line) => Math.max(m, line.trim().length), 0);
  };

  const colMaxLens = Array.from({ length: colCount }, (_, colIdx) => {
    let maxLen = maxLineLen(headers[colIdx]);
    for (const row of rows) {
      maxLen = Math.max(maxLen, maxLineLen(row?.[colIdx]));
    }
    return maxLen;
  });

  const widthFactor = clamp(blockWidth || 12, 3, 12) / 12;
  const totalCapacityChars = Math.max(24, Math.round(64 * widthFactor));
  const threshold = Math.max(10, Math.round(totalCapacityChars / colCount));

  const anyOverflow = colMaxLens.some((len) => len > threshold);
  if (!anyOverflow) {
    const base = Math.floor(10000 / colCount) / 100;
    const widths = Array.from({ length: colCount }, () => base);
    const diff = Number((100 - widths.reduce((a, b) => a + b, 0)).toFixed(2));
    widths[colCount - 1] = Number((widths[colCount - 1] + diff).toFixed(2));
    return {
      widths,
      mode: 'symmetric',
      colMaxLens,
      threshold,
    };
  }

  const refChars = Math.max(36, 84 * widthFactor);
  const equalPct = 100 / colCount;
  const minColPct = clamp(Number((28 / colCount).toFixed(2)), 7, 10.5);

  const widths = new Array<number>(colCount).fill(0);
  const shortCols: number[] = [];
  const longCols: number[] = [];

  colMaxLens.forEach((len, idx) => {
    if (len <= threshold) shortCols.push(idx);
    else longCols.push(idx);
  });

  let usedShortPct = 0;
  for (const idx of shortCols) {
    // Fit longest line text in column + ~4 chars comfort margin for cell padding
    const neededChars = Math.max(colMaxLens[idx], 2) + 4;
    const fitPct = clamp(
      (neededChars / refChars) * 100,
      minColPct,
      equalPct * 0.92
    );
    widths[idx] = fitPct;
    usedShortPct += fitPct;
  }

  const maxAllowedShortTotal = 100 - longCols.length * minColPct;
  if (usedShortPct > maxAllowedShortTotal && usedShortPct > 0) {
    const scale = maxAllowedShortTotal / usedShortPct;
    usedShortPct = 0;
    for (const idx of shortCols) {
      widths[idx] = Math.max(minColPct, widths[idx] * scale);
      usedShortPct += widths[idx];
    }
  }

  const remainingPct = Math.max(longCols.length * minColPct, 100 - usedShortPct);
  const longWeights = longCols.map((idx) => Math.max(1, Math.pow(colMaxLens[idx], 0.85)));
  const totalLongWeight = longWeights.reduce((a, b) => a + b, 0) || 1;

  longCols.forEach((colIdx, pos) => {
    widths[colIdx] = (longWeights[pos] / totalLongWeight) * remainingPct;
  });

  // Normalize precisely to 100.00
  const rounded = widths.map((v) => Number(v.toFixed(2)));
  const sum = rounded.reduce((a, b) => a + b, 0);
  const residual = Number((100 - sum).toFixed(2));
  const adjustIdx = longCols[longCols.length - 1] ?? colCount - 1;
  rounded[adjustIdx] = Number((rounded[adjustIdx] + residual).toFixed(2));

  return {
    widths: rounded,
    mode: 'adaptive',
    colMaxLens,
    threshold,
  };
}

'use client';

import React from 'react';
import { Eye, Minus, Plus, Trash2, X } from 'lucide-react';
import { PAGE_CONTENT_EDITOR_LABELS } from '@/lib/data/data-page-content-editor';
import { clamp } from '@/lib/page/page-edit/page-edit';
import {
  createEqualTableColumnWidths,
  removeTableColumnWidth,
  resizeTableColumnWidths,
  resolveTableColumnWidths,
} from '@/lib/presentation/presentation-table-view';
import type { TableBlock } from '@/lib/deck-types';
import { PageEditPreviewTable } from '../PageEditPreview/PageEditPreviewTable';

export function TableBlockEditor({
  block,
  onUpdate,
}: {
  block: TableBlock;
  onUpdate: (updater: (prev: TableBlock) => TableBlock) => void;
}) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [editingWidth, setEditingWidth] = React.useState<{
    colIdx: number;
    value: string;
  } | null>(null);

  const headers =
    block.headers.length > 0
      ? block.headers
      : [PAGE_CONTENT_EDITOR_LABELS.table.defaultFirstCol];
  const rows = block.rows.length > 0 ? block.rows : [headers.map(() => '')];
  const layout = resolveTableColumnWidths(headers.length, block.colWidths);

  const setColumnCount = (targetCount: number) => {
    const nextCols = clamp(Math.round(targetCount) || 1, 1, 12);
    setEditingWidth(null);
    onUpdate((prev) => {
      const curCols = Math.max(1, prev.headers.length);
      if (nextCols === curCols) return prev;
      const nextHeaders = Array.from({ length: nextCols }, (_, i) =>
        i < curCols
          ? prev.headers[i]
          : `${PAGE_CONTENT_EDITOR_LABELS.table.headerPrefix} ${i + 1}`
      );
      const nextRows = prev.rows.map((r) =>
        Array.from({ length: nextCols }, (_, i) => r[i] ?? '')
      );
      const nextColWidths = resizeTableColumnWidths(
        prev.colWidths,
        curCols,
        nextCols
      );
      return {
        ...prev,
        headers: nextHeaders,
        rows: nextRows,
        colWidths: nextColWidths,
      };
    });
  };

  const setRowCount = (targetCount: number) => {
    const nextCount = clamp(Math.round(targetCount) || 1, 1, 50);
    onUpdate((prev) => {
      const colCount = Math.max(1, prev.headers.length);
      if (nextCount === prev.rows.length) return prev;
      const nextRows = Array.from({ length: nextCount }, (_, rIdx) => {
        const existing = prev.rows[rIdx];
        return existing
          ? Array.from({ length: colCount }, (_, cIdx) => existing[cIdx] ?? '')
          : Array.from({ length: colCount }, () => '');
      });
      return { ...prev, rows: nextRows };
    });
  };

  const removeColumn = (colIdx: number) => {
    setEditingWidth(null);
    onUpdate((prev) => {
      if (prev.headers.length <= 1) return prev;
      const nextColWidths = removeTableColumnWidth(
        prev.colWidths,
        prev.headers.length,
        colIdx
      );
      return {
        ...prev,
        headers: prev.headers.filter((_, i) => i !== colIdx),
        rows: prev.rows.map((r) => r.filter((_, i) => i !== colIdx)),
        colWidths: nextColWidths,
      };
    });
  };

  const removeRow = (rowIdx: number) => {
    onUpdate((prev) => {
      if (prev.rows.length <= 1) return prev;
      return {
        ...prev,
        rows: prev.rows.filter((_, i) => i !== rowIdx),
      };
    });
  };

  const updateColumnWidth = (colIdx: number, pct: number) => {
    const clampedPct = clamp(Number(pct.toFixed(1)), 1, 100);
    onUpdate((prev) => {
      const colCount = Math.max(1, prev.headers.length);
      const base = resolveTableColumnWidths(colCount, prev.colWidths).rawWidths;
      const nextWidths = base.map((w, i) => (i === colIdx ? clampedPct : w));
      return { ...prev, colWidths: nextWidths };
    });
  };

  const equalizeWidths = () => {
    setEditingWidth(null);
    onUpdate((prev) => ({
      ...prev,
      colWidths: createEqualTableColumnWidths(Math.max(1, prev.headers.length)),
    }));
  };

  const roundedTotal = Math.round(layout.rawTotal * 10) / 10;

  return (
    <div className="mt-2 space-y-3">
      {/* Dimension controls & manual percentage summary */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold opacity-80">
              {PAGE_CONTENT_EDITOR_LABELS.table.headerLabel}
            </span>
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={headers.length <= 1}
              onClick={() => setColumnCount(headers.length - 1)}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.decreaseColsAria}
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              type="number"
              min={1}
              max={12}
              className="pinput !w-14 !py-1 !px-1.5 text-center text-sm font-mono tabular-nums"
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.colsCountAria}
              value={headers.length}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed)) setColumnCount(parsed);
              }}
            />
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={headers.length >= 12}
              onClick={() => setColumnCount(headers.length + 1)}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.increaseColsAria}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{PAGE_CONTENT_EDITOR_LABELS.table.addColButton}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold opacity-80">
              {PAGE_CONTENT_EDITOR_LABELS.table.rowLabel}
            </span>
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={rows.length <= 1}
              onClick={() => setRowCount(rows.length - 1)}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.decreaseRowsAria}
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              type="number"
              min={1}
              max={50}
              className="pinput !w-14 !py-1 !px-1.5 text-center text-sm font-mono tabular-nums"
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.rowsCountAria}
              value={rows.length}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed)) setRowCount(parsed);
              }}
            />
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={rows.length >= 50}
              onClick={() => setRowCount(rows.length + 1)}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.increaseRowsAria}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{PAGE_CONTENT_EDITOR_LABELS.table.addRowButton}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-xs font-mono opacity-80 tabular-nums"
            data-testid="table-sizing-status"
          >
            {PAGE_CONTENT_EDITOR_LABELS.table.totalWidthPrefix}: {roundedTotal}%
            {Math.abs(roundedTotal - 100) > 0.1 && headers.length > 1
              ? ` (${PAGE_CONTENT_EDITOR_LABELS.table.autoNormalizedHint})`
              : ''}
          </span>
          {headers.length > 1 && (
            <button
              type="button"
              className="pbtn sm"
              onClick={equalizeWidths}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.table.equalizeAria}
            >
              {PAGE_CONTENT_EDITOR_LABELS.table.equalizeButton}
            </button>
          )}
          <button
            type="button"
            className={`pbtn sm ${showPreview ? 'on' : ''}`}
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{PAGE_CONTENT_EDITOR_LABELS.table.previewButton}</span>
          </button>
        </div>
      </div>

      {/* Editable Grid */}
      <div className="overflow-x-auto pb-1">
        <table className="w-full border-collapse min-w-[420px]">
          <colgroup>
            {headers.map((_, colIdx) => {
              const rawPct = layout.widths[colIdx] ?? 100 / headers.length;
              const edPct =
                headers.length <= 4 ? Math.max(14, rawPct) : rawPct;
              return <col key={colIdx} style={{ width: `${edPct}%` }} />;
            })}
            {rows.length > 1 && <col style={{ width: '38px' }} />}
          </colgroup>
          <thead>
            <tr>
              {headers.map((headerText, colIdx) => {
                const rawVal = layout.rawWidths[colIdx] ?? 100;
                const displayVal =
                  editingWidth?.colIdx === colIdx
                    ? editingWidth.value
                    : String(rawVal);

                return (
                  <th key={colIdx} className="p-1 align-bottom text-left font-normal">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1 px-0.5">
                      <span className="text-[11px] font-mono opacity-70">
                        {PAGE_CONTENT_EDITOR_LABELS.table.headerPrefix} {colIdx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        {headers.length > 1 ? (
                          <div className="inline-flex items-center gap-0.5">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              step="any"
                              className="pinput !w-14 !py-0.5 !px-1 text-right text-xs font-mono tabular-nums"
                              aria-label={`${PAGE_CONTENT_EDITOR_LABELS.table.widthInputAriaPrefix} ${colIdx + 1}`}
                              value={displayVal}
                              onFocus={() =>
                                setEditingWidth({
                                  colIdx,
                                  value: String(rawVal),
                                })
                              }
                              onChange={(e) => {
                                const nextStr = e.target.value;
                                setEditingWidth({ colIdx, value: nextStr });
                                const parsed = Number.parseFloat(nextStr);
                                if (
                                  Number.isFinite(parsed) &&
                                  parsed >= 1 &&
                                  parsed <= 100
                                ) {
                                  updateColumnWidth(colIdx, parsed);
                                }
                              }}
                              onBlur={() => {
                                if (editingWidth?.colIdx === colIdx) {
                                  const parsed = Number.parseFloat(
                                    editingWidth.value
                                  );
                                  if (Number.isFinite(parsed) && parsed >= 1) {
                                    updateColumnWidth(colIdx, parsed);
                                  }
                                }
                                setEditingWidth(null);
                              }}
                            />
                            <span className="text-[11px] font-mono opacity-70">
                              %
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono opacity-70">
                            100%
                          </span>
                        )}
                        {headers.length > 1 && (
                          <button
                            type="button"
                            className="pbtn sm !p-0 !w-6 !h-6"
                            onClick={() => removeColumn(colIdx)}
                            aria-label={`${PAGE_CONTENT_EDITOR_LABELS.table.deleteColPrefix} ${colIdx + 1}`}
                            title={`${PAGE_CONTENT_EDITOR_LABELS.table.deleteColPrefix} ${colIdx + 1}`}
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      className="pinput !py-1.5 !px-2 text-sm font-semibold min-w-[96px]"
                      placeholder={`${PAGE_CONTENT_EDITOR_LABELS.table.headerPrefix} ${colIdx + 1}`}
                      aria-label={`${PAGE_CONTENT_EDITOR_LABELS.table.headerAriaPrefix} ${colIdx + 1}`}
                      value={headerText}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdate((prev) => ({
                          ...prev,
                          headers: prev.headers.map((h, i) =>
                            i === colIdx ? val : h
                          ),
                        }));
                      }}
                    />
                  </th>
                );
              })}
              {rows.length > 1 && (
                <th
                  className="w-9 p-1"
                  aria-label={PAGE_CONTENT_EDITOR_LABELS.table.rowActionsAria}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {headers.map((_, colIdx) => (
                  <td key={colIdx} className="p-1 align-top">
                    <textarea
                      rows={3}
                      className="ptarea !py-1.5 !px-2 text-sm leading-snug min-w-[96px]"
                      placeholder={`${PAGE_CONTENT_EDITOR_LABELS.table.rowPlaceholderPrefix} ${rowIdx + 1}`}
                      aria-label={`${PAGE_CONTENT_EDITOR_LABELS.table.rowAriaPrefix} ${rowIdx + 1} ${PAGE_CONTENT_EDITOR_LABELS.table.colAriaPrefix} ${colIdx + 1}`}
                      value={row[colIdx] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdate((prev) => ({
                          ...prev,
                          rows: prev.rows.map((r, rI) =>
                            rI === rowIdx
                              ? prev.headers.map((__, cI) =>
                                  cI === colIdx ? val : r[cI] ?? ''
                                )
                              : r
                          ),
                        }));
                      }}
                    />
                  </td>
                ))}
                {rows.length > 1 && (
                  <td className="p-1 align-middle text-center">
                    <button
                      type="button"
                      className="pbtn sm !p-0 !w-7 !h-7"
                      onClick={() => removeRow(rowIdx)}
                      aria-label={`${PAGE_CONTENT_EDITOR_LABELS.table.deleteRowPrefix} ${rowIdx + 1}`}
                      title={`${PAGE_CONTENT_EDITOR_LABELS.table.deleteRowPrefix} ${rowIdx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPreview && <PageEditPreviewTable block={block} />}
    </div>
  );
}

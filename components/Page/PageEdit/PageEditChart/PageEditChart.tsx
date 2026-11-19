'use client';

import React from 'react';
import { Eye, Minus, Plus, Trash2, X } from 'lucide-react';
import { PAGE_CONTENT_EDITOR_LABELS } from '@/lib/data/data-page-content-editor';
import { clamp } from '@/lib/page/page-edit/page-edit';
import { uid } from '@/lib/presentation/presentation-utils';
import type { ChartBlock } from '@/lib/deck-types';
import { PageEditPreviewChart } from '../PageEditPreview/PageEditPreviewChart';

export function ChartBlockEditor({
  block,
  onUpdate,
}: {
  block: ChartBlock;
  onUpdate: (updater: (prev: ChartBlock) => ChartBlock) => void;
}) {
  const [showPreview, setShowPreview] = React.useState(false);
  const [draftValues, setDraftValues] = React.useState<Record<string, string>>({});

  const categories =
    block.categories.length > 0 ? block.categories : ['Kategori 1'];
  const series =
    block.series.length > 0
      ? block.series
      : [{ id: uid(), name: 'Seri 1', values: [0] }];

  const setCategoryCount = (nextCount: number) => {
    const target = clamp(nextCount, 1, 20);
    onUpdate((prev) => {
      const curCats =
        prev.categories.length > 0 ? prev.categories : ['Kategori 1'];
      if (target === curCats.length) return prev;
      const nextCats =
        target > curCats.length
          ? [
              ...curCats,
              ...Array.from(
                { length: target - curCats.length },
                (_, idx) => `Kategori ${curCats.length + idx + 1}`
              ),
            ]
          : curCats.slice(0, target);
      const nextSeries = prev.series.map((s) => ({
        ...s,
        values:
          target > s.values.length
            ? [
                ...s.values,
                ...Array.from({ length: target - s.values.length }, () => 0),
              ]
            : s.values.slice(0, target),
      }));
      return { ...prev, categories: nextCats, series: nextSeries };
    });
  };

  const setSeriesCount = (nextCount: number) => {
    const target = clamp(nextCount, 1, 12);
    onUpdate((prev) => {
      const catLen = Math.max(1, prev.categories.length);
      const curSeries =
        prev.series.length > 0
          ? prev.series
          : [{ id: uid(), name: 'Seri 1', values: Array.from({ length: catLen }, () => 0) }];
      if (target === curSeries.length) return prev;
      const nextSeries =
        target > curSeries.length
          ? [
              ...curSeries,
              ...Array.from({ length: target - curSeries.length }, (_, idx) => ({
                id: uid(),
                name: `Seri ${curSeries.length + idx + 1}`,
                values: Array.from({ length: catLen }, () => 0),
              })),
            ]
          : curSeries.slice(0, target);
      return { ...prev, series: nextSeries };
    });
  };

  const removeCategory = (catIdx: number) => {
    if (categories.length <= 1) return;
    onUpdate((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== catIdx),
      series: prev.series.map((s) => ({
        ...s,
        values: s.values.filter((_, i) => i !== catIdx),
      })),
    }));
  };

  const removeSeries = (serIdx: number) => {
    if (series.length <= 1) return;
    onUpdate((prev) => ({
      ...prev,
      series: prev.series.filter((_, i) => i !== serIdx),
    }));
  };

  return (
    <div className="space-y-3">
      {/* Chart Title Input */}
      <input
        type="text"
        className="pinput text-sm font-semibold"
        placeholder={PAGE_CONTENT_EDITOR_LABELS.chart.titlePlaceholder}
        aria-label={PAGE_CONTENT_EDITOR_LABELS.chart.titleAria}
        value={block.title ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          onUpdate((prev) => ({ ...prev, title: val }));
        }}
      />

      {/* Category & Series Dimension Controls + Preview Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-current/15">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold opacity-80">
              {PAGE_CONTENT_EDITOR_LABELS.chart.categoryLabel}
            </span>
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={categories.length <= 1}
              onClick={() => setCategoryCount(categories.length - 1)}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.chart.decreaseCategoriesAria}
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              type="number"
              min={1}
              max={20}
              className="pinput !w-14 !py-1 !px-1.5 text-center text-sm font-mono tabular-nums"
              aria-label={PAGE_CONTENT_EDITOR_LABELS.chart.categoriesCountAria}
              value={categories.length}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed)) setCategoryCount(parsed);
              }}
            />
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={categories.length >= 20}
              onClick={() => setCategoryCount(categories.length + 1)}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.chart.increaseCategoriesAria}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{PAGE_CONTENT_EDITOR_LABELS.chart.addCategoryButton}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold opacity-80">
              {PAGE_CONTENT_EDITOR_LABELS.chart.seriesLabel}
            </span>
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={series.length <= 1}
              onClick={() => setSeriesCount(series.length - 1)}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.chart.decreaseSeriesAria}
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <input
              type="number"
              min={1}
              max={12}
              className="pinput !w-14 !py-1 !px-1.5 text-center text-sm font-mono tabular-nums"
              aria-label={PAGE_CONTENT_EDITOR_LABELS.chart.seriesCountAria}
              value={series.length}
              onChange={(e) => {
                const parsed = Number.parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed)) setSeriesCount(parsed);
              }}
            />
            <button
              type="button"
              className="pbtn sm !px-2"
              disabled={series.length >= 12}
              onClick={() => setSeriesCount(series.length + 1)}
              aria-label={PAGE_CONTENT_EDITOR_LABELS.chart.increaseSeriesAria}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{PAGE_CONTENT_EDITOR_LABELS.chart.addSeriesButton}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          className={`pbtn sm ${showPreview ? 'on' : ''}`}
          onClick={() => setShowPreview((v) => !v)}
          aria-pressed={showPreview}
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{PAGE_CONTENT_EDITOR_LABELS.chart.previewButton}</span>
        </button>
      </div>

      {/* Editable Chart Data Spreadsheet */}
      <div className="overflow-x-auto pb-1">
        <table className="w-full border-collapse min-w-[400px]">
          <thead>
            <tr>
              <th className="p-1 align-bottom text-left font-normal min-w-[140px]">
                <div className="flex items-center justify-between gap-1 h-6 mb-1 px-0.5">
                  <span className="text-[11px] font-mono opacity-70">
                    {PAGE_CONTENT_EDITOR_LABELS.chart.categoryHeader}
                  </span>
                </div>
                <div className="pinput !py-1.5 !px-2 text-sm font-semibold opacity-80 bg-black/5 select-none">
                  {PAGE_CONTENT_EDITOR_LABELS.chart.categoryHeader}
                </div>
              </th>
              {series.map((ser, sIdx) => (
                <th
                  key={ser.id}
                  className="p-1 align-bottom text-left font-normal min-w-[116px]"
                >
                  <div className="flex items-center justify-between gap-1 h-6 mb-1 px-0.5">
                    <span className="text-[11px] font-mono opacity-70">
                      {PAGE_CONTENT_EDITOR_LABELS.chart.seriesPrefix} {sIdx + 1}
                    </span>
                    {series.length > 1 && (
                      <button
                        type="button"
                        className="pbtn sm !p-0 !w-6 !h-6"
                        onClick={() => removeSeries(sIdx)}
                        aria-label={`${PAGE_CONTENT_EDITOR_LABELS.chart.deleteSeriesPrefix} ${sIdx + 1}`}
                        title={`${PAGE_CONTENT_EDITOR_LABELS.chart.deleteSeriesPrefix} ${sIdx + 1}`}
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className="pinput !py-1.5 !px-2 text-sm font-semibold"
                    placeholder={`${PAGE_CONTENT_EDITOR_LABELS.chart.seriesPrefix} ${sIdx + 1}`}
                    aria-label={`${PAGE_CONTENT_EDITOR_LABELS.chart.seriesAriaPrefix} ${sIdx + 1}`}
                    value={ser.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdate((prev) => ({
                        ...prev,
                        series: prev.series.map((item, idx) =>
                          idx === sIdx ? { ...item, name: val } : item
                        ),
                      }));
                    }}
                  />
                </th>
              ))}
              {categories.length > 1 && (
                <th
                  className="w-9 p-1"
                  aria-label={PAGE_CONTENT_EDITOR_LABELS.table.rowActionsAria}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, cIdx) => (
              <tr key={cIdx}>
                <td className="p-1 align-middle">
                  <input
                    type="text"
                    className="pinput !py-1.5 !px-2 text-sm"
                    placeholder={`${PAGE_CONTENT_EDITOR_LABELS.chart.categoryPlaceholderPrefix} ${cIdx + 1}`}
                    aria-label={`${PAGE_CONTENT_EDITOR_LABELS.chart.categoryAriaPrefix} ${cIdx + 1}`}
                    value={cat}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdate((prev) => ({
                        ...prev,
                        categories: prev.categories.map((item, idx) =>
                          idx === cIdx ? val : item
                        ),
                      }));
                    }}
                  />
                </td>
                {series.map((ser, sIdx) => {
                  const cellKey = `${ser.id}:${cIdx}`;
                  const storedVal = ser.values[cIdx] ?? 0;
                  const inputValue =
                    cellKey in draftValues
                      ? draftValues[cellKey]
                      : String(storedVal);
                  return (
                    <td key={ser.id} className="p-1 align-middle">
                      <input
                        type="number"
                        step="any"
                        className="pinput !py-1.5 !px-2 text-sm font-mono tabular-nums text-right"
                        aria-label={`${PAGE_CONTENT_EDITOR_LABELS.chart.valueAriaPrefix} ${cat || `${PAGE_CONTENT_EDITOR_LABELS.chart.categoryPlaceholderPrefix} ${cIdx + 1}`} - ${ser.name || `${PAGE_CONTENT_EDITOR_LABELS.chart.seriesPrefix} ${sIdx + 1}`}`}
                        value={inputValue}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setDraftValues((prev) => ({ ...prev, [cellKey]: raw }));
                          const num = Number(raw);
                          if (raw.trim() !== '' && Number.isFinite(num)) {
                            onUpdate((prev) => ({
                              ...prev,
                              series: prev.series.map((item, idx) =>
                                idx === sIdx
                                  ? {
                                      ...item,
                                      values: prev.categories.map((_, vIdx) =>
                                        vIdx === cIdx
                                          ? num
                                          : item.values[vIdx] ?? 0
                                      ),
                                    }
                                  : item
                              ),
                            }));
                          }
                        }}
                        onBlur={() => {
                          const raw = draftValues[cellKey];
                          if (raw === undefined) return;
                          const num = Number(raw);
                          const finalNum =
                            raw.trim() !== '' && Number.isFinite(num) ? num : 0;
                          onUpdate((prev) => ({
                            ...prev,
                            series: prev.series.map((item, idx) =>
                              idx === sIdx
                                ? {
                                    ...item,
                                    values: prev.categories.map((_, vIdx) =>
                                      vIdx === cIdx
                                        ? finalNum
                                        : item.values[vIdx] ?? 0
                                    ),
                                  }
                                : item
                            ),
                          }));
                          setDraftValues((prev) => {
                            const next = { ...prev };
                            delete next[cellKey];
                            return next;
                          });
                        }}
                      />
                    </td>
                  );
                })}
                {categories.length > 1 && (
                  <td className="p-1 align-middle text-center">
                    <button
                      type="button"
                      className="pbtn sm !p-0 !w-7 !h-7"
                      onClick={() => removeCategory(cIdx)}
                      aria-label={`${PAGE_CONTENT_EDITOR_LABELS.chart.deleteCategoryPrefix} ${cIdx + 1}`}
                      title={`${PAGE_CONTENT_EDITOR_LABELS.chart.deleteCategoryPrefix} ${cIdx + 1}`}
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

      {block.chartType === 'pie' && series.length > 1 && (
        <p className="text-xs opacity-70 m-0">
          {PAGE_CONTENT_EDITOR_LABELS.chart.pieMultiSeriesHint}
        </p>
      )}

      {showPreview && <PageEditPreviewChart block={block} />}
    </div>
  );
}

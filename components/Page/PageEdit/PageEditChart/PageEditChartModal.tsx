'use client';

import React from 'react';
import {
  BarChart3,
  BarChartHorizontal,
  Disc,
  PieChart,
  TrendingUp,
  X,
} from 'lucide-react';
import { PAGE_CONTENT_EDITOR_LABELS } from '@/lib/data/data-page-content-editor';
import {
  CHART_TYPE_LIST,
  createDefaultChartData,
  getChartTypeMeta,
} from '@/lib/page/page-edit/page-edit-chart';
import type { ChartBlock, ChartType } from '@/lib/deck-types';
import { ChartView } from './PageEditChartView';

interface PageEditChartModalProps {
  open: boolean;
  mode: 'add' | 'change-type';
  initialType?: ChartType;
  onClose: () => void;
  onConfirm: (chartType: ChartType) => void;
}

function getChartIcon(chartType: ChartType) {
  switch (chartType) {
    case 'column':
      return BarChart3;
    case 'line':
      return TrendingUp;
    case 'pie':
      return PieChart;
    case 'bar':
      return BarChartHorizontal;
    case 'sunburst':
      return Disc;
  }
}

export function PageEditChartModal(props: PageEditChartModalProps) {
  if (!props.open) return null;
  return (
    <PageEditChartModalInner
      key={`${props.mode}-${props.initialType ?? 'column'}`}
      {...props}
    />
  );
}

function PageEditChartModalInner({
  mode,
  initialType = 'column',
  onClose,
  onConfirm,
}: PageEditChartModalProps) {
  const [selectedType, setSelectedType] = React.useState<ChartType>(initialType);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const sampleBlock = React.useMemo<ChartBlock>(() => {
    const starter = createDefaultChartData(selectedType);
    return {
      id: `preview-${selectedType}`,
      t: 'chart',
      chartType: selectedType,
      title: starter.title,
      categories: starter.categories,
      series: starter.series,
      w: 12,
    };
  }, [selectedType]);

  const meta = getChartTypeMeta(selectedType);
  const heading =
    mode === 'change-type'
      ? PAGE_CONTENT_EDITOR_LABELS.chart.modalHeadingChange
      : PAGE_CONTENT_EDITOR_LABELS.chart.modalHeadingAdd;
  const confirmLabel =
    mode === 'change-type'
      ? PAGE_CONTENT_EDITOR_LABELS.chart.modalConfirmChange
      : PAGE_CONTENT_EDITOR_LABELS.chart.modalConfirmAdd;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className="modal-card !w-[min(760px,100%)]"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold m-0">{heading}</h2>
          <button
            type="button"
            className="pbtn sm w-8 h-8 !p-0 shrink-0"
            onClick={onClose}
            aria-label={PAGE_CONTENT_EDITOR_LABELS.chart.modalCloseAria}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[190px_1fr] gap-4 items-start">
          {/* PPTX-style left chart category selector */}
          <div
            className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0"
            role="radiogroup"
            aria-label="Jenis chart"
          >
            {CHART_TYPE_LIST.map((item) => {
              const Icon = getChartIcon(item.id);
              const isSelected = selectedType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`pbtn sm justify-start shrink-0 whitespace-nowrap ${
                    isSelected ? 'on' : ''
                  }`}
                  onClick={() => setSelectedType(item.id)}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* PPTX-style right preview panel */}
          <div className="space-y-3 min-w-0">
            <div className="space-y-0.5">
              <div className="text-base font-bold">{meta.editorTitle}</div>
              <p className="text-xs opacity-75 m-0">{meta.shortDesc}</p>
            </div>
            <ChartView block={sampleBlock} interactive={false} compact={true} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 mt-5 pt-3 border-t border-current/15">
          <button type="button" className="pbtn sm" onClick={onClose}>
            {PAGE_CONTENT_EDITOR_LABELS.chart.modalCancelButton}
          </button>
          <button
            type="button"
            className="pbtn sm on"
            onClick={() => onConfirm(selectedType)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

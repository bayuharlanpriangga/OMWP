'use client';

import React from 'react';
import { PAGE_CONTENT_EDITOR_LABELS } from '@/lib/data/data-page-content-editor';
import type { ChartBlock } from '@/lib/deck-types';
import { ChartView } from '../PageEditChart/PageEditChartView';

interface PageEditPreviewChartProps {
  block: ChartBlock;
}

export function PageEditPreviewChart({ block }: PageEditPreviewChartProps) {
  return (
    <div className="p-3 rounded-lg border border-current/20 bg-[var(--bg)]">
      <div className="text-xs font-mono opacity-60 mb-2">
        {PAGE_CONTENT_EDITOR_LABELS.chart.previewHeading}
      </div>
      <ChartView block={block} live={false} />
    </div>
  );
}

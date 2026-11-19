'use client';

import React from 'react';
import { PAGE_CONTENT_EDITOR_LABELS } from '@/lib/data/data-page-content-editor';
import type { TableBlock } from '@/lib/deck-types';
import { TableView } from '../PageEditTable';

interface PageEditPreviewTableProps {
  block: TableBlock;
}

export function PageEditPreviewTable({ block }: PageEditPreviewTableProps) {
  return (
    <div className="p-3 rounded-lg border border-current/20 bg-[var(--bg)]">
      <div className="text-xs font-mono opacity-60 mb-2">
        {PAGE_CONTENT_EDITOR_LABELS.table.previewHeading}
      </div>
      <TableView block={block} live={false} onTermClick={() => {}} />
    </div>
  );
}

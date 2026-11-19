'use client';

import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  Italic,
  Minus,
  Plus,
  Underline,
  X,
} from 'lucide-react';
import { BLOCK_NAMES } from '@/lib/page/page-layout/page-layout-panel';
import { formatChartEditorTitle } from '@/lib/presentation/presentation-chart';
import type { Block, TextAlign, TextSize } from '@/lib/deck-types';

interface PageLayoutEditorPanelProps {
  block: Block;
  isTopLevel: boolean;
  onDeselect: () => void;
  onNudge: (dir: 'u' | 'd' | 'l' | 'r') => void;
  onMoveOrder: (delta: -1 | 1) => void;
  onResizeWidth: (delta: number) => void;
  onSetSize: (size: TextSize) => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onSetAlign: (align: TextAlign) => void;
}

const SIZES: TextSize[] = ['s', 'm', 'l', 'xl', 'xxl'];
const ALIGNS: Array<{ value: TextAlign; label: string }> = [
  { value: 'l', label: 'Kiri' },
  { value: 'c', label: 'Tengah' },
  { value: 'r', label: 'Kanan' },
];

export function PageLayoutEditorPanel({
  block,
  isTopLevel,
  onDeselect,
  onNudge,
  onMoveOrder,
  onResizeWidth,
  onSetSize,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onSetAlign,
}: PageLayoutEditorPanelProps) {
  return (
    <section
      className="pres-insp"
      aria-label="Inspektor tata letak blok"
    >
      <div className="flex items-center gap-3">
        <strong className="text-sm">
          {block.t === 'chart'
            ? formatChartEditorTitle(block.chartType)
            : BLOCK_NAMES[block.t]}
        </strong>
        <span className="text-xs opacity-70 font-mono tabular-nums">
          lebar {block.w}/12
        </span>
        <button
          type="button"
          className="pbtn sm ml-auto"
          onClick={onDeselect}
          aria-label="Tutup inspektor blok"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-2.5">
        {isTopLevel ? (
          <>
            <button
              type="button"
              className="pbtn sm"
              onClick={() => onNudge('u')}
              aria-label="Geser ke atas"
            >
              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="pbtn sm"
              onClick={() => onNudge('d')}
              aria-label="Geser ke bawah"
            >
              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="pbtn sm"
              onClick={() => onNudge('l')}
              aria-label="Geser ke kiri"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="pbtn sm"
              onClick={() => onNudge('r')}
              aria-label="Geser ke kanan"
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="pbtn sm"
              onClick={() => onMoveOrder(-1)}
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Lebih awal</span>
            </button>
            <button
              type="button"
              className="pbtn sm"
              onClick={() => onMoveOrder(1)}
            >
              <span>Lebih akhir</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </>
        )}

        <button
          type="button"
          className="pbtn sm"
          onClick={() => onResizeWidth(-1)}
        >
          <Minus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Kecil</span>
        </button>
        <button
          type="button"
          className="pbtn sm"
          onClick={() => onResizeWidth(1)}
        >
          <span>Besar</span>
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {block.t === 'text' && (
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {SIZES.map((sz) => (
            <button
              key={sz}
              type="button"
              className={`pbtn sm ${block.size === sz ? 'on' : ''}`}
              onClick={() => onSetSize(sz)}
            >
              {sz.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            className={`pbtn sm ${block.b ? 'on' : ''}`}
            onClick={onToggleBold}
            aria-label="Tebal"
          >
            <Bold className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`pbtn sm ${block.i ? 'on' : ''}`}
            onClick={onToggleItalic}
            aria-label="Miring"
          >
            <Italic className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`pbtn sm ${block.u ? 'on' : ''}`}
            onClick={onToggleUnderline}
            aria-label="Garis bawah"
          >
            <Underline className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          {ALIGNS.map((al) => (
            <button
              key={al.value}
              type="button"
              className={`pbtn sm ${block.align === al.value ? 'on' : ''}`}
              onClick={() => onSetAlign(al.value)}
            >
              {al.label}
            </button>
          ))}
        </div>
      )}

      {block.t === 'title' && (
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {ALIGNS.map((al) => (
            <button
              key={al.value}
              type="button"
              className={`pbtn sm ${(block.align || 'l') === al.value ? 'on' : ''}`}
              onClick={() => onSetAlign(al.value)}
            >
              {al.label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { getSlideTitle } from '@/lib/logic/logic-presentation-app';
import type { Slide } from '@/lib/deck-types';

interface LayoutSlideStripProps {
  slides: Slide[];
  slideIndex: number;
  onSelectSlide: (idx: number) => void;
  onAddSlide: () => void;
}

export function LayoutSlideStrip({
  slides,
  slideIndex,
  onSelectSlide,
  onAddSlide,
}: LayoutSlideStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {slides.map((s, idx) => (
        <button
          key={s.id}
          type="button"
          className={`pbtn sm min-w-[40px] ${idx === slideIndex ? 'on' : ''}`}
          onClick={() => onSelectSlide(idx)}
          title={getSlideTitle(s)}
        >
          {idx + 1}
        </button>
      ))}
      <button type="button" className="pbtn sm" onClick={onAddSlide}>
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Slide</span>
      </button>
    </div>
  );
}

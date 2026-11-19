'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlideNavProps {
  slideIndex: number;
  totalSlides: number;
  onStep: (delta: number) => void;
}

export function SlideNav({ slideIndex, totalSlides, onStep }: SlideNavProps) {
  return (
    <nav className="pres-nav" aria-label="Navigasi slide">
      <button
        type="button"
        className="pbtn sm"
        disabled={slideIndex <= 0}
        onClick={() => onStep(-1)}
        aria-label="Slide sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      </button>

      <div
        className="prog"
        role="progressbar"
        aria-valuenow={slideIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalSlides}
      >
        <span
          className="prog-bar"
          style={{
            width: `${((slideIndex + 1) / totalSlides) * 100}%`,
          }}
        />
      </div>

      <span className="cnt">
        {slideIndex + 1}/{totalSlides}
      </span>

      <button
        type="button"
        className="pbtn sm"
        disabled={slideIndex >= totalSlides - 1}
        onClick={() => onStep(1)}
        aria-label="Slide berikutnya"
      >
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

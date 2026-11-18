'use client';

import React from 'react';
import {
  clamp,
  findBlockInSlide,
  moveBlockInParent,
  updateBlockInSlide,
} from '@/lib/logic/logic-presentation-app';
import type { Slide, TextAlign, TextSize, WorkspaceMode } from '@/lib/deck-types';
import type { PageLayoutEditorHandle } from '@/components/page/pagelayout/PageLayoutEditor';

export function useLayoutInspector({
  mode,
  currentSlide,
  updateCurrentSlide,
}: {
  mode: WorkspaceMode;
  currentSlide: Slide;
  updateCurrentSlide: (updater: (s: Slide) => Slide) => void;
}) {
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(
    null
  );
  const canvasActionRef = React.useRef<PageLayoutEditorHandle | null>(null);

  const selectedInfo =
    mode === 'layout' && selectedBlockId
      ? findBlockInSlide(currentSlide, selectedBlockId)
      : null;

  const nudgeSelected = React.useCallback(
    (dir: 'u' | 'd' | 'l' | 'r') => {
      if (!selectedInfo) return;
      const b = selectedInfo.block;
      if (b.y == null) return;
      const nextPos = canvasActionRef.current?.nudgeAndShowGuides(b, dir);
      updateCurrentSlide((s) =>
        updateBlockInSlide(s, b.id, (prev) => {
          if (nextPos) {
            return { ...prev, x: nextPos.x, y: nextPos.y };
          }
          const curY = prev.y ?? 0;
          const curX = prev.x ?? 0;
          if (dir === 'u') return { ...prev, y: Math.max(0, curY - 10) };
          if (dir === 'd') return { ...prev, y: curY + 10 };
          if (dir === 'l')
            return { ...prev, x: Number(Math.max(0, curX - 1).toFixed(2)) };
          return {
            ...prev,
            x: Number(
              Math.min(100 - (prev.w / 12) * 100, curX + 1).toFixed(2)
            ),
          };
        })
      );
    },
    [selectedInfo, updateCurrentSlide]
  );

  const resizeSelected = React.useCallback(
    (delta: number) => {
      if (!selectedInfo) return;
      const b = selectedInfo.block;
      const nextW = clamp(b.w + delta, 1, 12);
      updateCurrentSlide((s) =>
        updateBlockInSlide(s, b.id, (prev) => ({
          ...prev,
          w: clamp(prev.w + delta, 1, 12),
        }))
      );
      if (selectedInfo.parentKind === 'slide') {
        canvasActionRef.current?.showResizeGuides(b, nextW);
      }
    },
    [selectedInfo, updateCurrentSlide]
  );

  const moveOrderSelected = React.useCallback(
    (delta: -1 | 1) => {
      if (!selectedInfo) return;
      updateCurrentSlide((s) => moveBlockInParent(s, selectedInfo.block.id, delta));
    },
    [selectedInfo, updateCurrentSlide]
  );

  const setSelectedTextProp = React.useCallback(
    (patch: { size?: TextSize; b?: boolean; align?: TextAlign }) => {
      if (
        !selectedInfo ||
        (selectedInfo.block.t !== 'text' && selectedInfo.block.t !== 'title')
      ) {
        return;
      }
      updateCurrentSlide((s) =>
        updateBlockInSlide(s, selectedInfo.block.id, (prev) => {
          if (prev.t === 'text') return { ...prev, ...patch };
          if (prev.t === 'title' && patch.align) {
            return { ...prev, align: patch.align };
          }
          return prev;
        })
      );
    },
    [selectedInfo, updateCurrentSlide]
  );

  const deselectAndClearGuides = React.useCallback(() => {
    canvasActionRef.current?.clearGuides();
    setSelectedBlockId(null);
  }, []);

  return {
    selectedBlockId,
    setSelectedBlockId,
    canvasActionRef,
    selectedInfo,
    nudgeSelected,
    resizeSelected,
    moveOrderSelected,
    setSelectedTextProp,
    deselectAndClearGuides,
  };
}

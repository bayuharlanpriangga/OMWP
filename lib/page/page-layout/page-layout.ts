export { clamp } from '../../presentation/presentation-utils';

export interface RectPx {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface AlignmentGuideLine {
  orientation: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
  kind: 'edge' | 'center' | 'canvas-center';
}

export interface AlignmentResult {
  snappedLeft: number;
  snappedTop: number;
  guides: AlignmentGuideLine[];
}

export interface AlignmentOptions {
  snapThreshold?: number;
  allowSnapX?: boolean;
  allowSnapY?: boolean;
  canvasWidth?: number;
  maxLeft?: number;
}

export function computeAlignmentGuides(
  active: RectPx,
  others: RectPx[],
  options: AlignmentOptions = {}
): AlignmentResult {
  const threshold = options.snapThreshold ?? 6;
  const allowSnapX = options.allowSnapX ?? true;
  const allowSnapY = options.allowSnapY ?? true;
  const canvasWidth = options.canvasWidth ?? 0;
  const maxLeft = options.maxLeft;

  let bestDx: number | null = null;
  let bestDy: number | null = null;

  const activeXAnchors = [
    { val: active.left, offset: 0 },
    { val: active.left + active.width / 2, offset: active.width / 2 },
    { val: active.left + active.width, offset: active.width },
  ];
  const activeYAnchors = [
    { val: active.top, offset: 0 },
    { val: active.top + active.height / 2, offset: active.height / 2 },
    { val: active.top + active.height, offset: active.height },
  ];

  const isWithinXBounds = (candidateLeft: number) =>
    candidateLeft >= -0.5 &&
    (maxLeft === undefined || candidateLeft <= maxLeft + 0.5);

  if (allowSnapX) {
    if (canvasWidth > 0) {
      const canvasCenter = canvasWidth / 2;
      const activeCenter = active.left + active.width / 2;
      const dx = canvasCenter - activeCenter;
      if (Math.abs(dx) <= threshold && isWithinXBounds(active.left + dx)) {
        bestDx = dx;
      }
    }

    for (const other of others) {
      if (other.id === active.id) continue;
      const targetXs = [
        other.left,
        other.left + other.width / 2,
        other.left + other.width,
      ];
      for (const ax of activeXAnchors) {
        for (const tx of targetXs) {
          const dx = tx - ax.val;
          if (
            Math.abs(dx) <= threshold &&
            isWithinXBounds(active.left + dx) &&
            (bestDx === null || Math.abs(dx) < Math.abs(bestDx))
          ) {
            bestDx = dx;
          }
        }
      }
    }
  }

  if (allowSnapY) {
    for (const other of others) {
      if (other.id === active.id) continue;
      const targetYs = [
        other.top,
        other.top + other.height / 2,
        other.top + other.height,
      ];
      for (const ay of activeYAnchors) {
        for (const ty of targetYs) {
          const dy = ty - ay.val;
          const candidateTop = active.top + dy;
          if (
            Math.abs(dy) <= threshold &&
            candidateTop >= -0.5 &&
            (bestDy === null || Math.abs(dy) < Math.abs(bestDy))
          ) {
            bestDy = dy;
          }
        }
      }
    }
  }

  const snappedLeft = Math.max(
    0,
    maxLeft !== undefined ? Math.min(maxLeft, active.left + (bestDx ?? 0)) : active.left + (bestDx ?? 0)
  );
  const snappedTop = Math.max(0, active.top + (bestDy ?? 0));

  const finalRect: RectPx = {
    ...active,
    left: snappedLeft,
    top: snappedTop,
  };

  const matchTol = allowSnapX && allowSnapY ? 1.5 : threshold;
  const guides: AlignmentGuideLine[] = [];

  // Check canvas horizontal center alignment
  let matchesCanvasCenter = false;
  if (canvasWidth > 0) {
    const canvasCenter = canvasWidth / 2;
    const finalCenter = finalRect.left + finalRect.width / 2;
    if (Math.abs(finalCenter - canvasCenter) <= matchTol) {
      matchesCanvasCenter = true;
      guides.push({
        orientation: 'vertical',
        position: Math.round(canvasCenter),
        start: Math.max(0, Math.round(finalRect.top - 16)),
        end: Math.round(finalRect.top + finalRect.height + 16),
        kind: 'canvas-center',
      });
    }
  }

  const collectAxisGuides = (axis: 'vertical' | 'horizontal') => {
    const posStart = axis === 'vertical' ? finalRect.left : finalRect.top;
    const size = axis === 'vertical' ? finalRect.width : finalRect.height;

    const edges = [
      { pos: posStart, kind: 'edge' as const, role: 'start' as const },
      { pos: posStart + size / 2, kind: 'center' as const, role: 'center' as const },
      { pos: posStart + size, kind: 'edge' as const, role: 'end' as const },
    ];

    const matchedByRole: Record<'start' | 'center' | 'end', Set<string>> = {
      start: new Set(),
      center: new Set(),
      end: new Set(),
    };
    const buckets: Array<{
      role: 'start' | 'center' | 'end';
      pos: number;
      kind: 'edge' | 'center';
      rects: RectPx[];
    }> = [];

    for (const edge of edges) {
      const matched: RectPx[] = [];
      for (const other of others) {
        if (other.id === active.id) continue;
        const oPos = axis === 'vertical' ? other.left : other.top;
        const oSize = axis === 'vertical' ? other.width : other.height;
        const otherPositions = [oPos, oPos + oSize / 2, oPos + oSize];
        if (otherPositions.some((op) => Math.abs(op - edge.pos) <= matchTol)) {
          matched.push(other);
          matchedByRole[edge.role].add(other.id);
        }
      }
      if (matched.length > 0) {
        buckets.push({
          role: edge.role,
          pos: Math.round(edge.pos),
          kind: edge.kind,
          rects: [finalRect, ...matched],
        });
      }
    }

    // Deduplicate same rounded coordinate and omit redundant center guide when
    // every block matched at center already aligns on both outer edges.
    const seen = new Set<string>();
    for (const bucket of buckets) {
      if (bucket.role === 'center') {
        const allAlsoMatchBothEdges =
          matchedByRole.center.size > 0 &&
          Array.from(matchedByRole.center).every(
            (id) => matchedByRole.start.has(id) && matchedByRole.end.has(id)
          );
        if (allAlsoMatchBothEdges || (axis === 'vertical' && matchesCanvasCenter && matchedByRole.center.size === 0)) {
          continue;
        }
      }

      const key = `${bucket.kind}:${bucket.pos}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (axis === 'vertical') {
        const minTop = Math.min(...bucket.rects.map((r) => r.top));
        const maxBot = Math.max(...bucket.rects.map((r) => r.top + r.height));
        guides.push({
          orientation: 'vertical',
          position: bucket.pos,
          start: Math.max(0, Math.round(minTop - 6)),
          end: Math.round(maxBot + 6),
          kind: bucket.kind,
        });
      } else {
        const minLeft = Math.min(...bucket.rects.map((r) => r.left));
        const maxRight = Math.max(...bucket.rects.map((r) => r.left + r.width));
        guides.push({
          orientation: 'horizontal',
          position: bucket.pos,
          start: Math.max(0, Math.round(minLeft - 6)),
          end: Math.round(maxRight + 6),
          kind: bucket.kind,
        });
      }
    }
  };

  collectAxisGuides('vertical');
  collectAxisGuides('horizontal');

  return {
    snappedLeft,
    snappedTop,
    guides,
  };
}

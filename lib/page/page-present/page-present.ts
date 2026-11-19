import { stripMarkup } from '../../presentation/presentation-clear-markup-text';
import { clamp } from '../../presentation/presentation-utils';

export { clamp, stripMarkup };

export interface ReflowBoxInput {
  id: string;
  x: number;
  y: number;
  w: number;
  collapsedHeight: number;
  extraExpandedHeight: number;
}

/**
 * Computes top offsets for free-positioned blocks so expanding dropdowns/conclusions
 * push down blocks below them that share horizontal column overlap.
 */
export function computeReflowPositions(
  items: ReflowBoxInput[]
): Record<string, number> {
  const sorted = items
    .map((it) => {
      const x0 = clamp(it.x, 0, 100 - (it.w / 12) * 100);
      const x1 = x0 + (it.w / 12) * 100;
      return {
        ...it,
        x0,
        x1,
        bot: it.y + it.collapsedHeight,
        offset: 0,
      };
    })
    .sort((a, b) => a.y - b.y);

  const result: Record<string, number> = {};
  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    for (let k = 0; k < i; k++) {
      const prev = sorted[k];
      const overlapsX = prev.x0 < curr.x1 - 0.01 && prev.x1 > curr.x0 + 0.01;
      if (overlapsX && curr.y >= prev.bot - 2) {
        curr.offset = Math.max(
          curr.offset,
          prev.offset + prev.extraExpandedHeight
        );
      }
    }
    result[curr.id] = curr.y + curr.offset;
  }
  return result;
}

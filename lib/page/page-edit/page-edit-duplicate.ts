import type { Block, Slide } from '../../deck-types';
import { syncSlideModals } from '../../presentation/presentation-markup-text-modal';
import { uid } from '../../presentation/presentation-utils';

export function reidBlocks(blocks: Block[]): Block[] {
  return blocks.map((b) =>
    b.t === 'box'
      ? { ...b, id: uid(), children: reidBlocks(b.children) }
      : { ...b, id: uid() }
  );
}

export function duplicateSlide(slide: Slide): Slide {
  return syncSlideModals({
    ...slide,
    id: uid(),
    name: (slide.name || 'Slide') + ' (salinan)',
    blocks: reidBlocks(JSON.parse(JSON.stringify(slide.blocks)) as Block[]),
    modals: (slide.modals || []).map((m) => ({
      ...m,
      id: uid(),
      children: reidBlocks(JSON.parse(JSON.stringify(m.children)) as Block[]),
    })),
  });
}

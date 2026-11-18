import type { Block } from '../../../deck-types';
import {
  clamp,
  computeTableColumnWidths,
  createTextBlock,
  getSlideTitle,
  uid,
} from '../../../deck-logic';

export { clamp, computeTableColumnWidths, getSlideTitle };

export function createBlock(type: Block['t']): Block {
  switch (type) {
    case 'img':
      return { id: uid(), t: 'img', src: '', alt: '', w: 6 };
    case 'text':
      return createTextBlock('', 'm', 'l', false);
    case 'title':
      return { id: uid(), t: 'title', text: '', w: 12 };
    case 'dd':
      return { id: uid(), t: 'dd', text: '', detail: '', w: 4 };
    case 'box':
      return { id: uid(), t: 'box', title: '', children: [], w: 12 };
    case 'concl':
      return { id: uid(), t: 'concl', label: '★ Kesimpulan', text: '', w: 12 };
    case 'table':
      return {
        id: uid(),
        t: 'table',
        headers: ['Nama', 'Keterangan'],
        rows: [
          ['', ''],
          ['', ''],
        ],
        w: 12,
      };
  }
}

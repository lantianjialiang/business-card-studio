import type { Project } from '../types';
import { photo, shape, svg, text, vertical } from './helpers';

const ink = '#1b3930';
const green = '#507369';
const illustration = svg(240, 240, '<rect width="240" height="240" fill="#a9c9b4"/><circle cx="171" cy="56" r="30" fill="#e5efcb"/><path d="M0 165Q63 86 116 160T240 143V240H0Z" fill="#638b77"/><path d="M25 240q18-96 94-96t97 96" fill="#315546"/><circle cx="120" cy="107" r="46" fill="#e4ac87"/><path d="M73 105q-6-55 49-55 50 0 46 60-17-2-29-31-23 25-66 26z" fill="#233a32"/>');
export const templateD: Project = {
  ...vertical, id: 'botanic', templateId: 'botanic', name: '森屿',
  sides: {
    front: {
      background: { color: '#e4efe5' },
      elements: [
        text('eyebrow', 'FIELD NOTES  /  STUDIO', 50, 70, 500, 22, green, { align: 'center', letterSpacing: 4 }),
        photo('portrait', 185, 143, 230, 230, { mask: 'circle', src: illustration }),
        text('name', '林语森', 55, 421, 490, 64, ink, { align: 'center', fontFamily: 'Noto Serif SC', fontWeight: 'bold' }),
        text('en-name', 'LIN YUSEN', 55, 511, 490, 22, green, { align: 'center', letterSpacing: 5 }),
        text('title', '独立摄影师 · 视觉创作者', 55, 579, 490, 24, ink, { align: 'center' }),
        shape('rule', 237, 667, 126, 2, '#94afa0'),
        text('contact', '+86 136 0000 0186\nhi@fieldnotes.example\n杭州 · 中国', 55, 716, 490, 24, green, { align: 'center', height: 148, lineHeight: 1.72 }),
        text('footer', 'STORIES IN NATURAL LIGHT', 50, 951, 500, 17, green, { align: 'center', letterSpacing: 3.3 }),
      ],
    },
  },
};

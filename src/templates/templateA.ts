import type { Project } from '../types';
import { horizontal, photo, shape, svg, text } from './helpers';

const red = '#a31515';
const gray = '#5d4545';
const white = '#ffffff';
const pattern = '<defs><pattern id="s" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="48" height="48" fill="#A31515"/><rect width="13" height="48" fill="#E3A9A9"/></pattern></defs>';
const icons = [
  '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 18 18 0 0 1-7.9-2.8 18 18 0 0 1-5.5-5.5 18 18 0 0 1-2.8-8A2 2 0 0 1 5.6 3h3a2 2 0 0 1 2 1.7l.7 3a2 2 0 0 1-.5 2.1L9.6 11a14 14 0 0 0 5.5 5.5l1.2-1.2a2 2 0 0 1 2.1-.5l2 .5a2 2 0 0 1 1.6 1.6z"/>',
  '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7h.01"/>',
  '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
];
const contacts = ['+86 138 0000 0520', 'lukas@rotundweiss.example', '@rotundweiss', 'rotundweiss.example', '上海市静安区 · 愚园路 88 号'];

export const templateA: Project = {
  ...horizontal, id: 'tavern', templateId: 'tavern', name: '红白酒馆',
  sides: {
    front: {
      background: { color: white, imageSrc: svg(1050, 600, pattern + '<circle cx="976" cy="27" r="201" fill="url(#s)"/>') },
      elements: [
        text('eyebrow', 'ROT & WEISS  /  EST. 2018', 68, 62, 675, 21, red, { fontWeight: 'bold', letterSpacing: 4 }),
        text('name', 'Lukas Weber', 68, 112, 750, 69, red, { fontWeight: 'bold' }),
        text('title', '主理人  /  TAVERN HOST', 71, 202, 700, 25, gray, { letterSpacing: 1.3 }),
        shape('bar-1', 69, 277, 51, 88, red, { cornerRadius: 5 }),
        shape('bar-2', 69, 385, 51, 134, red, { cornerRadius: 5 }),
        ...contacts.flatMap((contact, index) => {
          const y = [286, 330, 395, 440, 486][index];
          return [
            photo(`icon-${index}`, 82, y + 1, 25, 25, { src: svg(24, 24, `<g fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[index]}</g>`) }),
            text(`contact-${index}`, contact, 141, y, 790, 24, gray),
          ];
        }),
        text('mark', 'MÜNCHEN INSPIRED', 705, 535, 283, 17, red, { align: 'right', letterSpacing: 2 }),
      ],
    },
    back: {
      background: { color: red, imageSrc: svg(1050, 600, pattern + '<rect width="1050" height="600" fill="url(#s)"/>') },
      elements: [
        shape('oval', 60, 58, 930, 484, white, { type: 'ellipse' }),
        photo('logo', 204, 216, 164, 164, { mask: 'circle', placeholderLabel: '上传 Logo' }),
        text('brand', 'ROT & WEISS', 409, 221, 480, 61, red, { fontWeight: 'bold' }),
        text('subtitle', '红 白 酒 馆', 414, 315, 430, 33, red, { letterSpacing: 8 }),
      ],
    },
  },
};

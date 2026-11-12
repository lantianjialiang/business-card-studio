import type { Project } from '../types';
import { horizontal, text } from './helpers';

const ink = '#25241f';
const olive = '#70634c';
export const templateC: Project = {
  ...horizontal, id: 'paper', templateId: 'paper', name: '留白',
  sides: {
    front: {
      background: { color: '#f6f0e3' },
      elements: [
        text('studio', 'FORMA STUDIO   /   INDEPENDENT PRACTICE', 72, 69, 906, 22, olive, { letterSpacing: 4 }),
        text('name', 'Alex Morgan', 67, 180, 915, 98, ink, { fontFamily: 'Georgia' }),
        text('role', 'Brand Designer  /  品牌设计师', 73, 303, 840, 28, olive),
        text('email', 'hello@forma.example', 73, 469, 521, 27, ink),
        text('phone', '+86 139 0000 0908', 73, 510, 520, 25, olive),
        text('location', 'SHANGHAI, CN', 692, 505, 284, 20, olive, { align: 'right', letterSpacing: 3.4 }),
      ],
    },
  },
};

import type { Project } from '../types';
import portrait from './assets/business-portrait.jpg?inline';
import { photo, shape, svg, text, vertical } from './helpers';

const white = '#ffffff';
const mist = '#e4ebff';
const navyPanel = svg(600, 590, '<defs><linearGradient id="navy" x2="0" y2="1"><stop stop-color="#344681"/><stop offset="1" stop-color="#19244b"/></linearGradient></defs><path d="M0 0 600 78V590H0Z" fill="url(#navy)"/>');
const contacts = [
  ['电话：+86 138 0000 1038', '<path d="M6 3h3l2 5-2 2a13 13 0 0 0 5 5l2-2 5 2v3a2 2 0 0 1-2 2C11 20 4 13 4 5a2 2 0 0 1 2-2Z"/>'],
  ['微信：zeyu.design', '<path d="M20 11a8 7 0 1 0-15 4l-1 4 4-2a9 9 0 0 0 3 .5 8 7 0 0 0 9-6.5Z"/><path d="M9 11h.01m5 0h.01"/>'],
  ['邮箱：zeyu@yunhang.example', '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'],
  ['地址：深圳市南山区 · 云航中心', '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'],
];

export const templateE: Project = {
  ...vertical, id: 'navy-profile', templateId: 'navy-profile', name: '蓝调人像',
  sides: {
    front: {
      background: { color: '#efefef' },
      elements: [
        photo('portrait', 0, 0, 600, 557, { src: portrait, placeholderLabel: '上传职业照片' }),
        photo('navy-panel', 0, 476, 600, 590, { src: navyPanel, placeholderLabel: '蓝色斜切色块' }),
        ...[0, 1, 2].map(index => shape(`dot-${index}`, 63 + index * 13, 535, 8, 8, white, { type: 'ellipse' })),
        text('name', '周泽宇', 62, 587, 228, 52, white, { fontFamily: 'Noto Sans SC', fontWeight: 'bold' }),
        text('english-name', 'Zeyu Zhou', 64, 658, 220, 33, white),
        shape('identity-divider', 296, 596, 1, 100, '#a0aed6'),
        text('company', '云航物流', 329, 595, 211, 20, mist),
        text('role', '客户经理', 329, 630, 211, 30, white, { fontWeight: 'bold' }),
        text('english-role', 'Account Manager', 330, 676, 220, 18, mist),
        ...contacts.flatMap(([value, path], index) => {
          const y = 746 + index * 34;
          const icon = svg(24, 24, `<g fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</g>`);
          return [
            photo(`contact-icon-${index}`, 62, y + 1, 23, 23, { src: icon, placeholderLabel: '联系图标' }),
            text(`contact-${index}`, value, 101, y, 445, 19, white),
          ];
        }),
        shape('work-divider', 62, 909, 476, 1, '#a0aed6'),
        shape('work-marker', 62, 946, 5, 22, white, { cornerRadius: 2 }),
        text('work-title', '工作内容', 75, 943, 280, 24, white, { fontWeight: 'bold' }),
        text('work-description', '负责客户需求对接、订单跟进与售后服务。', 62, 983, 385, 18, mist),
        { id: 'qr', type: 'qrcode', x: 462, y: 938, width: 76, height: 76, rotation: 0, opacity: 1, mode: 'generate', content: 'https://example.com', fg: '#19244b', bg: white, margin: 3 },
      ],
    },
  },
};

import type { Project } from '../types';
import { photo, shape, svg, text, vertical } from './helpers';

const white = '#ffffff';
const tint = '#ced8fc';
export const templateB: Project = {
  ...vertical, id: 'indigo', templateId: 'indigo', name: '深蓝商务',
  sides: {
    front: {
      background: { color: '#eef1fa', imageSrc: svg(600, 1066, '<defs><linearGradient id="g" x2=".8" y2="1"><stop stop-color="#2B3A7A"/><stop offset="1" stop-color="#1B2559"/></linearGradient></defs><path d="M0 372 600 244V1066H0Z" fill="url(#g)"/><path d="M53 800H547" stroke="#9facdd" stroke-width="2" stroke-dasharray="8 8"/>') },
      elements: [
        photo('portrait', 55, 38, 490, 337, { placeholderLabel: '上传照片' }),
        text('name', '李小画', 53, 420, 282, 44, white, { fontWeight: 'bold' }),
        text('en-name', 'Micheal Li', 53, 482, 282, 28, tint),
        shape('separator', 302, 430, 2, 84, '#a7b4f0'),
        text('company', '远景创意设计', 330, 425, 230, 26, white, { fontWeight: 'bold' }),
        text('job', '创意总监', 330, 464, 230, 22, tint),
        text('en-job', 'Creative Director', 330, 499, 230, 17, tint),
        ...[
          ['电话', '+86 138 0000 2026'],
          ['微信', 'micheal.design'],
          ['邮箱', 'micheal@studio.example'],
          ['地址', '上海市 · 徐汇区'],
        ].flatMap(([label, value], index) => [
          text(`label-${index}`, label, 54, 565 + 52 * index, 76, 23, tint),
          text(`contact-${index}`, value, 144, 565 + 52 * index, 403, 23, white),
        ]),
        text('work', '工作内容', 53, 832, 420, 27, white, { fontWeight: 'bold' }),
        text('about', '品牌策略 · 视觉识别\n数字产品与体验设计', 53, 888, 357, 23, tint, { height: 90, lineHeight: 1.5 }),
        { id: 'qr', type: 'qrcode', x: 445, y: 904, width: 101, height: 101, rotation: 0, opacity: 1, mode: 'generate', fg: '#17204c', bg: white, margin: 2 },
      ],
    },
  },
};

import type { Project } from '../types';
import { horizontal, text } from './helpers';

const paper = '#fffdf8';
const charcoal = '#292824';
const gray = '#4e4a45';
const orange = '#bd4b21';
const offices = [
  ['上海启芯微电子有限公司', '上海市徐汇区 · 研发中心', '021-5550 0101'],
  ['西安启芯科技有限公司', '西安市高新区 · 科技产业园', '029-5550 0102'],
  ['西安启芯微电子有限公司', '西安市高新区 · 创新大厦 11 层', '029-5550 0103'],
  ['苏州启芯半导体有限公司', '苏州市工业园区 · 创新中心', '0512-5550 0104'],
];

export const templateF: Project = {
  ...horizontal, id: 'orange-enterprise', templateId: 'orange-enterprise', name: '橙标企业',
  sides: {
    front: {
      background: { color: paper },
      elements: [
        text('name', '陈明远', 71, 61, 253, 47, charcoal, { fontFamily: 'Noto Sans SC', fontWeight: 'bold' }),
        text('english-name', 'Mingyuan Chen', 73, 124, 240, 25, gray),
        text('job', '芯片事业部总经理', 73, 165, 240, 22, gray),
        text('english-job', 'GM of IC Business', 73, 197, 238, 20, gray),
        text('mobile', '手 机：+86 138 0000 2088', 327, 71, 648, 25, gray),
        text('email', '邮 箱：mingyuan@qixin.example', 327, 113, 648, 25, gray),
        text('brand', 'QixinSemi', 324, 236, 365, 66, orange, { fontWeight: 'bold' }),
        text('brand-cn', '启芯微电子', 680, 272, 298, 26, orange, { fontWeight: 'bold' }),
        text('regions', '西安  ·  上海  ·  苏州  ·  台北  ·  新加坡', 328, 322, 605, 18, orange, { letterSpacing: 1 }),
        text('company', '西安启芯微电子有限公司', 327, 354, 645, 30, orange, { fontWeight: 'bold' }),
        text('office-phone', '电 话：029-5550 0103', 328, 402, 635, 25, gray),
        text('office-address', '地 址：西安市高新区科技路 20 号\n　　　创新大厦 11 层  710000', 328, 441, 644, 25, gray, { height: 70 }),
        text('website', '网 址：www.qixin.example', 328, 519, 640, 25, gray),
      ],
    },
    back: {
      background: { color: paper },
      elements: [
        ...offices.flatMap(([name, address, phone], index) => {
          const y = 60 + index * 128;
          return [
            text(`office-${index}`, name, 65, y, 710, 25, charcoal, { fontWeight: 'bold' }),
            text(`address-${index}`, address, 65, y + 34, 887, 23, gray),
            text(`phone-${index}`, `电 话：${phone}`, 65, y + 66, 710, 22, gray),
          ];
        }),
        text('brand-back', 'Qixin', 809, 54, 176, 39, orange, { align: 'right', fontWeight: 'bold' }),
      ],
    },
  },
};

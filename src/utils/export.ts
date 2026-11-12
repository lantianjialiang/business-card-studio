import type { Project, Side } from '../types';
import { renderCard } from '../components/canvas/ElementRenderer';
import { downloadFile, loadImage } from './image';

export async function exportDesign(project: Project, sides: Side[], format: 'png' | 'pdf', combined = false, dividerWidth = 2) {
  const name = project.name.trim() || '未命名名片';
  const pixelRatio = 3;
  const pages: string[] = [];
  for (const side of sides) pages.push(await renderCard(project, side, pixelRatio));
  if (format === 'png') {
    if (combined && pages.length === 2) {
      const [front, back] = await Promise.all(pages.map(loadImage));
      const stacked = project.width >= project.height;
      const divider = dividerWidth * pixelRatio;
      const canvas = document.createElement('canvas');
      canvas.width = stacked ? front.width : front.width + divider + back.width;
      canvas.height = stacked ? front.height + divider + back.height : front.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('无法创建合图，请缩小画布尺寸后重试。');
      context.drawImage(front, 0, 0);
      context.fillStyle = '#b7b3bf';
      if (stacked) context.fillRect(0, front.height, canvas.width, divider);
      else context.fillRect(front.width, 0, divider, canvas.height);
      context.drawImage(back, stacked ? 0 : front.width + divider, stacked ? front.height + divider : 0);
      const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!png) throw new Error('合图尺寸超出浏览器限制，请分开导出正反面。');
      const url = URL.createObjectURL(png);
      downloadFile(url, `${name}-正反面.png`);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    pages.forEach((page, index) => downloadFile(page, `${name}-${sides[index]}.png`));
    return;
  }
  const { jsPDF } = await import('jspdf');
  const { w, h } = project.physical;
  const orientation = w > h ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'mm', format: [w, h], compress: true, precision: 5 });
  pages.forEach((page, index) => {
    if (index) pdf.addPage([w, h], orientation);
    pdf.addImage(page, 'PNG', 0, 0, w, h, undefined, 'FAST');
  });
  const url = URL.createObjectURL(pdf.output('blob'));
  downloadFile(url, `${name}.pdf`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

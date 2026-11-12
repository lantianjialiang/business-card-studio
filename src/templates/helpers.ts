import type { ImageEl, Project, ShapeEl, TextEl } from '../types';

const base = (id: string, x: number, y: number, width: number, height: number) => ({ id, x, y, width, height, opacity: 1, rotation: 0 });
export function text(id: string, value: string, x: number, y: number, width: number, fontSize: number, fill: string, options: Partial<TextEl> = {}): TextEl {
  return { ...base(id, x, y, width, Math.ceil(fontSize * 1.32)), type: 'text', text: value, fill, fontSize, fontFamily: 'Inter', fontWeight: 'normal', align: 'left', lineHeight: 1.2, letterSpacing: 0, ...options };
}
export function shape(id: string, x: number, y: number, width: number, height: number, fill: string, options: Partial<ShapeEl> = {}): ShapeEl {
  return { ...base(id, x, y, width, height), type: 'rect', fill, stroke: fill, strokeWidth: 0, ...options };
}
export function photo(id: string, x: number, y: number, width: number, height: number, options: Partial<ImageEl> = {}): ImageEl {
  return { ...base(id, x, y, width, height), type: 'image', mask: 'rect', fit: 'cover', offsetX: 0, offsetY: 0, ...options };
}
export function svg(width: number, height: number, body: string) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`);
}
export const horizontal = { width: 1050, height: 600, physical: { w: 90, h: 50 }, updatedAt: 0 } satisfies Partial<Project>;
export const vertical = { width: 600, height: 1066, physical: { w: 54, h: 96 }, updatedAt: 0 } satisfies Partial<Project>;

export type Side = 'front' | 'back';
export interface Project {
  id: string;
  name: string;
  templateId: string;
  width: number;
  height: number;
  physical: { w: number; h: number };
  sides: { front: SideData; back?: SideData };
  updatedAt: number;
}
export interface SideData {
  background: { color: string; imageSrc?: string };
  elements: Element[];
}
export interface BaseEl {
  id: string;
  type: 'text' | 'image' | 'qrcode' | 'rect' | 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked?: boolean;
}
export interface TextEl extends BaseEl {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fill: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
}
export type ImageCrop = { x: number; y: number; width: number; height: number };
export type ImagePlacement = { x: number; y: number; width: number };

export interface ImageEl extends BaseEl {
  type: 'image';
  name?: string;
  src?: string;
  monochrome?: boolean;
  mask: 'rect' | 'rounded' | 'circle';
  radius?: number;
  fit: 'cover' | 'contain';
  offsetX: number;
  offsetY: number;
  crop?: ImageCrop;
  placement?: ImagePlacement;
  placeholderLabel?: string;
}
export interface QrEl extends BaseEl {
  type: 'qrcode';
  monochrome?: boolean;
  mode: 'upload' | 'generate';
  src?: string;
  content?: string;
  fg: string;
  bg: string;
  margin: number;
}
export interface ShapeEl extends BaseEl {
  type: 'rect' | 'ellipse';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
}
export type Element = TextEl | ImageEl | QrEl | ShapeEl;

import Konva from 'konva';
import { Group } from 'react-konva';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import type { Element, ImageEl, Project, QrEl, Side } from '../../types';
import { loadImage, monochromeImage } from '../../utils/image';
import { imagePlacement, sourceRect } from '../../utils/imageLayout';

const imageCache = new Map<string, Promise<HTMLImageElement>>();
type RenderAsset = HTMLImageElement | HTMLCanvasElement;
const monochromeCache = new WeakMap<HTMLImageElement, Map<boolean, HTMLCanvasElement>>();
export function cachedImage(src: string) {
  let promise = imageCache.get(src);
  if (!promise) {
    if (imageCache.size >= 32) imageCache.delete(imageCache.keys().next().value!);
    promise = loadImage(src);
    imageCache.set(src, promise);
  }
  return promise;
}

export async function elementImage(element: ImageEl | QrEl) {
  if (element.type === 'qrcode' && element.mode === 'generate') {
    if (!element.content) return undefined;
    const url = await QRCode.toDataURL(element.content, {
      width: 1024, margin: element.margin,
      color: element.monochrome ? { dark: '#000000', light: '#ffffff' } : { dark: element.fg, light: element.bg },
    });
    return cachedImage(url);
  }
  if (!element.src) return undefined;
  const image = await cachedImage(element.src);
  if (!element.monochrome) return image;
  const binary = element.type === 'qrcode';
  const variants = monochromeCache.get(image) ?? new Map<boolean, HTMLCanvasElement>();
  let variant = variants.get(binary);
  if (!variant) {
    variant = monochromeImage(image, binary);
    variants.set(binary, variant);
    monochromeCache.set(image, variants);
  }
  return variant;
}

export function useAsset(src?: string) {
  const [asset, setAsset] = useState<{ src: string; image?: HTMLImageElement }>();
  useEffect(() => {
    let active = true;
    if (src) cachedImage(src).then(image => { if (active) setAsset({ src, image }); }, () => { if (active) setAsset({ src }); });
    return () => { active = false; };
  }, [src]);
  return asset?.src === src ? asset?.image : undefined;
}

function clip(group: Konva.Group, element: ImageEl) {
  const { width, height, mask } = element;
  if (mask === 'rect') {
    group.clip({ x: 0, y: 0, width, height });
    return;
  }
  const radius = Math.max(0, Math.min(element.radius ?? 28, width / 2, height / 2));
  group.clipFunc(context => {
    context.beginPath();
    if (mask === 'circle') {
      const r = Math.min(width, height) / 2;
      context.arc(width / 2, height / 2, r, 0, Math.PI * 2);
    } else {
      context.moveTo(radius, 0);
      context.arcTo(width, 0, width, height, radius);
      context.arcTo(width, height, 0, height, radius);
      context.arcTo(0, height, 0, 0, radius);
      context.arcTo(0, 0, width, 0, radius);
    }
    context.closePath();
  });
}

type NodeOptions = { preview?: boolean; editing?: boolean; moveImage?: (placement: NonNullable<ImageEl['placement']>) => void; assetError?: boolean };

export function populate(group: Konva.Group, element: Element, asset?: RenderAsset, options: NodeOptions = {}) {
  const { width, height } = element;
  if (element.type === 'text') {
    group.add(new Konva.Text({
      width, height, text: options.editing ? '' : element.text, fontFamily: element.fontFamily,
      fontSize: element.fontSize, fontStyle: element.fontWeight, fill: element.fill,
      align: element.align, lineHeight: element.lineHeight, letterSpacing: element.letterSpacing,
    }));
    return;
  }
  if (element.type === 'rect') {
    group.add(new Konva.Rect({ width, height, fill: element.fill, stroke: element.stroke, strokeWidth: element.strokeWidth, cornerRadius: Math.max(0, Math.min(width / 2, height / 2, element.cornerRadius ?? 0)) }));
    return;
  }
  if (element.type === 'ellipse') {
    group.add(new Konva.Ellipse({ x: width / 2, y: height / 2, radiusX: width / 2, radiusY: height / 2, fill: element.fill, stroke: element.stroke, strokeWidth: element.strokeWidth }));
    return;
  }
  if (element.type !== 'image' && element.type !== 'qrcode') return;
  if (!asset && !options.preview) return;
  const frame = new Konva.Group();
  if (element.type === 'image') clip(frame, element);
  group.add(frame);
  if (!asset) {
    const label = options.assetError ? '无法读取' : element.type === 'qrcode' ? '上传或生成二维码' : element.placeholderLabel ?? '点击上传';
    frame.add(new Konva.Rect({ width, height, fill: '#dce3f2', opacity: 0.93 }));
    frame.add(new Konva.Rect({ x: 3, y: 3, width: Math.max(0, width - 6), height: Math.max(0, height - 6), stroke: '#8c9ab9', strokeWidth: 2, dash: [7, 5] }));
    frame.add(new Konva.Text({ width, height, text: label, fill: '#435071', align: 'center', verticalAlign: 'middle', fontSize: Math.max(8, Math.min(22, width / 8, height / 4)), padding: 3 }));
    return;
  }
  if (element.type === 'image') {
    const crop = sourceRect(element, asset);
    const placement = imagePlacement(element, asset);
    const fit = element.fit === 'cover' ? Math.max : Math.min;
    const height = element.placement ? placement.width * crop.height / crop.width
      : crop.height * fit(width / crop.width, element.height / crop.height);
    const node = new Konva.Image({
      image: asset, crop: element.crop ? crop : undefined, ...placement, height, draggable: !!options.moveImage,
    });
    node.on('dragend', () => options.moveImage?.({ ...placement, x: node.x(), y: node.y() }));
    frame.add(node);
  } else {
    const scale = Math.min(width / asset.width, height / asset.height);
    const w = asset.width * scale;
    const h = asset.height * scale;
    frame.add(new Konva.Image({ image: asset, width: w, height: h, x: (width - w) / 2, y: (height - h) / 2, imageSmoothingEnabled: false }));
  }
}

interface RendererProps {
  element: Element;
  onSelect: (multiple: boolean) => void;
  onActivate: () => void;
  onUpdate: (patch: Partial<Element>) => void;
  register: (id: string, node: Konva.Group | null) => void;
  editing: boolean;
  positioning: boolean;
  onDrag: (node: Konva.Group, altKey: boolean) => void;
  onDrop: () => void;
}

export function ElementRenderer({ element, onSelect, onActivate, onUpdate, register, editing, positioning, onDrag, onDrop }: RendererProps) {
  const wrapper = useRef<Konva.Group | null>(null);
  const content = useRef<Konva.Group>(null);
  const [state, setState] = useState<{ key: string; monochrome: boolean; image?: RenderAsset; error?: boolean }>();
  const assetKey = element.type === 'image' ? element.src : element.type === 'qrcode' ? JSON.stringify([element.mode, element.mode === 'upload' ? element.src : [element.content, element.fg, element.bg, element.margin]]) : undefined;
  const monochrome = (element.type === 'image' || element.type === 'qrcode') && !!element.monochrome;

  useEffect(() => {
    let active = true;
    if (assetKey && (element.type === 'image' || element.type === 'qrcode')) {
      elementImage(element).then(
        image => { if (active) setState({ key: assetKey, monochrome, image }); },
        () => { if (active) setState({ key: assetKey, monochrome, error: true }); },
      );
    }
    return () => { active = false; };
  }, [assetKey, monochrome]);
  const asset = state?.key === assetKey && state?.monochrome === monochrome ? state : undefined;
  const updateRef = useRef(onUpdate);
  updateRef.current = onUpdate;
  useLayoutEffect(() => {
    const group = content.current!;
    group.destroyChildren();
    // The transparent hit area also defines the transform bounds for masked images.
    group.add(new Konva.Rect({ width: element.width, height: element.height, fill: 'transparent' }));
    populate(group, element, asset?.image, {
      preview: true, editing, assetError: asset?.error,
      moveImage: positioning ? placement => updateRef.current({ placement }) : undefined,
    });
    group.getLayer()?.batchDraw();
  }, [element, asset, editing, positioning]);

  return <Group
    ref={node => { wrapper.current = node; register(element.id, node); }}
    x={element.x} y={element.y} rotation={element.rotation} opacity={element.opacity}
    draggable={!element.locked && !positioning && !editing}
    onPointerDown={event => { event.cancelBubble = true; onSelect(event.evt.shiftKey); }}
    onClick={event => {
      if (!event.evt.shiftKey && element.type === 'image' && !element.src && !element.locked) onActivate();
    }}
    onTap={() => {
      if (element.type === 'image' && !element.src && !element.locked) onActivate();
    }}
    onDblClick={() => { if (!positioning && (element.type !== 'image' || element.src)) onActivate(); }}
    onDblTap={() => { if (!positioning && (element.type !== 'image' || element.src)) onActivate(); }}
    onDragMove={event => {
      if (event.target === wrapper.current) onDrag(wrapper.current, !!event.evt.altKey);
    }}
    onDragEnd={event => {
      if (event.target !== wrapper.current) return;
      onDrop();
      onUpdate({ x: event.target.x(), y: event.target.y() });
    }}
    onTransformEnd={() => {
      const node = wrapper.current!;
      const sx = node.scaleX();
      const sy = node.scaleY();
      node.scale({ x: 1, y: 1 });
      const width = Math.max(8, element.width * sx);
      const height = element.type === 'qrcode' ? width : Math.max(8, element.height * sy);
      const text = element.type === 'text' ? { fontSize: Math.max(4, element.fontSize * sy) } : {};
      onUpdate({ x: node.x(), y: node.y(), rotation: node.rotation(), width, height, ...text });
    }}
    onMouseEnter={event => { event.target.getStage()!.container().style.cursor = element.locked ? 'default' : positioning ? 'grab' : 'move'; }}
    onMouseLeave={event => { event.target.getStage()!.container().style.cursor = 'default'; }}
  >
    <Group ref={content} />
  </Group>;
}

export async function loadCardFonts(project: Project, side: Side) {
  const elements = project.sides[side]!.elements;
  await Promise.allSettled(elements.map(element => element.type === 'text'
    ? document.fonts.load(`${element.fontWeight} ${element.fontSize}px "${element.fontFamily}"`, element.text)
    : undefined));
}

export async function renderCard(project: Project, side: Side, pixelRatio: number, preview = false) {
  const { width, height } = project;
  const data = project.sides[side]!;
  const [background, images] = await Promise.all([
    data.background.imageSrc ? cachedImage(data.background.imageSrc) : undefined,
    Promise.all(data.elements.map(async element => {
      if (element.type !== 'image' && element.type !== 'qrcode') return undefined;
      try {
        return await elementImage(element);
      } catch {
        if (!preview) throw new Error(element.type === 'qrcode' ? '二维码无法生成，请检查二维码内容或图片后重试。' : '有图片无法读取，请替换后重试。');
        return undefined;
      }
    })),
    loadCardFonts(project, side),
  ]);
  const stage = new Konva.Stage({ container: document.createElement('div'), width, height });
  try {
    const layer = new Konva.Layer({ listening: false });
    stage.add(layer);
    layer.add(new Konva.Rect({ width, height, fill: data.background.color }));
    if (background) layer.add(new Konva.Image({ image: background, width, height }));
    data.elements.forEach((element, index) => {
      const group = new Konva.Group({ x: element.x, y: element.y, rotation: element.rotation, opacity: element.opacity });
      populate(group, element, images[index], { preview });
      layer.add(group);
    });
    return stage.toDataURL({ pixelRatio });
  } finally {
    stage.destroy();
  }
}

import type { ImageCrop, ImageEl, ImagePlacement } from '../types';

export const wholeImage: ImageCrop = { x: 0, y: 0, width: 1, height: 1 };
type Dimensions = { width: number; height: number };
export type ImageFrame = Pick<ImageEl, 'x' | 'y' | 'width' | 'height' | 'rotation'>;

export function sourceRect(image: ImageEl, source: Dimensions) {
  const crop = image.crop ?? wholeImage;
  return { x: crop.x * source.width, y: crop.y * source.height, width: crop.width * source.width, height: crop.height * source.height };
}

export function imagePlacement(image: ImageEl, source: Dimensions): ImagePlacement {
  if (image.placement) return image.placement;
  const crop = sourceRect(image, source);
  const fit = image.fit === 'cover' ? Math.max : Math.min;
  const scale = fit(image.width / crop.width, image.height / crop.height);
  const width = crop.width * scale;
  const height = crop.height * scale;
  const x = (image.width - width) / 2;
  const y = (image.height - height) / 2;
  const offset = (center: number, value: number) => {
    const overflow = Math.max(0, -center);
    return Math.min(center + overflow, Math.max(center - overflow, center + value));
  };
  return image.fit === 'cover'
    ? { width, x: offset(x, image.offsetX), y: offset(y, image.offsetY) }
    : { width, x, y };
}

export function resizeImageFrame(image: ImageEl, source: Dimensions, frame: ImageFrame): Partial<ImageEl> {
  if (image.width === frame.width && image.height === frame.height) return frame;
  const placement = imagePlacement(image, source);
  const angle = image.rotation * Math.PI / 180;
  const dx = frame.x - image.x;
  const dy = frame.y - image.y;
  return {
    ...frame,
    placement: {
      ...placement,
      x: placement.x - dx * Math.cos(angle) - dy * Math.sin(angle),
      y: placement.y + dx * Math.sin(angle) - dy * Math.cos(angle),
    },
  };
}

export function cropImage(image: ImageEl, source: Dimensions, crop: ImageCrop): Partial<ImageEl> {
  const before = sourceRect(image, source);
  const after = sourceRect({ ...image, crop }, source);
  const placement = imagePlacement(image, source);
  const scale = placement.width / before.width;
  return {
    crop,
    placement: {
      x: placement.x + (after.x - before.x) * scale,
      y: placement.y + (after.y - before.y) * scale,
      width: after.width * scale,
    },
  };
}

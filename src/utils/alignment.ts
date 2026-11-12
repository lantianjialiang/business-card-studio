import type { BaseEl } from '../types';

type Bounds = { x: number; y: number; width: number; height: number };
export type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export function elementBounds(element: BaseEl, position: Pick<BaseEl, 'x' | 'y'> = element): Bounds {
  const angle = element.rotation * Math.PI / 180;
  const x = element.width * Math.cos(angle);
  const y = element.width * Math.sin(angle);
  const right = -element.height * Math.sin(angle);
  const bottom = element.height * Math.cos(angle);
  return {
    x: position.x + Math.min(0, x) + Math.min(0, right),
    y: position.y + Math.min(0, y) + Math.min(0, bottom),
    width: Math.abs(x) + Math.abs(right),
    height: Math.abs(y) + Math.abs(bottom),
  };
}

export function alignElement(element: BaseEl, target: Bounds, alignment: Alignment) {
  const bounds = elementBounds(element);
  switch (alignment) {
    case 'left': return { x: element.x + target.x - bounds.x };
    case 'center': return { x: element.x + target.x - bounds.x + (target.width - bounds.width) / 2 };
    case 'right': return { x: element.x + target.x - bounds.x + target.width - bounds.width };
    case 'top': return { y: element.y + target.y - bounds.y };
    case 'middle': return { y: element.y + target.y - bounds.y + (target.height - bounds.height) / 2 };
    case 'bottom': return { y: element.y + target.y - bounds.y + target.height - bounds.height };
  }
}

export function distributeElements(elements: BaseEl[], axis: 'x' | 'y') {
  const size = axis === 'x' ? 'width' : 'height';
  const items = elements.map(element => ({ element, bounds: elementBounds(element) }))
    .sort((a, b) => a.bounds[axis] - b.bounds[axis]);
  const positions = new Map<string, { x?: number; y?: number }>();
  if (items.length < 3) return positions;
  const first = items[0].bounds;
  const last = items[items.length - 1].bounds;
  const total = items.reduce((sum, item) => sum + item.bounds[size], 0);
  const gap = (last[axis] + last[size] - first[axis] - total) / (items.length - 1);
  let cursor = first[axis] + first[size] + gap;
  for (const { element, bounds } of items.slice(1, -1)) {
    positions.set(element.id, { [axis]: element[axis] + cursor - bounds[axis] });
    cursor += bounds[size] + gap;
  }
  return positions;
}

function anchors(bounds: Bounds, axis: 'x' | 'y') {
  const start = bounds[axis];
  const length = axis === 'x' ? bounds.width : bounds.height;
  return [start, start + length / 2, start + length];
}

export function snapAxis(bounds: Bounds, targets: Bounds[], axis: 'x' | 'y', threshold: number) {
  let match: { guide: number; delta: number } | undefined;
  for (const anchor of anchors(bounds, axis)) {
    for (const target of targets) {
      for (const guide of anchors(target, axis)) {
        const delta = guide - anchor;
        if (Math.abs(delta) <= threshold && (!match || Math.abs(delta) < Math.abs(match.delta))) match = { guide, delta };
      }
    }
  }
  return match;
}

import { create } from 'zustand';
import type { Element, Project, Side, SideData } from '../types';
import { baseElement } from './projectsStore';
import { id } from '../utils/id';

type LayerMove = 'up' | 'down' | 'top' | 'bottom';
interface EditorStore {
  project: Project | null;
  side: Side;
  selected: string | null;
  selectedIds: string[];
  past: Project[];
  future: Project[];
  init: (project: Project) => void;
  select: (selected: string | null, multiple?: boolean) => void;
  switchSide: (side: Side) => void;
  commit: (update: (project: Project) => Project) => void;
  editSide: (update: (side: SideData) => SideData) => void;
  update: (id: string, patch: Partial<Element>) => void;
  add: (type: Element['type']) => void;
  remove: () => void;
  duplicate: () => void;
  layer: (move: LayerMove) => void;
  undo: () => void;
  redo: () => void;
}

function makeElement(type: Element['type'], project: Project): Element {
  const size = { text: [360, 105], image: [220, 170], qrcode: [140, 140], rect: [220, 130], ellipse: [160, 160] }[type];
  const [w, h] = size;
  const base = baseElement(type, w, h, (project.width - w) / 2, (project.height - h) / 2);
  switch (type) {
    case 'text': return { ...base, type, text: '输入文字', fontFamily: 'Inter', fontSize: 42, fontWeight: 'normal', fill: '#27243b', align: 'left', lineHeight: 1.2, letterSpacing: 0 };
    case 'image': return { ...base, type, mask: 'rect', fit: 'cover', offsetX: 0, offsetY: 0 };
    case 'qrcode': return { ...base, type, mode: 'generate', fg: '#141414', bg: '#ffffff', margin: 2 };
    default: return { ...base, type, fill: '#a895ef', stroke: '#7654dd', strokeWidth: 0, cornerRadius: 0 };
  }
}

export const useEditor = create<EditorStore>((set, get) => ({
  project: null, side: 'front', selected: null, selectedIds: [], past: [], future: [],
  init: project => set({ project, side: 'front', selected: null, selectedIds: [], past: [], future: [] }),
  select: (id, multiple) => {
    const current = get().selectedIds;
    const selectedIds = !id ? [] : !multiple ? [id] : current.includes(id) ? current.filter(item => item !== id) : [...current, id];
    set({ selectedIds, selected: selectedIds.at(-1) ?? null });
  },
  switchSide: side => set({ side, selected: null, selectedIds: [] }),
  commit: update => {
    const { project, past } = get();
    if (!project) return;
    const next = update(project);
    if (next === project) return;
    set({ project: { ...next, updatedAt: Date.now() }, past: [...past, project].slice(-50), future: [] });
  },
  editSide: update => {
    const { side, commit } = get();
    commit(project => {
      const current = project.sides[side]!;
      const next = update(current);
      return next === current ? project : { ...project, sides: { ...project.sides, [side]: next } };
    });
  },
  update: (elementId, patch) => get().editSide(side => {
    const element = side.elements.find(item => item.id === elementId);
    if (!element || Object.entries(patch).every(([key, value]) => element[key as keyof Element] === value)) return side;
    return { ...side, elements: side.elements.map(item => item.id === elementId ? { ...item, ...patch } as Element : item) };
  }),
  add: type => {
    const { project, editSide } = get();
    if (!project) return;
    const element = makeElement(type, project);
    editSide(side => ({ ...side, elements: [...side.elements, element] }));
    get().select(element.id);
  },
  remove: () => {
    const { selected, editSide } = get();
    editSide(side => {
      const elements = side.elements.filter(item => item.id !== selected || item.locked);
      return elements.length === side.elements.length ? side : { ...side, elements };
    });
    if (!currentElement(get())) get().select(null);
  },
  duplicate: () => {
    const element = currentElement(get());
    if (!element) return;
    const copy = { ...element, id: id(), x: element.x + 16, y: element.y + 16, locked: false };
    get().editSide(side => ({ ...side, elements: [...side.elements, copy] }));
    get().select(copy.id);
  },
  layer: move => get().editSide(side => {
    const index = side.elements.findIndex(item => item.id === get().selected && !item.locked);
    if (index === -1) return side;
    const last = side.elements.length - 1;
    const target = { up: Math.min(last, index + 1), down: Math.max(0, index - 1), top: last, bottom: 0 }[move];
    if (target === index) return side;
    const elements = [...side.elements];
    const [element] = elements.splice(index, 1);
    elements.splice(target, 0, element);
    return { ...side, elements };
  }),
  undo: () => {
    const { past, project, future, side, selectedIds } = get();
    const previous = past.at(-1);
    if (!previous || !project) return;
    const remaining = selectedIds.filter(id => previous.sides[side]?.elements.some(item => item.id === id));
    set({ project: { ...previous, updatedAt: Date.now() }, selected: remaining.at(-1) ?? null, selectedIds: remaining, past: past.slice(0, -1), future: [project, ...future] });
  },
  redo: () => {
    const { past, project, future, side, selectedIds } = get();
    const next = future[0];
    if (!next || !project) return;
    const remaining = selectedIds.filter(id => next.sides[side]?.elements.some(item => item.id === id));
    set({ project: { ...next, updatedAt: Date.now() }, selected: remaining.at(-1) ?? null, selectedIds: remaining, past: [...past, project].slice(-50), future: future.slice(1) });
  },
}));

export function currentElement(state: EditorStore) {
  return state.project?.sides[state.side]?.elements.find(item => item.id === state.selected);
}

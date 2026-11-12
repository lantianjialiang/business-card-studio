import { create } from 'zustand';
import type { BaseEl, Project, SideData } from '../types';
import { id } from '../utils/id';
import { downloadFile } from '../utils/image';

const KEY = 'cardmaker:projects';
const TEMPLATE_KEY = 'cardmaker:templates';
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const positive = (value: unknown) => number(value) && value > 0;
const string = (value: unknown): value is string => typeof value === 'string';
const color = (value: unknown) => string(value) && /^#[\da-f]{6}$/i.test(value);
const image = (value: unknown) => value === undefined || (string(value) && /^data:image\/(?:png|jpe?g|webp|svg\+xml)[;,]/i.test(value));

function validSide(side?: SideData) {
  if (!side || !color(side.background?.color) || !image(side.background.imageSrc) || !Array.isArray(side.elements)) return false;
  const ids = new Set<string>();
  return side.elements.every(element => {
    if (!element || !string(element.id) || ids.has(element.id) || ![element.x, element.y, element.rotation, element.opacity].every(number)
        || !positive(element.width) || !positive(element.height) || element.opacity < 0 || element.opacity > 1
        || (element.locked !== undefined && typeof element.locked !== 'boolean')) return false;
    ids.add(element.id);
    switch (element.type) {
      case 'text': return string(element.text) && string(element.fontFamily) && positive(element.fontSize) && color(element.fill)
        && ['normal', 'bold'].includes(element.fontWeight) && ['left', 'center', 'right'].includes(element.align)
        && positive(element.lineHeight) && number(element.letterSpacing);
      case 'image': return image(element.src) && ['rect', 'rounded', 'circle'].includes(element.mask)
        && (element.name === undefined || string(element.name))
        && (element.monochrome === undefined || typeof element.monochrome === 'boolean')
        && ['cover', 'contain'].includes(element.fit) && number(element.offsetX) && number(element.offsetY)
        && (element.placement === undefined || (!!element.placement && number(element.placement.x)
          && number(element.placement.y) && positive(element.placement.width)))
        && (element.crop === undefined || (!!element.crop && number(element.crop.x) && number(element.crop.y)
          && positive(element.crop.width) && positive(element.crop.height) && element.crop.x >= 0 && element.crop.y >= 0
          && element.crop.x + element.crop.width <= 1.000000001 && element.crop.y + element.crop.height <= 1.000000001))
        && (element.radius === undefined || number(element.radius)) && (element.placeholderLabel === undefined || string(element.placeholderLabel));
      case 'qrcode': return image(element.src) && ['upload', 'generate'].includes(element.mode) && color(element.fg)
        && (element.monochrome === undefined || typeof element.monochrome === 'boolean')
        && color(element.bg) && number(element.margin) && element.margin >= 0 && element.margin <= 20
        && (element.content === undefined || string(element.content));
      case 'rect':
      case 'ellipse': return color(element.fill) && color(element.stroke) && number(element.strokeWidth) && element.strokeWidth >= 0
        && (element.cornerRadius === undefined || number(element.cornerRadius));
      default: return false;
    }
  });
}

function validProject(project: Project) {
  return project && string(project.id) && string(project.name) && string(project.templateId) && number(project.updatedAt)
    && positive(project.width) && project.width <= 3000 && positive(project.height) && project.height <= 3000
    && positive(project.physical?.w) && positive(project.physical?.h)
    && validSide(project.sides?.front) && (project.sides.back === undefined || validSide(project.sides.back));
}

function readProjects(key = KEY): Project[] {
  try {
    const data = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(data) ? data.filter(validProject) : [];
  } catch {
    return [];
  }
}

function persist(projects: Project[], key = KEY) {
  try {
    localStorage.setItem(key, JSON.stringify(projects));
  } catch {
    throw new Error('浏览器无法保存此项目。请导出项目 JSON 备份，或删除不再使用的项目释放空间。');
  }
}

type ProjectsStore = {
  projects: Project[];
  personalTemplates: Project[];
  saveTemplate: (project: Project) => void;
  removeTemplate: (templateId: string) => void;
  save: (project: Project) => void;
  remove: (projectId: string) => void;
  copy: (project: Project, name?: string) => Project;
  importProject: (file: File) => Promise<Project>;
};

export const useProjects = create<ProjectsStore>((set, get) => ({
  projects: readProjects(),
  personalTemplates: readProjects(TEMPLATE_KEY),
  saveTemplate: project => {
    const template = { ...structuredClone(project), id: id(), name: project.name.trim() || '未命名模板', updatedAt: Date.now() };
    const personalTemplates = [template, ...readProjects(TEMPLATE_KEY)];
    persist(personalTemplates, TEMPLATE_KEY);
    set({ personalTemplates });
  },
  removeTemplate: templateId => {
    const personalTemplates = readProjects(TEMPLATE_KEY).filter(template => template.id !== templateId);
    persist(personalTemplates, TEMPLATE_KEY);
    set({ personalTemplates });
  },
  save: project => {
    const projects = [project, ...readProjects().filter(item => item.id !== project.id)];
    persist(projects);
    set({ projects });
  },
  remove: projectId => {
    const projects = readProjects().filter(item => item.id !== projectId);
    persist(projects);
    set({ projects });
  },
  copy: (project, name = `${project.name} 副本`) => {
    const copy = { ...structuredClone(project), id: id(), name, updatedAt: Date.now() };
    get().save(copy);
    return copy;
  },
  importProject: async file => {
    let project: Project;
    try {
      project = JSON.parse(await file.text());
      if (!validProject(project)) throw new Error();
    } catch {
      throw new Error('项目格式无效，请选择从印记导出的项目 JSON。');
    }
    return get().copy(project, project.name);
  },
}));

window.addEventListener('storage', event => {
  if (event.key === KEY || event.key === null) useProjects.setState({ projects: readProjects() });
  if (event.key === TEMPLATE_KEY || event.key === null) useProjects.setState({ personalTemplates: readProjects(TEMPLATE_KEY) });
});

export function exportProject(project: Project) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }));
  downloadFile(url, `${project.name || '未命名名片'}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function baseElement(type: BaseEl['type'], width: number, height: number, x: number, y: number): BaseEl {
  return { id: id(), type, x, y, width, height, rotation: 0, opacity: 1 };
}

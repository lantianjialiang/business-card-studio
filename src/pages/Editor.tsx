import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CircleAlert, Monitor, X } from 'lucide-react';
import { currentElement, useEditor } from '../store/editorStore';
import { useProjects } from '../store/projectsStore';
import type { Element, Project, Side } from '../types';
import { readImage } from '../utils/image';
import TopBar from '../components/TopBar';
import LeftPanel from '../components/panels/LeftPanel';
import PropsPanel from '../components/panels/PropsPanel';
import CardCanvas from '../components/canvas/CardCanvas';
import ExportDialog from '../components/ExportDialog';
import CropDialog from '../components/CropDialog';
import { ColorSampler } from '../components/panels/Fields';
import { cropImage, wholeImage } from '../utils/imageLayout';

export default function Editor() {
  const { projectId } = useParams();
  const saved = useProjects(state => state.projects.find(project => project.id === projectId));
  const project = useEditor(state => state.project);
  useLayoutEffect(() => {
    if (saved) useEditor.getState().init(saved);
  }, [projectId]);
  if (!saved || !project || project.id !== projectId) return <main className="not-found"><h1>找不到这份名片</h1><p>请在保存项目时使用的浏览器中打开，或导入项目 JSON。</p><Link className="primary" to="/">返回模板库</Link></main>;
  return <EditorSession key={project.id} project={project} initial={saved} />;
}

function EditorSession({ project, initial }: { project: Project; initial: Project }) {
  const editor = useEditor();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(initial);
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const [positioning, setPositioning] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [sample, setSample] = useState<{ apply: (color: string) => void }>();
  const [hideMobile, setHideMobile] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ projectId: string; side: Side; id: string }>();
  const latest = useRef({ project, saved });
  latest.current = { project, saved };
  const element = currentElement(editor);
  const image = element?.type === 'image' && element.src && !element.locked ? element : undefined;
  const status = project === saved ? 'saved' : saveError ? 'error' : 'saving';

  useEffect(() => {
    setPositioning(false);
    setCropping(false);
    setSample(undefined);
  }, [editor.selected, editor.side]);

  function save(next: Project) {
    try {
      useProjects.getState().save(next);
      latest.current.saved = next;
      setSaved(next);
      setSaveError('');
      return true;
    } catch (error) {
      setSaveError((error as Error).message);
      return false;
    }
  }

  useEffect(() => {
    if (project === saved) return;
    setSaveError('');
    const timer = window.setTimeout(() => save(project), 1000);
    return () => window.clearTimeout(timer);
  }, [project, saved]);

  useEffect(() => {
    const flush = () => {
      const { project: pending, saved: committed } = latest.current;
      if (pending === committed) return;
      try { useProjects.getState().save(pending); latest.current.saved = pending; }
      catch { /* The editor presents the error when autosave runs. */ }
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  useEffect(() => {
    if (exporting || cropping) return;
    const keydown = (event: KeyboardEvent) => {
      if (sample) {
        if (event.key === 'Escape') { event.preventDefault(); setSample(undefined); }
        return;
      }
      if (event.isComposing || (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]'))) return;
      const state = useEditor.getState();
      const selected = currentElement(state);
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) state.redo(); else state.undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === 'd' && selected) {
        event.preventDefault();
        if (state.selectedIds.length === 1) state.duplicate();
        return;
      }
      if (key === 'escape') {
        if (positioning) setPositioning(false); else state.select(null);
      }
      if (state.selectedIds.length > 1) return;
      if (!selected || selected.locked) return;
      if (key === 'delete' || key === 'backspace') {
        event.preventDefault();
        state.remove();
      }
      const delta = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[key];
      if (delta && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        state.update(selected.id, { x: selected.x + delta[0] * step, y: selected.y + delta[1] * step });
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [exporting, cropping, positioning, sample]);

  function upload(target: Element) {
    uploadTarget.current = { projectId: project.id, side: editor.side, id: target.id };
    input.current?.click();
  }
  async function load(file?: File) {
    const target = uploadTarget.current;
    if (!file || !target) return;
    setMessage('');
    try {
      const src = await readImage(file);
      const state = useEditor.getState();
      if (state.project?.id !== target.projectId || uploadTarget.current !== target) return;
      state.commit(current => {
        const data = current.sides[target.side]!;
        const element = data.elements.find(item => item.id === target.id);
        if (!element || element.locked) return current;
        const elements = data.elements.map(item => {
          if (item.id !== target.id || item.locked) return item;
          if (item.type === 'image') return { ...item, src, name: item.name?.trim() ? item.name : file.name.replace(/\.[^.]+$/, ''), crop: undefined, placement: undefined, offsetX: 0, offsetY: 0 };
          if (item.type === 'qrcode') return { ...item, src, mode: 'upload' as const };
          return item;
        });
        return { ...current, sides: { ...current.sides, [target.side]: { ...data, elements } } };
      });
    } catch (error) { setMessage((error as Error).message); }
  }

  return <main className="editor">
    <TopBar project={project} status={status} back={() => { if (project === saved || save(project)) navigate('/?view=designs'); }} openExport={() => { setSample(undefined); setExporting(true); }} />
    {!hideMobile && <div className="mobile-hint"><Monitor size={15} />建议使用电脑编辑<button aria-label="关闭提示" onClick={() => setHideMobile(true)}><X size={15} /></button></div>}
    {(message || saveError) && <div className="editor-alert" role="alert"><CircleAlert size={17} />{message || saveError}{message && <button className="icon-button" aria-label="关闭错误提示" onClick={() => setMessage('')}><X size={16} /></button>}</div>}
    <div className="editor-grid">
      <LeftPanel />
      <CardCanvas project={project} side={editor.side} selected={editor.selected} selectedIds={editor.selectedIds} positioning={positioning ? image?.id ?? null : null}
        cancelSample={() => setSample(undefined)} onSample={sample ? color => {
          setSample(undefined);
          if (color) { sample.apply(color); setMessage(''); }
          else setMessage('无法读取这一点的颜色，请在画布上重新取色。');
        } : undefined} onSelect={editor.select}
        onUpdate={editor.update} onActivate={target => {
          if (target.type === 'image' && target.src) setCropping(true);
          else if (target.type === 'image' || (target.type === 'qrcode' && target.mode === 'upload')) upload(target);
        }} />
      <ColorSampler.Provider value={apply => setSample({ apply })}>
        <PropsPanel openCrop={() => setCropping(true)} positioning={positioning} togglePosition={() => setPositioning(value => !value)} upload={upload} />
      </ColorSampler.Provider>
    </div>
    <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
      void load(event.target.files?.[0]);
      event.target.value = '';
    }} />
    {exporting && <ExportDialog project={project} side={editor.side} close={() => setExporting(false)} />}
    {cropping && image && <CropDialog image={image} close={() => setCropping(false)} apply={(crop, source) => {
      const previous = image.crop ?? wholeImage;
      if (crop.x !== previous.x || crop.y !== previous.y || crop.width !== previous.width || crop.height !== previous.height) {
        editor.update(image.id, cropImage(image, { width: source.naturalWidth, height: source.naturalHeight }, crop));
      }
      setCropping(false);
    }} />}
  </main>;
}

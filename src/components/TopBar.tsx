import { ArrowLeft, Check, Download, FileJson, LoaderCircle, Redo2, Undo2 } from 'lucide-react';
import type { Project } from '../types';
import { exportProject } from '../store/projectsStore';
import { useEditor } from '../store/editorStore';

export default function TopBar({ project, status, back, openExport }: {
  project: Project; status: 'saved' | 'saving' | 'error'; back: () => void; openExport: () => void;
}) {
  const { commit, undo, redo, past, future } = useEditor();
  return <header className="editor-top">
    <button className="icon-button" aria-label="返回首页" title="返回首页" onClick={back}><ArrowLeft size={19} /></button>
    <span className="top-separator" />
    <input className="project-name" aria-label="项目名称" value={project.name} placeholder="未命名名片" maxLength={100}
      onChange={event => commit(data => ({ ...data, name: event.target.value }))} />
    <div className={`save-status ${status}`} role="status">
      {status === 'saved' && <Check size={14} />}
      {status === 'saving' && <LoaderCircle size={14} className="spin" />}
      <span>{{ saved: '已保存', saving: '保存中', error: '保存失败' }[status]}</span>
    </div>
    <div className="history-tools">
      <button className="icon-button" aria-label="撤销" title="撤销 (Ctrl / ⌘ + Z)" disabled={!past.length} onClick={undo}><Undo2 size={19} /></button>
      <button className="icon-button" aria-label="重做" title="重做 (Ctrl / ⌘ + Shift + Z)" disabled={!future.length} onClick={redo}><Redo2 size={19} /></button>
    </div>
    <div className="top-actions">
      <button className="secondary json-button" title="导出项目 JSON" onClick={() => exportProject(project)}><FileJson size={16} /><span>项目 JSON</span></button>
      <button className="primary" onClick={openExport}><Download size={16} />导出</button>
    </div>
  </header>;
}

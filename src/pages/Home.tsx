import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, BadgeCheck, CircleAlert, Copy, CreditCard, FileJson, FolderOpen, Grid2X2, Layers2, LockKeyhole, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react';
import TemplateCard, { CardPreview } from '../components/TemplateCard';
import { exportProject, useProjects } from '../store/projectsStore';
import { templates } from '../templates';
import type { Project } from '../types';

function Brand() {
  return <Link className="brand" to="/" aria-label="印记首页"><span className="brand-mark"><CreditCard size={21} strokeWidth={2.1} /></span><span>印记<small>名片工作室</small></span></Link>;
}

export default function Home() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const designs = params.get('view') === 'designs';
  const { projects, personalTemplates, saveTemplate, removeTemplate, copy, remove, importProject } = useProjects();
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState<'all' | 'horizontal' | 'vertical'>('all');
  const [deleting, setDeleting] = useState<{ project: Project; template?: boolean }>();
  const file = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLElement>(null);
  const open = (project: Project) => navigate(`/editor/${project.id}`);
  const run = (operation: () => void) => {
    try { setNotice(''); operation(); }
    catch (error) { setNotice((error as Error).message); }
  };
  const selectView = (view: 'templates' | 'designs') => {
    setParams(view === 'designs' ? { view } : {});
    setNotice('');
  };
  const library = [
    ...personalTemplates.map(project => ({ project, label: '我的模板', theme: 'neutral', description: '从你的设计保存', personal: true })),
    ...templates.map(template => ({ ...template, personal: false })),
  ];
  const visible = library.filter(({ project }) => filter === 'all' || (filter === 'horizontal') === (project.width > project.height));

  return <div className="home">
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />
        <nav className="main-nav" aria-label="主导航">
          <button className={!designs ? 'active' : ''} aria-current={!designs ? 'page' : undefined} onClick={() => selectView('templates')}><Grid2X2 size={15} />模板库</button>
          <button className={designs ? 'active' : ''} aria-current={designs ? 'page' : undefined} onClick={() => selectView('designs')}><FolderOpen size={16} />我的设计{projects.length > 0 && <small>{projects.length}</small>}</button>
        </nav>
        <button className="secondary import-button" aria-label="导入项目" onClick={() => file.current?.click()}><Upload size={16} /><span>导入项目</span></button>
        <input ref={file} type="file" hidden accept=".json,application/json" onChange={async event => {
          const selected = event.target.files?.[0];
          event.target.value = '';
          if (!selected) return;
          try { open(await importProject(selected)); } catch (error) { setNotice((error as Error).message); }
        }} />
      </div>
    </header>
    <main className="home-container">
      {notice && <div className="home-alert" role="alert"><CircleAlert size={17} />{notice}<button className="icon-button" aria-label="关闭提示" onClick={() => setNotice('')}><X size={16} /></button></div>}
      {!designs ? <>
        <section className="hero">
          <div className="hero-content">
            <div className="hero-kicker"><Sparkles size={14} /> 独立名片设计工具</div>
            <h1>一张名片，<br /><em>一个好开场。</em></h1>
            <p>从喜欢的模板出发，换上自己的文字、照片和二维码，<br className="hero-break" />做一张见面时想递出去的名片。</p>
            <div className="hero-actions">
              <button className="primary" onClick={() => gallery.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>挑选模板 <ArrowDown size={16} /></button>
              <button className="quiet" onClick={() => selectView('designs')}>我的设计 <ArrowRight size={16} /></button>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-gridlines" />
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <span className="art-coordinate coord-top">FIG. 01 <i /> CARD STUDIO</span>
            <Sparkles className="art-spark spark-one" size={37} strokeWidth={1.1} />
            <Sparkles className="art-spark spark-two" size={22} strokeWidth={1.25} />
            <CardPreview project={templates[2].project} className="hero-card hero-card-back" />
            <CardPreview project={templates[0].project} className="hero-card hero-card-front" />
            <span className="art-coordinate coord-bottom"><i /> 90 × 50 MM</span>
          </div>
        </section>
        <section ref={gallery} className="gallery" aria-labelledby="gallery-title">
          <div className="section-heading">
            <div><div className="eyebrow"><span /> TEMPLATE LIBRARY</div><h2 id="gallery-title">模板库 <small>{library.length} 款</small></h2><p>选一款模板，新建可编辑的名片。</p></div>
            <div className="segmented filters" aria-label="模板方向">
              {([['all', '全部'], ['horizontal', '横版'], ['vertical', '竖版']] as const).map(([value, label]) =>
                <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}
            </div>
          </div>
          <div className="template-grid">
            {visible.map(template => <div className="library-item" key={template.project.id}>
              <TemplateCard {...template} onUse={() => run(() => open(copy(template.project, template.project.name)))} />
              {template.personal && <button className="icon-button danger remove-template" title="删除模板" aria-label={`删除模板 ${template.project.name}`} onClick={() => setDeleting({ project: template.project, template: true })}><Trash2 size={15} /></button>}
            </div>)}
          </div>
        </section>
      </> : <section className="designs">
        <div className="section-heading">
          <div><div className="eyebrow"><span /> MY DESIGNS</div><h1>我的设计 <small>{projects.length} 份</small></h1><p>继续编辑已保存的名片，或导出项目 JSON 备份。</p></div>
          <button className="primary" onClick={() => selectView('templates')}><Plus size={17} />新建名片</button>
        </div>
        {projects.length ? <div className="template-grid">
          {projects.map(project => <article className="design-card" key={project.id}>
            <button className={`template-art ${templates.find(item => item.project.id === project.templateId)?.theme ?? 'neutral'} ${project.height > project.width ? 'portrait' : 'landscape'}`}
              aria-label={`打开${project.name || '未命名名片'}`} onClick={() => open(project)}>
              <CardPreview project={project} /><span className="style-chip"><Layers2 size={13} />{project.sides.back ? '双面' : '单面'}</span>
            </button>
            <div className="template-info">
              <button className="template-title design-title" onClick={() => open(project)}><h3>{project.name || '未命名名片'}</h3><ArrowUpRight size={17} /></button>
              <p>修改于 {new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(project.updatedAt)}</p>
              <div className="design-actions">
                <button className="secondary save-template" onClick={() => run(() => {
                  saveTemplate(project);
                  setFilter('all');
                  selectView('templates');
                })}><Plus size={14} />存为模板</button>
                <button className="icon-button" aria-label={`复制${project.name}`} title="复制项目" onClick={() => run(() => { copy(project); })}><Copy size={16} /></button>
                <button className="icon-button" aria-label={`导出${project.name}的 JSON`} title="导出项目 JSON" onClick={() => exportProject(project)}><FileJson size={16} /></button>
                <button className="icon-button danger" aria-label={`删除${project.name}`} title="删除项目" onClick={() => setDeleting({ project })}><Trash2 size={16} /></button>
              </div>
            </div>
          </article>)}
        </div> : <div className="empty">
          <span><FolderOpen size={32} strokeWidth={1.55} /></span>
          <h2>还没有保存的名片</h2><p>用任意模板开始，编辑进度会自动保存在此浏览器。</p>
          <button className="primary" onClick={() => selectView('templates')}>浏览模板 <ArrowRight size={16} /></button>
        </div>}
      </section>}
    </main>
    <footer className="site-footer"><div>
      <span>© @lantianjialiang · MIT</span>
      <span><BadgeCheck size={17} /> 印记 · 名片工作室</span>
      <span><LockKeyhole size={14} /> 项目和图片仅在浏览器本地保存与处理</span>
    </div></footer>
    {deleting && <dialog className="dialog" aria-labelledby="delete-title" ref={node => { if (node && !node.open) node.showModal(); }} onCancel={event => { event.preventDefault(); setDeleting(undefined); }}>
      <div className="dialog-body">
        <div className="dialog-head"><div><h2 id="delete-title">{deleting.template ? '删除模板' : '删除设计'}</h2><p>「{deleting.project.name || '未命名名片'}」将从此浏览器删除。</p></div><button className="icon-button" aria-label="关闭" onClick={() => setDeleting(undefined)}><X size={19} /></button></div>
        <div className="dialog-actions"><button className="secondary" onClick={() => setDeleting(undefined)}>取消</button>
          <button className="danger-button" onClick={() => run(() => {
            (deleting.template ? removeTemplate : remove)(deleting.project.id);
            setDeleting(undefined);
          })}><Trash2 size={16} />{deleting.template ? '删除模板' : '删除设计'}</button></div>
      </div>
    </dialog>}
  </div>;
}

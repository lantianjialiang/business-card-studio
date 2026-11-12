import { useEffect, useState } from 'react';
import { ArrowUpRight, CreditCard, Layers2 } from 'lucide-react';
import type { Project } from '../types';

const thumbnails = new Map<Project, Promise<string>>();

export function CardPreview({ project, className = '' }: { project: Project; className?: string }) {
  const [thumb, setThumb] = useState<{ project: Project; src: string }>();
  useEffect(() => {
    let live = true;
    let request = thumbnails.get(project);
    if (!request) {
      if (thumbnails.size >= 32) thumbnails.delete(thumbnails.keys().next().value!);
      request = import('./canvas/ElementRenderer').then(({ renderCard }) =>
        renderCard(project, 'front', Math.min(0.6, 600 / project.width), true));
      thumbnails.set(project, request);
    }
    request.then(src => { if (live) setThumb({ project, src }); }, () => { thumbnails.delete(project); });
    return () => { live = false; };
  }, [project]);
  return <div className={`card-preview ${className}`} style={{ aspectRatio: `${project.width} / ${project.height}`, background: project.sides.front.background.color }}>
    {thumb?.project === project && <img src={thumb.src} alt="" draggable={false} />}
  </div>;
}

export default function TemplateCard({ project, label, theme, description, onUse }: {
  project: Project; label: string; theme: string; description: string; onUse: () => void;
}) {
  const portrait = project.height > project.width;
  return <button className="template-card" onClick={onUse} aria-label={`使用${project.name}模板`}>
    <div className={`template-art ${theme} ${portrait ? 'portrait' : 'landscape'}`}>
      <span className="style-chip">{label}</span>
      <CardPreview project={project} />
    </div>
    <div className="template-info">
      <div className="template-title"><h3>{project.name}</h3><span className="use-arrow"><ArrowUpRight size={17} /></span></div>
      <p>{description}</p>
      <div className="card-meta">
        <span><CreditCard size={13} className={portrait ? 'rotate-90' : ''} />{portrait ? '竖版' : '横版'} · {project.physical.w} × {project.physical.h} mm</span>
        <span><Layers2 size={13} />{project.sides.back ? '双面' : '单面'}</span>
      </div>
    </div>
  </button>;
}

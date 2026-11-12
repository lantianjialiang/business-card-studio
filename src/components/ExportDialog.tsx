import { Download, FileImage, FileText, LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Project, Side } from '../types';
import { exportDesign } from '../utils/export';
import { NumberField } from './panels/Fields';

export default function ExportDialog({ project, side, close }: { project: Project; side: Side; close: () => void }) {
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [range, setRange] = useState<'current' | 'all' | 'combined'>('current');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dividerWidth, setDividerWidth] = useState(2);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function submit() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await exportDesign(project, range !== 'current' && project.sides.back ? ['front', 'back'] : [side], format, range === 'combined', dividerWidth);
      close();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '导出失败，请重试。');
    } finally {
      setBusy(false);
    }
  }
  return <dialog ref={dialog} className="dialog" aria-labelledby="export-title" onCancel={event => { event.preventDefault(); if (!busy) close(); }}
    onClick={event => { if (event.target === dialog.current && !busy) close(); }}>
    <div className="dialog-body">
      <div className="dialog-head"><div><h2 id="export-title">导出名片</h2><p>选择适合分享或印刷的文件格式。</p></div>
        <button className="icon-button" aria-label="关闭导出" onClick={close} disabled={busy}><X size={20} /></button></div>
      <div className="export-formats" aria-label="导出格式">
        {([['png', FileImage, '3 倍分辨率图片'], ['pdf', FileText, `${project.physical.w} × ${project.physical.h} mm`]] as const).map(([value, Icon, label]) =>
          <button key={value} aria-pressed={format === value} onClick={() => {
            setFormat(value);
            if (value === 'pdf' && range === 'combined') setRange('all');
          }} disabled={busy}><Icon size={21} /><strong>{value.toUpperCase()}</strong><small>{label}</small></button>)}
      </div>
      {project.sides.back && <div className="segmented" aria-label="导出范围">
        <button aria-pressed={range === 'current'} onClick={() => setRange('current')} disabled={busy}>当前面</button>
        <button aria-pressed={range === 'all'} onClick={() => setRange('all')} disabled={busy}>{format === 'png' ? '正反面分开' : '所有面'}</button>
        {format === 'png' && <button aria-pressed={range === 'combined'} onClick={() => setRange('combined')} disabled={busy}>正反面合图</button>}
      </div>}
      {range === 'combined' && <p className="panel-hint">{project.width >= project.height ? '正面在上，背面在下。' : '正面在左，背面在右。'}</p>}
      {range === 'combined' && <NumberField label="分割线宽度（画布 px）" value={dividerWidth} min={0} max={100} disabled={busy} onChange={width => setDividerWidth(Math.round(width))} />}
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="primary full" onClick={submit} disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <Download size={17} />}{busy ? '正在生成文件…' : '下载文件'}</button>
    </div>
  </dialog>;
}

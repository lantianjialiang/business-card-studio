import { ScanLine } from 'lucide-react';
import { useEditor } from '../../store/editorStore';
import { ColorField, NumberField } from './Fields';

export default function CanvasProps() {
  const { project, side, commit, editSide } = useEditor();
  if (!project) return null;
  const { background } = project.sides[side]!;
  return <>
    <div className="panel-intro"><span><ScanLine size={18} /></span><div><strong>画布设置</strong><p>当前面与名片尺寸</p></div></div>
    <section className="property-section">
      <h3>外观</h3>
      <ColorField label="背景色" value={background.color} onChange={color => editSide(data => ({ ...data, background: { ...background, color } }))} />
      {background.imageSrc && <button className="secondary full" onClick={() => editSide(data => ({ ...data, background: { color: background.color } }))}>移除背景图案</button>}
    </section>
    <section className="property-section">
      <h3>画布尺寸 · px</h3>
      <div className="field-grid">
        <NumberField label="宽度" value={project.width} min={100} max={3000} onChange={width => commit(data => data.width === width ? data : { ...data, width })} />
        <NumberField label="高度" value={project.height} min={100} max={3000} onChange={height => commit(data => data.height === height ? data : { ...data, height })} />
      </div>
    </section>
    <section className="property-section">
      <h3>印刷尺寸 · mm</h3>
      <div className="field-grid">
        <NumberField label="成品宽度" value={project.physical.w} min={10} max={500} step={0.1} onChange={w => commit(data => data.physical.w === w ? data : { ...data, physical: { ...data.physical, w } })} />
        <NumberField label="成品高度" value={project.physical.h} min={10} max={500} step={0.1} onChange={h => commit(data => data.physical.h === h ? data : { ...data, physical: { ...data.physical, h } })} />
      </div>
    </section>
    <p className="panel-hint">点击画布上的元素，编辑文字、图片或形状。</p>
  </>;
}

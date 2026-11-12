import { Circle, Image, Layers3, Lock, Plus, QrCode, Square, Type } from 'lucide-react';
import { useEditor } from '../../store/editorStore';
import type { Element } from '../../types';
import { useState } from 'react';

export const elementKinds = {
  text: { label: '文字', icon: Type },
  image: { label: '图片', icon: Image },
  qrcode: { label: '二维码', icon: QrCode },
  rect: { label: '矩形', icon: Square },
  ellipse: { label: '圆形', icon: Circle },
};

export function layerName(element: Element, elements: Element[]) {
  const label = elementKinds[element.type].label;
  if (element.type === 'text') return element.text.trim() || label;
  if (element.type === 'image') {
    return element.name?.trim() || element.placeholderLabel?.replace(/^上传\s*/, '') || `图片 ${elements.indexOf(element) + 1}`;
  }
  return label;
}

export default function LeftPanel() {
  const { project, side, switchSide, add, selectedIds, select } = useEditor();
  const [multiSelect, setMultiSelect] = useState(false);
  if (!project) return null;
  const elements = project.sides[side]!.elements;
  return <aside className="left-panel" aria-label="添加元素与图层">
    {project.sides.back && <section className="left-section">
      <h2>名片页面</h2>
      <div className="segmented">
        <button aria-pressed={side === 'front'} onClick={() => switchSide('front')}>正面</button>
        <button aria-pressed={side === 'back'} onClick={() => switchSide('back')}>背面</button>
      </div>
    </section>}
    <section className="left-section">
      <h2><Plus size={15} /> 添加元素</h2>
      <div className="add-grid">
        {(Object.keys(elementKinds) as Element['type'][]).map(type => {
          const { icon: Icon, label } = elementKinds[type];
          return <button key={type} onClick={() => add(type)} aria-label={`添加${label}`}><Icon size={19} /><span>{label}</span></button>;
        })}
      </div>
    </section>
    <section className="left-section layers">
      <h2><Layers3 size={15} /> 图层 <small>{elements.length}</small></h2>
      {elements.length > 0 && <label className="check-field">
        <input type="checkbox" checked={multiSelect} onChange={event => setMultiSelect(event.target.checked)} />
        <span>多选（或按住 Shift）</span>
      </label>}
      {!elements.length && <p className="panel-hint">添加元素后会在这里显示。</p>}
      {[...elements].reverse().map(element => {
        const { icon: Icon } = elementKinds[element.type];
        const title = layerName(element, elements);
        return <button className="layer-item" key={element.id} title={title} aria-pressed={selectedIds.includes(element.id)} onClick={event => select(element.id, multiSelect || event.shiftKey)}>
          <Icon size={15} /><span>{title}</span>{element.locked && <Lock size={12} />}
        </button>;
      })}
    </section>
  </aside>;
}

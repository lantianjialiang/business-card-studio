import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Copy, Lock, LockOpen, Trash2 } from 'lucide-react';
import { currentElement, useEditor } from '../../store/editorStore';
import { elementKinds } from './LeftPanel';
import { NumberField } from './Fields';
import CanvasProps from './CanvasProps';
import TextProps from './TextProps';
import ImageProps from './ImageProps';
import QrProps from './QrProps';
import ShapeProps from './ShapeProps';
import AlignmentProps from './AlignmentProps';
import { useAsset } from '../canvas/ElementRenderer';
import { resizeImageFrame } from '../../utils/imageLayout';
import type { Element } from '../../types';
import { useState } from 'react';

export default function PropsPanel({ openCrop, positioning, togglePosition, upload }: {
  openCrop: () => void; positioning: boolean; togglePosition: () => void; upload: (element: Element) => void;
}) {
  const store = useEditor();
  const [targets, setTargets] = useState({ front: '', back: '' });
  const element = currentElement(store);
  const asset = useAsset(element?.type === 'image' ? element.src : undefined);
  if (!element) return <aside className="right-panel" aria-label="画布属性"><CanvasProps /></aside>;
  const { icon: Icon, label } = elementKinds[element.type];
  const update = (patch: Partial<Element>) => store.update(element.id, patch);
  const locked = !!element.locked;
  const elements = store.project!.sides[store.side]!.elements;
  const selected = elements.filter(item => store.selectedIds.includes(item.id));
  const alignment = <AlignmentProps selected={selected} elements={elements} project={store.project!}
    targetId={targets[store.side]} setTargetId={id => setTargets(previous => ({ ...previous, [store.side]: id }))} />;
  if (selected.length > 1) return <aside className="right-panel" aria-label="多选属性">
    <div className="panel-intro"><strong>已选中 {selected.length} 个对象</strong></div>
    {alignment}
  </aside>;
  const position = elements.indexOf(element);
  const resize = (dimension: 'width' | 'height', size: number) => {
    if (element.type === 'image' && asset) {
      const { x, y, width, height, rotation } = element;
      update(resizeImageFrame(element, asset, { x, y, width, height, rotation, [dimension]: size }));
    } else if (element.type === 'qrcode') update({ width: size, height: size });
    else update({ [dimension]: size });
  };

  return <aside className="right-panel" aria-label="元素属性">
    <div className="panel-intro">
      <span><Icon size={18} /></span><div><strong>{label}属性</strong><p>{locked ? '元素已锁定' : '调整选中的元素'}</p></div>
      <button className={`icon-button ${locked ? 'active' : ''}`} onClick={() => update({ locked: !locked })}
        aria-label={locked ? '解锁元素' : '锁定元素'} title={locked ? '解锁元素' : '锁定元素'}>{locked ? <Lock size={16} /> : <LockOpen size={16} />}</button>
    </div>
    <fieldset disabled={locked} key={element.id}>
      <section className="property-section">
        <h3>{label}</h3>
        {element.type === 'text' && <TextProps element={element} update={update} />}
        {element.type === 'image' && <ImageProps element={element} asset={asset} update={update} upload={() => upload(element)}
          openCrop={openCrop} positioning={positioning} togglePosition={togglePosition} />}
        {element.type === 'qrcode' && <QrProps element={element} update={update} upload={() => upload(element)} />}
        {(element.type === 'rect' || element.type === 'ellipse') && <ShapeProps element={element} update={update} />}
      </section>
      <section className="property-section">
        <h3>{element.type === 'image' ? '图片框位置与尺寸' : '位置与尺寸'}</h3>
        <div className="field-grid">
          <NumberField label="X 位置" value={element.x} onChange={x => update({ x })} />
          <NumberField label="Y 位置" value={element.y} onChange={y => update({ y })} />
          <NumberField label={element.type === 'image' ? '图片框宽度' : '宽度'} value={element.width} min={8} max={6000} disabled={element.type === 'image' && !!element.src && !asset} onChange={width => resize('width', width)} />
          <NumberField label={element.type === 'image' ? '图片框高度' : '高度'} value={element.height} min={8} max={6000} disabled={element.type === 'image' && !!element.src && !asset} onChange={height => resize('height', height)} />
          <NumberField label="旋转角度" value={element.rotation} onChange={rotation => update({ rotation })} />
          <NumberField label="不透明度 %" value={element.opacity * 100} min={0} max={100} onChange={opacity => update({ opacity: opacity / 100 })} />
        </div>
      </section>
      <section className="property-section">
        <h3>排列图层</h3>
        <div className="layer-actions">
          <button className="icon-button" title="置顶" aria-label="置顶" disabled={position === elements.length - 1} onClick={() => store.layer('top')}><ArrowUpToLine size={17} /></button>
          <button className="icon-button" title="上移" aria-label="上移" disabled={position === elements.length - 1} onClick={() => store.layer('up')}><ArrowUp size={17} /></button>
          <button className="icon-button" title="下移" aria-label="下移" disabled={position === 0} onClick={() => store.layer('down')}><ArrowDown size={17} /></button>
          <button className="icon-button" title="置底" aria-label="置底" disabled={position === 0} onClick={() => store.layer('bottom')}><ArrowDownToLine size={17} /></button>
        </div>
      </section>
    </fieldset>
    {alignment}
    <div className="element-actions">
      <button className="secondary" onClick={store.duplicate}><Copy size={15} />复制</button>
      <button className="secondary danger" disabled={locked} onClick={store.remove}><Trash2 size={15} />删除</button>
    </div>
  </aside>;
}

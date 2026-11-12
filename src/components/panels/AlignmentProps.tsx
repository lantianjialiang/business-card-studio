import { AlignEndHorizontal, AlignEndVertical, AlignStartHorizontal, AlignStartVertical, AlignCenterHorizontal, AlignCenterVertical } from 'lucide-react';
import type { Element, Project } from '../../types';
import { alignElement, distributeElements, elementBounds, type Alignment } from '../../utils/alignment';
import { useEditor } from '../../store/editorStore';
import { Field } from './Fields';
import { layerName } from './LeftPanel';

const actions = [
  ['left', '左对齐', AlignStartVertical], ['center', '水平居中', AlignCenterVertical], ['right', '右对齐', AlignEndVertical],
  ['top', '顶端对齐', AlignStartHorizontal], ['middle', '垂直居中', AlignCenterHorizontal], ['bottom', '底端对齐', AlignEndHorizontal],
] as const satisfies ReadonlyArray<readonly [Alignment, string, typeof AlignStartHorizontal]>;

export default function AlignmentProps({ selected, elements, project, targetId, setTargetId }: {
  selected: Element[]; elements: Element[]; project: Project; targetId: string; setTargetId: (id: string) => void;
}) {
  const editSide = useEditor(state => state.editSide);
  const targets = selected.length === 1 ? elements.filter(item => item !== selected[0]) : elements;
  const target = targets.find(item => item.id === targetId);
  const bounds = target ? elementBounds(target) : { x: 0, y: 0, width: project.width, height: project.height };
  const movable = selected.filter(item => !item.locked && item !== target);
  const canDistribute = selected.length >= 3 && selected.every(item => !item.locked);
  function apply(positions: Map<string, { x?: number; y?: number }>) {
    editSide(side => {
      let changed = false;
      const elements = side.elements.map(item => {
        const position = positions.get(item.id);
        if (!position || ((position.x ?? item.x) === item.x && (position.y ?? item.y) === item.y)) return item;
        changed = true;
        return { ...item, ...position };
      });
      return changed ? { ...side, elements } : side;
    });
  }
  return <section className="property-section">
    <h3>对象对齐</h3>
    <Field label="对齐到"><select value={target?.id ?? ''} onChange={event => setTargetId(event.target.value)}>
      <option value="">画布</option>
      {targets.map(item => <option key={item.id} value={item.id}>
        {elements.indexOf(item) + 1}. {layerName(item, elements).slice(0, 40)}
      </option>)}
    </select></Field>
    <div className="alignment-actions">
      {actions.map(([alignment, label, Icon]) => <button key={alignment} className="icon-button" title={label} aria-label={label}
        disabled={!movable.length} onClick={() => apply(new Map(movable.map(item => [item.id, alignElement(item, bounds, alignment)])))}><Icon size={17} /></button>)}
    </div>
    {selected.length > 1 && <>
      <div className="field-grid">
        <button className="secondary" disabled={!canDistribute} onClick={() => apply(distributeElements(selected, 'x'))}>水平等距</button>
        <button className="secondary" disabled={!canDistribute} onClick={() => apply(distributeElements(selected, 'y'))}>垂直等距</button>
      </div>
      <p className="panel-hint">等距分布需要至少 3 个未锁定对象。</p>
    </>}
    <p className="panel-hint">拖动时自动吸附。按住 Alt 可暂时关闭。</p>
  </section>;
}

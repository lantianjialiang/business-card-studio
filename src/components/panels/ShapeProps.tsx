import type { ShapeEl } from '../../types';
import { ColorField, NumberField } from './Fields';

export default function ShapeProps({ element, update }: { element: ShapeEl; update: (patch: Partial<ShapeEl>) => void }) {
  return <>
    <div className="field-grid">
      <ColorField label="填充" value={element.fill} onChange={fill => update({ fill })} />
      <ColorField label="描边" value={element.stroke} onChange={stroke => update({ stroke })} />
    </div>
    <div className="field-grid">
      <NumberField label="描边宽度" value={element.strokeWidth} min={0} max={200} onChange={strokeWidth => update({ strokeWidth })} />
      {element.type === 'rect' && <NumberField label="圆角" value={element.cornerRadius ?? 0} min={0} onChange={cornerRadius => update({ cornerRadius })} />}
    </div>
  </>;
}

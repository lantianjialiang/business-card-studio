import { Crop, ImageUp, Move } from 'lucide-react';
import type { ImageEl } from '../../types';
import { Field, MonochromeField, NumberField, SelectField } from './Fields';
import { imagePlacement } from '../../utils/imageLayout';

export default function ImageProps({ element, asset, update, upload, openCrop, positioning, togglePosition }: {
  element: ImageEl; asset?: HTMLImageElement; update: (patch: Partial<ImageEl>) => void; upload: () => void;
  openCrop: () => void; positioning: boolean; togglePosition: () => void;
}) {
  const placement = asset && imagePlacement(element, asset);
  function fitToFrame(fit: ImageEl['fit']) {
    if (!asset) return;
    const defaults = { ...element, fit, placement: undefined, offsetX: 0, offsetY: 0 };
    update({ fit, offsetX: 0, offsetY: 0, placement: imagePlacement(defaults, asset) });
  }
  return <>
    <Field label="图层名称"><input value={element.name ?? ''} maxLength={100} placeholder={element.placeholderLabel ?? '为图片命名'} onChange={event => update({ name: event.target.value })} /></Field>
    <button className="secondary full" onClick={upload}><ImageUp size={16} />{element.src ? '替换图片' : '上传图片'}</button>
    <SelectField label="图片框形状" value={element.mask} options={[[ 'rect', '矩形' ], [ 'rounded', '圆角矩形' ], [ 'circle', '圆形' ]]} onChange={mask => update({ mask })} />
    {element.mask === 'rounded' && <NumberField label="圆角" value={element.radius ?? 28} min={0} onChange={radius => update({ radius })} />}
    {placement && <>
      <MonochromeField value={element.monochrome} onChange={monochrome => update({ monochrome })} />
      <button className="secondary full" onClick={openCrop}><Crop size={16} />裁剪原图</button>
      <button className={`${positioning ? 'primary' : 'secondary'} full`} onClick={togglePosition}><Move size={16} />{positioning ? '完成调整' : '移动框内图片'}</button>
      <NumberField label="图片宽度" value={placement.width} min={1} onChange={width => update({ placement: { ...placement, width } })} />
      <div className="field-grid">
        <NumberField label="框内 X" value={placement.x} onChange={x => update({ placement: { ...placement, x } })} />
        <NumberField label="框内 Y" value={placement.y} onChange={y => update({ placement: { ...placement, y } })} />
      </div>
      <div className="field-grid">
        <button className="secondary" onClick={() => fitToFrame('cover')}>填充图片框</button>
        <button className="secondary" onClick={() => fitToFrame('contain')}>完整显示</button>
      </div>
    </>}
  </>;
}

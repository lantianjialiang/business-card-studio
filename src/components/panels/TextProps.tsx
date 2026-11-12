import type { TextEl } from '../../types';
import { ColorField, Field, NumberField, SelectField } from './Fields';

const fonts = ['Inter', 'Noto Sans SC', 'Noto Serif SC', 'Arial', 'Georgia', 'Verdana', 'Tahoma', 'Times New Roman', 'Courier New', 'Microsoft YaHei'];

export default function TextProps({ element, update }: { element: TextEl; update: (patch: Partial<TextEl>) => void }) {
  const fontOptions = fonts.includes(element.fontFamily) ? fonts : [...fonts, element.fontFamily];
  return <>
    <Field label="文字内容"><textarea rows={3} value={element.text} onChange={event => update({ text: event.target.value })} /></Field>
    <SelectField label="字体" value={element.fontFamily} options={fontOptions.map(font => [font, font])} onChange={fontFamily => update({ fontFamily })} />
    <div className="field-grid">
      <NumberField label="字号" value={element.fontSize} min={4} max={1000} onChange={fontSize => update({ fontSize })} />
      <SelectField label="字重" value={element.fontWeight} options={[[ 'normal', '常规' ], [ 'bold', '粗体' ]]} onChange={fontWeight => update({ fontWeight })} />
    </div>
    <div className="field-grid">
      <ColorField label="颜色" value={element.fill} onChange={fill => update({ fill })} />
      <SelectField label="对齐" value={element.align} options={[[ 'left', '左对齐' ], [ 'center', '居中' ], [ 'right', '右对齐' ]]} onChange={align => update({ align })} />
    </div>
    <div className="field-grid">
      <NumberField label="行高" value={element.lineHeight} step={0.1} min={0.5} max={5} onChange={lineHeight => update({ lineHeight })} />
      <NumberField label="字间距" value={element.letterSpacing} step={0.5} min={-30} max={100} onChange={letterSpacing => update({ letterSpacing })} />
    </div>
  </>;
}

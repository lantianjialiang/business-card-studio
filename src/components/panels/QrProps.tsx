import { ImageUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { QrEl } from '../../types';
import { ColorField, Field, MonochromeField, NumberField } from './Fields';

export default function QrProps({ element, update, upload }: { element: QrEl; update: (patch: Partial<QrEl>) => void; upload: () => void }) {
  const [error, setError] = useState(false);
  useEffect(() => {
    try { if (element.content) QRCode.create(element.content); setError(false); }
    catch { setError(true); }
  }, [element.content]);
  return <>
    <div className="segmented" aria-label="二维码模式">
      <button aria-pressed={element.mode === 'upload'} onClick={() => update({ mode: 'upload' })}>上传图片</button>
      <button aria-pressed={element.mode === 'generate'} onClick={() => update({ mode: 'generate' })}>输入生成</button>
    </div>
    <MonochromeField value={element.monochrome} onChange={monochrome => update({ monochrome })} />
    {element.mode === 'upload' ? <button className="secondary full" onClick={upload}><ImageUp size={16} /> {element.src ? '替换二维码' : '上传二维码'}</button> : <>
      <Field label="文字或链接"><textarea rows={3} placeholder="https://example.com" value={element.content ?? ''} onChange={event => update({ content: event.target.value })} /></Field>
      {error && <div className="field-error" role="alert">内容太长，无法生成二维码。</div>}
      {element.monochrome ? <p className="panel-hint">使用黑色前景和白色背景。</p> : <div className="field-grid">
        <ColorField label="前景色" value={element.fg} onChange={fg => update({ fg })} />
        <ColorField label="背景色" value={element.bg} onChange={bg => update({ bg })} />
      </div>}
      <NumberField label="边距" value={element.margin} min={0} max={20} onChange={margin => update({ margin: Math.round(margin) })} />
    </>}
  </>;
}

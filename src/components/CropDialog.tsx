import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Crop, RotateCcw, X } from 'lucide-react';
import type { ImageCrop, ImageEl } from '../types';
import { wholeImage } from '../utils/imageLayout';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se';
const handles = ['nw', 'ne', 'sw', 'se'] as const;

export default function CropDialog({ image, apply, close }: {
  image: ImageEl; apply: (crop: ImageCrop, source: HTMLImageElement) => void; close: () => void;
}) {
  const [crop, setCrop] = useState(image.crop ?? wholeImage);
  const [ready, setReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const drag = useRef<{ handle: Handle; x: number; y: number; crop: ImageCrop }>();
  useEffect(() => { dialog.current?.showModal(); }, []);

  function start(event: PointerEvent<HTMLElement>, handle: Handle) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { handle, x: event.clientX, y: event.clientY, crop };
  }

  function move(event: PointerEvent<HTMLElement>) {
    if (!drag.current || !photo.current) return;
    const { handle, crop: original, x, y } = drag.current;
    const rect = photo.current.getBoundingClientRect();
    const dx = (event.clientX - x) / rect.width;
    const dy = (event.clientY - y) / rect.height;
    if (handle === 'move') {
      setCrop({ ...original, x: clamp(original.x + dx, 0, 1 - original.width), y: clamp(original.y + dy, 0, 1 - original.height) });
      return;
    }
    const right = original.x + original.width;
    const bottom = original.y + original.height;
    const minW = Math.min(0.04, original.width);
    const minH = Math.min(0.04, original.height);
    const west = handle.endsWith('w');
    const north = handle.startsWith('n');
    const left = west ? clamp(original.x + dx, 0, right - minW) : original.x;
    const top = north ? clamp(original.y + dy, 0, bottom - minH) : original.y;
    const width = (west ? right : clamp(right + dx, left + minW, 1)) - left;
    const height = (north ? bottom : clamp(bottom + dy, top + minH, 1)) - top;
    setCrop({ x: left, y: top, width, height });
  }

  return <dialog ref={dialog} className="dialog crop-dialog" aria-labelledby="crop-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="dialog-body">
      <div className="dialog-head"><div><h2 id="crop-title">裁剪原图</h2><p>拖动选区或四角，保留选区内的图片。</p></div>
        <button className="icon-button" aria-label="关闭裁剪" onClick={close}><X size={20} /></button></div>
      <div className="crop-viewport">
        <div className="crop-photo" onPointerMove={move} onLostPointerCapture={() => { drag.current = undefined; }}>
          <img ref={photo} src={image.src} alt="待裁剪的原图" draggable={false} onLoad={() => setReady(true)} />
          {ready && <div className="crop-selection" onPointerDown={event => start(event, 'move')}
            style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%` }}>
            {handles.map(handle => <span key={handle} className={`crop-handle ${handle}`} onPointerDown={event => start(event, handle)} />)}
          </div>}
        </div>
      </div>
      <div className="dialog-actions">
        <button className="secondary" onClick={() => setCrop(wholeImage)}><RotateCcw size={15} />选中整张</button>
        <button className="secondary" onClick={close}>取消</button>
        <button className="primary" disabled={!ready} onClick={() => apply(crop, photo.current!)}><Crop size={16} />应用裁剪</button>
      </div>
    </div>
  </dialog>;
}

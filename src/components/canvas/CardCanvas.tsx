import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Image, Line, Transformer } from 'react-konva';
import Konva from 'konva';
import { Minus, Plus, ScanLine } from 'lucide-react';
import type { Element, ImageEl, Project, Side, TextEl } from '../../types';
import { elementBounds, snapAxis } from '../../utils/alignment';
import { resizeImageFrame } from '../../utils/imageLayout';
import { ElementRenderer, loadCardFonts, useAsset } from './ElementRenderer';

interface Props {
  project: Project;
  side: Side;
  selected: string | null;
  selectedIds: string[];
  positioning: string | null;
  onSample?: (color: string | null) => void;
  cancelSample: () => void;
  onSelect: (id: string | null, multiple?: boolean) => void;
  onUpdate: (id: string, patch: Partial<Element>) => void;
  onActivate: (element: Element) => void;
}

const zoomLimit = (value: number) => Math.max(50, Math.min(200, value));

export default function CardCanvas({ project, side, selected, selectedIds, positioning, onSample, cancelSample, onSelect, onUpdate, onActivate }: Props) {
  const area = useRef<HTMLDivElement>(null);
  const scene = useRef<Konva.Layer>(null);
  const imageFrame = useRef<Konva.Rect>(null);
  const transformer = useRef<Konva.Transformer>(null);
  const nodes = useRef(new Map<string, Konva.Group>());
  const register = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  }, []);
  const [available, setAvailable] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(100);
  const [fontRevision, setFontRevision] = useState(0);
  const [editing, setEditing] = useState<{ element: TextEl; value: string }>();
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});
  const [imagePreview, setImagePreview] = useState<{ element: ImageEl; patch: Partial<ImageEl> }>();
  const data = project.sides[side]!;
  const asset = useAsset(data.background.imageSrc);
  const fit = Math.max(0.1, Math.min((available.width - 68) / project.width, (available.height - 92) / project.height, 1));
  const scale = fit * zoom / 100;
  const displayWidth = project.width * scale;
  const displayHeight = project.height * scale;
  const multiple = selectedIds.length > 1;
  const selection = multiple ? undefined : data.elements.find(element => element.id === selected);
  const selectedImage = selection?.type === 'image' ? selection : undefined;
  const selectedAsset = useAsset(selectedImage?.src);
  const activeEdit = selected === editing?.element.id && !selection?.locked ? editing : undefined;

  useLayoutEffect(() => {
    const element = area.current!;
    const observer = new ResizeObserver(([entry]) => setAvailable({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom(value => zoomLimit(value + (event.deltaY > 0 ? -5 : 5)));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); element.removeEventListener('wheel', wheel); };
  }, []);

  useEffect(() => {
    const redraw = () => setFontRevision(value => value + 1);
    document.fonts.addEventListener('loadingdone', redraw);
    return () => document.fonts.removeEventListener('loadingdone', redraw);
  }, []);
  useEffect(() => {
    let active = true;
    void loadCardFonts(project, side).then(() => { if (active) setFontRevision(value => value + 1); });
    return () => { active = false; };
  }, [side]);

  useLayoutEffect(() => {
    const control = transformer.current!;
    const node = selectedImage ? imageFrame.current : selection && nodes.current.get(selection.id);
    const waitingForImage = selectedImage?.src && !selectedAsset;
    control.nodes(node && !selection?.locked && !waitingForImage && !positioning && !activeEdit && !onSample ? [node] : []);
    control.forceUpdate();
    control.getLayer()?.batchDraw();
  }, [selected, selection, selectedImage, selectedAsset, positioning, activeEdit, onSample, scale, side, fontRevision]);

  function transformImage(commit: boolean) {
    const node = imageFrame.current;
    if (!node || !selectedImage) return;
    const frame = {
      x: node.x(), y: node.y(), rotation: node.rotation(),
      width: Math.max(8, node.width() * node.scaleX()), height: Math.max(8, node.height() * node.scaleY()),
    };
    const patch = selectedAsset ? resizeImageFrame(selectedImage, selectedAsset, frame) : frame;
    if (commit) {
      node.setAttrs({ ...frame, scaleX: 1, scaleY: 1 });
      setImagePreview(undefined);
      onUpdate(selectedImage.id, patch);
    } else {
      setImagePreview({ element: selectedImage, patch });
    }
  }

  function snap(element: Element, node: Konva.Group, altKey: boolean) {
    if (altKey) {
      setGuides({});
    } else {
      const bounds = elementBounds(element, node.position());
      const targets = [
        { x: 0, y: 0, width: project.width, height: project.height },
        ...data.elements.filter(item => item.id !== element.id && item.opacity > 0).map(item => elementBounds(item)),
      ];
      const x = snapAxis(bounds, targets, 'x', 6 / scale);
      const y = snapAxis(bounds, targets, 'y', 6 / scale);
      node.position({ x: node.x() + (x?.delta ?? 0), y: node.y() + (y?.delta ?? 0) });
      setGuides({ x: x?.guide, y: y?.guide });
    }
    if (element === selectedImage) imageFrame.current?.position(node.position());
  }

  function activate(element: Element) {
    if (element.locked) return;
    if (element.type === 'text') setEditing({ element, value: element.text });
    else onActivate(element);
  }

  function finishEdit(save: boolean) {
    if (save && activeEdit) onUpdate(activeEdit.element.id, { text: activeEdit.value });
    setEditing(undefined);
  }

  return <section className="workspace" aria-label="名片画布">
    <div className="workspace-caption"><span className="canvas-dot" /> {side === 'front' ? '正面' : '背面'} <span className="caption-divider" /> {project.width} × {project.height} px</div>
    <div className="canvas-scroll" ref={area}>
      <div className="canvas-space" style={{ width: Math.max(available.width, displayWidth + 68), height: Math.max(available.height, displayHeight + 92) }}>
        <div className="card-stage" style={{ width: displayWidth, height: displayHeight }}>
          <Stage width={displayWidth} height={displayHeight} scaleX={scale} scaleY={scale}
            onPointerDown={() => { finishEdit(true); onSelect(null); }}>
            <Layer ref={scene}>
              <Rect width={project.width} height={project.height} fill={data.background.color} />
              {asset && <Image image={asset} width={project.width} height={project.height} listening={false} />}
              {data.elements.map(element => <ElementRenderer key={`${side}-${element.id}-${element.type === 'text' ? fontRevision : 0}`}
                element={imagePreview?.element === element ? { ...imagePreview.element, ...imagePreview.patch } : element}
                register={register} editing={activeEdit?.element.id === element.id} positioning={positioning === element.id}
                onSelect={add => { if (add || element.id !== selected) finishEdit(true); onSelect(element.id, add); }}
                onActivate={() => { if (!multiple) activate(element); }} onUpdate={patch => onUpdate(element.id, patch)}
                onDrag={(node, altKey) => snap(element, node, altKey)} onDrop={() => setGuides({})} />)}
            </Layer>
            <Layer>
              {multiple && data.elements.filter(item => selectedIds.includes(item.id)).map(item => <Rect key={item.id}
                x={item.x} y={item.y} width={item.width} height={item.height} rotation={item.rotation}
                stroke="#7957e4" strokeWidth={1 / scale} listening={false} />)}
              {guides.x !== undefined && <Line listening={false} points={[guides.x, 0, guides.x, project.height]} stroke="#a22cbd" strokeWidth={1 / scale} dash={[5 / scale, 3 / scale]} />}
              {guides.y !== undefined && <Line listening={false} points={[0, guides.y, project.width, guides.y]} stroke="#a22cbd" strokeWidth={1 / scale} dash={[5 / scale, 3 / scale]} />}
              {selectedImage && <Rect key={`${side}-${selectedImage.id}`} ref={imageFrame} listening={false}
                x={selectedImage.x} y={selectedImage.y} width={selectedImage.width} height={selectedImage.height} rotation={selectedImage.rotation}
                stroke={positioning ? '#7957e4' : undefined} strokeWidth={1 / scale} dash={[5 / scale, 3 / scale]}
                onTransform={() => transformImage(false)} onTransformEnd={() => transformImage(true)} />}
              <Transformer ref={transformer} flipEnabled={false} rotateAnchorOffset={24} padding={1}
                keepRatio={selection?.type === 'qrcode' || selection?.type === 'text'}
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                anchorSize={8} anchorCornerRadius={2} borderStroke="#7957e4" anchorStroke="#7957e4" anchorFill="#ffffff"
                boundBoxFunc={(oldBox, next) => next.width < 8 * scale || next.height < 8 * scale ? oldBox : next}
                onPointerDown={event => { event.cancelBubble = true; }} />
            </Layer>
          </Stage>
          {onSample && <button className="sample-overlay" aria-label="点击画布取色" onPointerDown={event => {
            const canvas = scene.current?.getNativeCanvasElement();
            const rect = event.currentTarget.getBoundingClientRect();
            if (!canvas) { onSample(null); return; }
            const x = Math.floor((event.clientX - rect.left) / rect.width * canvas.width);
            const y = Math.floor((event.clientY - rect.top) / rect.height * canvas.height);
            try {
              const pixel = canvas.getContext('2d')?.getImageData(x, y, 1, 1).data;
              onSample(pixel?.[3] ? `#${Array.from(pixel.slice(0, 3), channel => channel.toString(16).padStart(2, '0')).join('')}` : null);
            } catch { onSample(null); }
          }} />}
          {activeEdit && <textarea className="inline-text" aria-label="画布内文字编辑"
            ref={node => { if (node && document.activeElement !== node) { node.focus(); node.select(); } }}
            value={activeEdit.value} onChange={event => setEditing({ ...activeEdit, value: event.target.value })}
            onBlur={() => finishEdit(true)}
            onKeyDown={event => {
              if (event.key === 'Escape' || ((event.ctrlKey || event.metaKey) && event.key === 'Enter')) {
                event.preventDefault();
                finishEdit(event.key !== 'Escape');
              }
            }}
            style={{
              left: activeEdit.element.x * scale, top: activeEdit.element.y * scale,
              width: Math.max(30, activeEdit.element.width * scale), height: Math.max(26, activeEdit.element.height * scale),
              fontFamily: activeEdit.element.fontFamily, fontSize: activeEdit.element.fontSize * scale,
              fontWeight: activeEdit.element.fontWeight, color: activeEdit.element.fill,
              lineHeight: activeEdit.element.lineHeight, letterSpacing: activeEdit.element.letterSpacing * scale,
              textAlign: activeEdit.element.align, transform: `rotate(${activeEdit.element.rotation}deg)`,
            }} />}
        </div>
      </div>
    </div>
    <div className="zoom-bar" aria-label="画布缩放">
      <button className="icon-button" aria-label="缩小" disabled={zoom === 50} onClick={() => setZoom(zoomLimit(zoom - 10))}><Minus size={16} /></button>
      <output>{zoom}%</output>
      <button className="icon-button" aria-label="放大" disabled={zoom === 200} onClick={() => setZoom(zoomLimit(zoom + 10))}><Plus size={16} /></button>
      <span />
      <button className="icon-button" aria-label="适应画布" title="适应画布" onClick={() => setZoom(100)}><ScanLine size={16} /></button>
    </div>
    {positioning && <div className="crop-notice">拖动框内图片调整位置</div>}
    {onSample && <div className="sample-notice">点击画布取色 <button className="quiet" onClick={cancelSample}>取消</button></div>}
  </section>;
}

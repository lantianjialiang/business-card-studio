import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pipette } from 'lucide-react';

export const ColorSampler = createContext<((apply: (color: string) => void) => void) | null>(null);

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function MonochromeField({ value, onChange }: { value?: boolean; onChange: (enabled: boolean) => void }) {
  return <label className="check-field">
    <input type="checkbox" checked={!!value} onChange={event => onChange(event.target.checked)} />
    <span>黑白模式</span>
  </label>;
}

export function NumberField({ label, value, onChange, min, max, step = 1, disabled }: {
  label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(Math.round(value * 100) / 100));
  const [focused, setFocused] = useState(false);
  const changed = useRef(false);
  useEffect(() => {
    if (!focused) setDraft(String(Math.round(value * 100) / 100));
  }, [value, focused]);
  return <Field label={label}><input type="number" value={draft} min={min} max={max} step={step} disabled={disabled}
    onFocus={() => { changed.current = false; setFocused(true); }}
    onBlur={() => {
      setFocused(false);
      const parsed = Number(draft);
      if (!changed.current || draft === '' || !Number.isFinite(parsed)) return;
      const clamped = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, parsed));
      if (clamped !== parsed) onChange(clamped);
    }}
    onChange={event => {
      const next = event.target.value;
      changed.current = true;
      setDraft(next);
      const parsed = Number(next);
      if (next !== '' && Number.isFinite(parsed) && parsed >= (min ?? -Infinity) && parsed <= (max ?? Infinity)) onChange(parsed);
    }}
    onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></Field>;
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const sample = useContext(ColorSampler);
  return <div className="field"><span>{label}</span><div className="color-input">
    <input type="color" aria-label={label} value={value} onChange={event => onChange(event.target.value)} />
    <span>{value.toUpperCase()}</span>
    {sample && <button className="sample-button" aria-label={`从画布选取${label}`} title="从画布取色" onClick={() => sample(onChange)}><Pipette size={13} /></button>}
  </div></div>;
}

export function SelectField<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: [T, string][]; onChange: (value: T) => void;
}) {
  return <Field label={label}><select value={value} onChange={event => onChange(event.target.value as T)}>
    {options.map(([option, name]) => <option key={option} value={option}>{name}</option>)}
  </select></Field>;
}

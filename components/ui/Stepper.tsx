'use client';
import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';

interface Props {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}

/** − value + stepper with numeric keyboard on phones. */
export function Stepper({ label, value, min = 0, max = 999, step = 5, suffix, onChange }: Props) {
  const id = useId();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-medium text-ink-2 pointer-coarse:text-[13px]">
        {label}
      </label>
      <div className="flex h-9 items-center rounded-lg bg-fill pointer-coarse:h-11">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(clamp(value - step))} className="grid h-full w-9 place-items-center text-ink-2 hover:text-ink pointer-coarse:w-11">
          <Minus className="size-4" strokeWidth={1.75} />
        </button>
        <input
          id={id}
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, ''));
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-center font-mono-ui text-[13px] tabular-nums outline-none max-md:text-base"
        />
        {suffix ? <span className="pr-1 text-[12px] text-ink-3">{suffix}</span> : null}
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(clamp(value + step))} className="grid h-full w-9 place-items-center text-ink-2 hover:text-ink pointer-coarse:w-11">
          <Plus className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

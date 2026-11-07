'use client';
import { useId, useState } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

/** Range slider with a live value bubble while dragging. */
export function Slider({ label, value, min, max, step = 1, onChange, format = String }: Props) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[12px] font-medium text-ink-2 pointer-coarse:text-[13px]">
          {label}
        </label>
        <span className="font-mono-ui text-[12px] text-ink-2 tabular-nums">{format(value)}</span>
      </div>
      <div className="relative flex h-9 items-center pointer-coarse:h-11">
        {dragging ? (
          <span
            className="pointer-events-none absolute -top-6 -translate-x-1/2 rounded-md bg-ink px-1.5 py-0.5 font-mono-ui text-[11px] text-surface animate-pop-in"
            style={{ left: `calc(${pct}% + ${(50 - pct) * 0.2}px)` }}
          >
            {format(value)}
          </span>
        ) : null}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onBlur={() => setDragging(false)}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[var(--accent)]"
          style={{ background: `linear-gradient(90deg, var(--accent) ${pct}%, var(--fill) ${pct}%)` }}
        />
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { Check, TriangleAlert } from 'lucide-react';
import { PALETTE, contrastRatio, normalizeHex } from '@/lib/presets';
import { useUI } from '@/lib/ui';
import { Popover } from './Popover';
import { fieldBase } from './Input';
import { cx } from './layout-context';

interface Props {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  /** colour the swatch is shown against, for the contrast warning (default white text) */
  contrastAgainst?: string;
  compact?: boolean;
}

function Swatch({ hex, selected, onClick, name }: { hex: string; selected: boolean; onClick: () => void; name: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name}
      aria-pressed={selected}
      title={`${name} ${hex}`}
      className="grid size-8 place-items-center rounded-full transition-transform hover:scale-110 pointer-coarse:size-11"
      style={{ background: hex, boxShadow: selected ? `0 0 0 2px var(--surface), 0 0 0 4px ${hex}` : 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}
    >
      {selected ? <Check className="size-4 text-white" strokeWidth={3} /> : null}
    </button>
  );
}

/** Colour popover: 12 presets, HEX field, recent colours and a contrast warning. */
export function ColorPicker({ label, value, onChange, contrastAgainst = '#FFFFFF', compact }: Props) {
  const recent = useUI((s) => s.recentColors);
  const pushRecent = useUI((s) => s.pushRecentColor);
  const [hex, setHex] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setHex(value);
  }
  const pick = (h: string) => {
    onChange(h);
    pushRecent(h);
  };
  const ratio = contrastRatio(value, contrastAgainst);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {!compact ? <span className="text-[12px] font-medium text-ink-2 pointer-coarse:text-[13px]">{label}</span> : null}
      <Popover
        title={label}
        width={276}
        trigger={(p) => (
          <button
            type="button"
            {...p}
            aria-label={`${label}: ${value}`}
            className={cx(fieldBase, 'flex items-center gap-2 text-left', compact && 'w-auto pr-2 pl-1.5')}
          >
            <span className="size-5 shrink-0 rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]" style={{ background: value }} />
            {!compact ? <span className="font-mono-ui text-[12px] text-ink-2 uppercase">{value}</span> : null}
          </button>
        )}
      >
        {(close) => (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-6 justify-items-center gap-2">
              {PALETTE.map((c) => (
                <Swatch key={c.hex} hex={c.hex} name={c.name} selected={value.toUpperCase() === c.hex} onClick={() => pick(c.hex)} />
              ))}
            </div>
            {recent.length ? (
              <div>
                <div className="mb-1.5 text-[11px] font-medium text-ink-3">Recent</div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((c) => (
                    <Swatch key={c} hex={c} name={c} selected={value.toUpperCase() === c} onClick={() => pick(c)} />
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Custom colour"
                value={normalizeHex(hex) ?? value}
                onChange={(e) => pick(e.target.value.toUpperCase())}
                className="size-9 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0 pointer-coarse:size-11"
              />
              <input
                aria-label="HEX"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const n = normalizeHex(hex);
                    if (n) {
                      pick(n);
                      close();
                    }
                  }
                }}
                onBlur={() => {
                  const n = normalizeHex(hex);
                  if (n) pick(n);
                  else setHex(value);
                }}
                spellCheck={false}
                className={cx(fieldBase, 'font-mono-ui uppercase')}
                placeholder="#2563EB"
              />
            </div>
            {ratio < 3 ? (
              <p className="flex items-start gap-1.5 text-[12px] text-warning-ink">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
                Low contrast ({ratio.toFixed(1)}:1) — white text on this colour may be hard to read when printed.
              </p>
            ) : null}
          </div>
        )}
      </Popover>
    </div>
  );
}

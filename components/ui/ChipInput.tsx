'use client';
import { useId, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { GripVertical, X } from 'lucide-react';
import { Field } from './Input';
import { cx } from './layout-context';

interface Props {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  helper?: string;
}

/**
 * Tag / chip input: type and press Enter or comma; Backspace removes the last chip;
 * a pasted comma/newline separated list becomes many chips; chips can be dragged to reorder
 * (or moved with ←/→ while focused).
 */
export function ChipInput({ label, value, onChange, placeholder, helper }: Props) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const dragFrom = useRef<number | null>(null);

  const add = (raw: string) => {
    const parts = raw
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) if (!next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
    onChange(next);
    setDraft('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = value.slice();
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };

  return (
    <Field label={label} htmlFor={id} helper={helper}>
      <div
        className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg bg-fill p-1.5 focus-within:bg-surface focus-within:shadow-[0_0_0_1px_var(--accent),0_0_0_4px_color-mix(in_srgb,var(--accent)_35%,transparent)] pointer-coarse:min-h-11"
        onClick={() => document.getElementById(id)?.focus()}
      >
        {value.map((chip, i) => (
          <span
            key={chip}
            draggable
            tabIndex={0}
            onDragStart={() => (dragFrom.current = i)}
            onDragOver={(e: DragEvent) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom.current !== null) move(dragFrom.current, i);
              dragFrom.current = null;
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' && e.altKey) move(i, i - 1);
              if (e.key === 'ArrowRight' && e.altKey) move(i, i + 1);
              if (e.key === 'Delete' || e.key === 'Backspace') onChange(value.filter((_, j) => j !== i));
            }}
            className={cx('group inline-flex h-7 cursor-grab items-center gap-1 rounded-md bg-surface pr-1 pl-1 text-[12px] font-medium text-ink shadow-[0_0_0_0.5px_var(--hairline-strong),0_1px_1px_rgba(0,0,0,0.04)] active:cursor-grabbing pointer-coarse:h-9 pointer-coarse:text-[14px] dark:bg-surface-3')}
          >
            <GripVertical className="size-3 text-ink-3" strokeWidth={1.75} aria-hidden />
            {chip}
            <button
              type="button"
              aria-label={`Remove ${chip}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((_, j) => j !== i));
              }}
              className="grid size-5 place-items-center rounded text-ink-3 hover:bg-fill hover:text-ink pointer-coarse:size-7"
            >
              <X className="size-3" strokeWidth={2} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            if (/[,\n;]/.test(v)) add(v);
            else setDraft(v);
          }}
          onKeyDown={onKey}
          onBlur={() => draft.trim() && add(draft)}
          onPaste={(e) => {
            const t = e.clipboardData.getData('text');
            if (/[,\n;]/.test(t)) {
              e.preventDefault();
              add(t);
            }
          }}
          placeholder={value.length ? 'Add another…' : placeholder}
          enterKeyHint="enter"
          className="h-7 min-w-[120px] flex-1 bg-transparent px-1.5 text-[13px] outline-none placeholder:text-ink-3 max-md:text-base pointer-coarse:h-9"
        />
      </div>
    </Field>
  );
}

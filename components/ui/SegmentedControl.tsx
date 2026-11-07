'use client';
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from './layout-context';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  ariaLabel?: string;
}

interface Props<T extends string | number> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (v: T) => void;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** iOS-style segmented control with a sliding thumb; arrow keys move the selection. */
export function SegmentedControl<T extends string | number>({ value, options, onChange, label, size = 'md', className }: Props<T>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      {label ? (
        <span id={id} className="text-[12px] font-medium text-ink-2 pointer-coarse:text-[13px]">
          {label}
        </span>
      ) : null}
      <div
        role="radiogroup"
        aria-labelledby={label ? id : undefined}
        onKeyDown={onKey}
        className={cx('relative grid rounded-[9px] bg-fill p-[2px]', size === 'sm' ? 'h-8' : 'h-9', 'pointer-coarse:h-11')}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden
          className="absolute top-[2px] bottom-[2px] rounded-[7px] bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-apple dark:bg-surface-3"
          style={{ left: 2, width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(${idx * 100}%)` }}
        />
        {options.map((o, i) => (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={i === idx}
            aria-label={o.ariaLabel}
            tabIndex={i === idx ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative z-[1] flex min-w-0 items-center justify-center gap-1.5 truncate rounded-[7px] px-2 text-[12px] font-medium transition-colors pointer-coarse:text-[14px] [&_svg]:size-3.5',
              i === idx ? 'text-ink' : 'text-ink-2 hover:text-ink',
            )}
          >
            {o.icon}
            <span className="truncate">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

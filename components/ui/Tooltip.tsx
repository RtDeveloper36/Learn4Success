'use client';
import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { cx } from './layout-context';

interface Props {
  content: ReactNode;
  shortcut?: string;
  side?: 'top' | 'bottom';
  children: ReactElement;
}

/** Lightweight tooltip shown on hover & keyboard focus (never on touch). */
export function Tooltip({ content, shortcut, side = 'bottom', children }: Props) {
  const [show, setShow] = useState(false);
  const id = useId();
  return (
    <span
      className="relative inline-flex"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setShow(true)}
      onPointerLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      aria-describedby={show ? id : undefined}
    >
      {children}
      {show ? (
        <span
          id={id}
          role="tooltip"
          className={cx(
            'pointer-events-none absolute left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-md bg-[#1d1d1f] px-2 py-1 text-[11px] font-medium text-white shadow-md animate-fade-in dark:bg-[#3a3a3c]',
            side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
          )}
        >
          {content}
          {shortcut ? <kbd className="font-mono-ui text-white/60">{shortcut}</kbd> : null}
        </span>
      ) : null}
    </span>
  );
}

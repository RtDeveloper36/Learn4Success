'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import { cx } from './layout-context';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** max height as a fraction of the viewport */
  maxHeight?: number;
}

/** Modal bottom sheet used for popovers/menus on phones & tablets. Drag the handle down to close. */
export function Sheet({ open, onClose, title, children, maxHeight = 0.86 }: Props) {
  const { keyboardInset } = useVisualViewport();
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('input, button, [tabindex]')?.focus({ preventScroll: true }));
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[80]" role="presentation">
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="safe-bottom absolute inset-x-0 flex flex-col rounded-t-[20px] bg-surface shadow-[var(--shadow-lg)] animate-slide-up"
        style={{
          bottom: keyboardInset,
          maxHeight: `calc(${maxHeight * 100}dvh - ${keyboardInset}px)`,
          transform: drag ? `translateY(${drag}px)` : undefined,
          transition: drag ? 'none' : 'transform 200ms var(--ease)',
        }}
      >
        <div
          className="flex shrink-0 touch-none cursor-grab flex-col items-center pt-2 pb-1"
          onPointerDown={(e) => {
            start.current = e.clientY;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => start.current !== null && setDrag(Math.max(0, e.clientY - start.current))}
          onPointerUp={() => {
            if (drag > 90) onClose();
            setDrag(0);
            start.current = null;
          }}
        >
          <span className="h-[5px] w-9 rounded-full bg-hairline-strong" aria-hidden />
        </div>
        {title ? (
          <div className="flex shrink-0 items-center justify-between px-4 pb-2">
            <h2 className="text-[17px] font-semibold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full text-ink-2 hover:bg-fill-2">
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>
        ) : null}
        <div className={cx('scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4')}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

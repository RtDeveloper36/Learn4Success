'use client';
import { useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { useUI } from '@/lib/ui';
import { useVisualViewport } from '@/hooks/useVisualViewport';

/** Snap points as a fraction of the dynamic viewport height: closed / peek / half / full. */
export const SNAPS = [0, 0.25, 0.55, 0.92] as const;

interface Props {
  header?: ReactNode;
  children: ReactNode;
  /** px reserved at the bottom (tab bar) */
  bottom: number;
}

/**
 * Non-modal, draggable editor sheet (phones). Three snap points (25% / 55% / 92%);
 * dragging below peek closes it. Moves above the on-screen keyboard via visualViewport.
 */
export function BottomSheet({ header, children, bottom }: Props) {
  const snap = useUI((s) => s.sheetSnap);
  const set = useUI((s) => s.set);
  const { keyboardInset } = useVisualViewport();
  const [dragH, setDragH] = useState<number | null>(null);
  const start = useRef<{ y: number; h: number } | null>(null);

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const avail = vh - bottom;
  const target = keyboardInset ? Math.max(SNAPS[snap], 0.55) : SNAPS[snap];
  const height = dragH ?? target * avail;

  const onDown = (e: RPointerEvent) => {
    start.current = { y: e.clientY, h: height };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    if (!start.current) return;
    setDragH(Math.max(0, Math.min(avail * 0.95, start.current.h - (e.clientY - start.current.y))));
  };
  const onUp = () => {
    if (!start.current) return;
    const h = dragH ?? height;
    start.current = null;
    setDragH(null);
    const frac = h / avail;
    if (frac < SNAPS[1] * 0.6) {
      set({ sheetSnap: 0, mobileTab: 'preview' });
      return;
    }
    let best = 1;
    for (let i = 1; i < SNAPS.length; i++) if (Math.abs(SNAPS[i] - frac) < Math.abs(SNAPS[best] - frac)) best = i;
    set({ sheetSnap: best as 1 | 2 | 3 });
  };

  if (snap === 0 && dragH === null) return null;

  return (
    <section
      aria-label="Editor"
      className="fixed inset-x-0 z-40 flex flex-col rounded-t-[20px] bg-surface shadow-[0_-1px_0_var(--hairline),0_-12px_40px_rgba(0,0,0,0.14)] animate-slide-up"
      style={{
        bottom: bottom + keyboardInset,
        height: keyboardInset ? Math.min(height, vh - bottom - keyboardInset - 40) : height,
        transition: dragH === null ? 'height 240ms var(--ease)' : 'none',
      }}
    >
      <div
        className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-2 pb-1.5 active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="slider"
        aria-label="Resize editor sheet"
        aria-valuemin={1}
        aria-valuemax={3}
        aria-valuenow={snap}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') set({ sheetSnap: Math.min(3, snap + 1) as 1 | 2 | 3 });
          if (e.key === 'ArrowDown') set(snap <= 1 ? { sheetSnap: 0, mobileTab: 'preview' } : { sheetSnap: (snap - 1) as 1 | 2 });
        }}
      >
        <span className="h-[5px] w-9 rounded-full bg-hairline-strong" />
      </div>
      {header ? <div className="shrink-0 px-3 pb-2">{header}</div> : null}
      <div data-scroll className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-1 pb-8">{children}</div>
    </section>
  );
}

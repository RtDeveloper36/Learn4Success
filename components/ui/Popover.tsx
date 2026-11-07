'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Sheet } from './Sheet';
import { useLayout } from './layout-context';

interface Props {
  /** render-prop for the trigger; spread `props` onto a button */
  trigger: (props: { ref: (el: HTMLElement | null) => void; onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'dialog' }) => ReactNode;
  children: (close: () => void) => ReactNode;
  title: string;
  width?: number;
  align?: 'start' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Anchored popover on laptops and up; a bottom sheet on phones & tablets. */
export function Popover({ trigger, children, title, width = 300, align = 'start', open: controlled, onOpenChange }: Props) {
  const { stacked } = useLayout();
  const [internal, setInternal] = useState(false);
  const open = controlled ?? internal;
  const setOpen = useCallback(
    (v: boolean) => {
      setInternal(v);
      onOpenChange?.(v);
    },
    [onOpenChange],
  );
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; maxH: number } | null>(null);
  const close = useCallback(() => setOpen(false), [setOpen]);

  useLayoutEffect(() => {
    if (!open || stacked || !anchorEl) return;
    const place = () => {
      const r = anchorEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const ph = panel.current?.offsetHeight ?? 320;
      let left = align === 'end' ? r.right - width : r.left;
      left = Math.max(8, Math.min(left, vw - width - 8));
      const below = vh - r.bottom - 12;
      const above = r.top - 12;
      const top = below >= Math.min(ph, 360) || below >= above ? r.bottom + 6 : Math.max(8, r.top - 6 - Math.min(ph, above));
      setPos({ top, left, maxH: below >= above ? below : above });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, stacked, width, align, anchorEl]);

  useEffect(() => {
    if (!open || stacked) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || anchorEl?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        anchorEl?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('input, button')?.focus({ preventScroll: true }));
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, stacked, close, anchorEl]);

  return (
    <>
      {trigger({
        ref: setAnchorEl,
        onClick: () => setOpen(!open),
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
      })}
      {stacked ? (
        <Sheet open={open} onClose={close} title={title}>
          {children(close)}
        </Sheet>
      ) : open && typeof document !== 'undefined' ? (
        createPortal(
          <div
            ref={panel}
            role="dialog"
            aria-label={title}
            className="scroll-thin fixed z-[70] overflow-y-auto rounded-xl bg-surface p-3 shadow-[0_0_0_0.5px_var(--hairline-strong),var(--shadow-lg)] animate-pop-in"
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width, maxHeight: pos ? Math.min(480, pos.maxH) : 480 }}
          >
            {children(close)}
          </div>,
          document.body,
        )
      ) : null}
    </>
  );
}

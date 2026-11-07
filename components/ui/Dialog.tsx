'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from './layout-context';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number;
  /** prevent closing by backdrop/Esc (e.g. during export) */
  persistent?: boolean;
  role?: 'dialog' | 'alertdialog';
}

/** Centered modal dialog with focus management and a light focus trap. */
export function Dialog({ open, onClose, title, description, children, footer, width = 420, persistent, role = 'dialog' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    requestAnimationFrame(() => {
      const first = node?.querySelector<HTMLElement>('[data-autofocus], input, button:not([data-close])');
      first?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose();
      if (e.key === 'Tab' && node) {
        const f = Array.from(node.querySelectorAll<HTMLElement>('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((x) => !x.hasAttribute('disabled'));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose, persistent]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="presentation">
      <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={persistent ? undefined : onClose} />
      <div
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby="dlg-title"
        className={cx('relative flex max-h-[calc(100dvh-32px)] w-full flex-col overflow-hidden rounded-[18px] bg-surface shadow-[0_0_0_0.5px_var(--hairline-strong),var(--shadow-lg)] animate-pop-in')}
        style={{ maxWidth: width }}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="min-w-0 flex-1">
            <h2 id="dlg-title" className="text-[17px] font-semibold tracking-[-0.01em]">
              {title}
            </h2>
            {description ? <div className="mt-1 text-[13px] leading-relaxed text-ink-2">{description}</div> : null}
          </div>
          {!persistent ? (
            <button type="button" data-close onClick={onClose} aria-label="Close" className="-mt-1 -mr-2 grid size-9 place-items-center rounded-full text-ink-2 hover:bg-fill-2 pointer-coarse:size-11">
              <X className="size-[18px]" strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
        {children ? <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pt-4">{children}</div> : null}
        {footer ? <div className="flex flex-wrap justify-end gap-2 px-5 pt-4 pb-5">{footer}</div> : <div className="h-5" />}
      </div>
    </div>,
    document.body,
  );
}

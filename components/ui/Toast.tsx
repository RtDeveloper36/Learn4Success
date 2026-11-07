'use client';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { dismissToast, useToasts } from '@/lib/ui';
import { cx } from './layout-context';

/** Bottom-center toasts with an optional action (e.g. Undo / Retry). */
export function Toaster({ bottomOffset = 0 }: { bottomOffset?: number }) {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[100] flex flex-col items-center gap-2 px-3"
      style={{ bottom: `calc(${bottomOffset + 16}px + env(safe-area-inset-bottom))` }}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          aria-live={t.tone === 'error' ? 'assertive' : 'polite'}
          className={cx(
            'pointer-events-auto flex max-w-[min(520px,100%)] items-center gap-2.5 rounded-full py-2 pr-2 pl-4 text-[13px] text-white shadow-[var(--shadow-lg)] animate-slide-up',
            'bg-[#1d1d1f]/95 backdrop-blur-xl dark:bg-[#2c2c2e]/95',
          )}
        >
          {t.tone === 'success' ? <CircleCheck className="size-4 shrink-0 text-[#30d158]" strokeWidth={2} /> : null}
          {t.tone === 'error' ? <CircleAlert className="size-4 shrink-0 text-[#ff453a]" strokeWidth={2} /> : null}
          <span className="min-w-0 flex-1">{t.message}</span>
          {t.action ? (
            <button
              type="button"
              onClick={() => {
                t.action!.run();
                dismissToast(t.id);
              }}
              className="rounded-full px-3 py-1 font-semibold text-[#64b5ff] hover:bg-white/10 pointer-coarse:py-2.5"
            >
              {t.action.label}
            </button>
          ) : null}
          <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="grid size-7 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white pointer-coarse:size-9">
            <X className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}

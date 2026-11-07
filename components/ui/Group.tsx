'use client';
import type { ReactNode } from 'react';
import { cx } from './layout-context';

/** iOS-Settings style grouped inset section. */
export function Group({ title, footer, children, className, action, id }: { title?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string; action?: ReactNode; id?: string }) {
  return (
    <section className={cx('flex flex-col gap-1.5', className)} id={id} aria-label={typeof title === 'string' ? title : undefined}>
      {(title || action) && (
        <div className="flex min-h-6 items-end justify-between gap-2 px-1">
          {title ? <h3 className="text-[11px] font-semibold tracking-[0.04em] text-ink-2 uppercase pointer-coarse:text-[12px]">{title}</h3> : <span />}
          {action}
        </div>
      )}
      <div className="flex flex-col gap-3 rounded-xl bg-surface p-3 shadow-[0_0_0_var(--hair)_var(--hairline)] dark:bg-surface-2">{children}</div>
      {footer ? <div className="px-1 text-[12px] leading-snug text-ink-3">{footer}</div> : null}
    </section>
  );
}

export function Divider() {
  return <div className="-mx-3 h-px bg-hairline" />;
}

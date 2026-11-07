'use client';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cx } from './layout-context';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'tinted';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  block?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:brightness-110 active:brightness-95 shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
  secondary: 'bg-surface text-ink hover:bg-surface-3 shadow-[0_0_0_1px_var(--hairline-strong),0_1px_2px_rgba(0,0,0,0.04)]',
  ghost: 'bg-transparent text-ink hover:bg-fill-2 active:bg-fill',
  destructive: 'bg-danger-soft text-danger hover:bg-danger hover:text-white',
  tinted: 'bg-accent-soft text-accent hover:brightness-95',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[12px] gap-1.5 rounded-lg pointer-coarse:h-11 pointer-coarse:text-[15px]',
  md: 'h-9 px-3.5 text-[13px] gap-2 rounded-[10px] pointer-coarse:h-11 pointer-coarse:text-[15px]',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, iconRight, loading, block, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-[background,color,box-shadow,filter,transform] duration-150 ease-apple active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle className="animate-spin" strokeWidth={1.75} /> : icon}
      {children}
      {iconRight}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md';
  active?: boolean;
  shortcut?: string;
}

/** Square icon button — always labelled for screen readers, tooltip via `title`. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', active, shortcut, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={active}
      className={cx(
        'inline-grid shrink-0 place-items-center rounded-lg text-ink transition-colors duration-150 hover:bg-fill-2 active:bg-fill disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-[18px]',
        size === 'sm' ? 'size-8' : 'size-9',
        'pointer-coarse:size-11',
        active && 'bg-fill text-accent',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

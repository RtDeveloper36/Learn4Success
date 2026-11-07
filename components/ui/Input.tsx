'use client';
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { cx } from './layout-context';

export const fieldBase =
  'w-full rounded-lg bg-fill px-3 text-ink placeholder:text-ink-3 outline-none transition-[box-shadow,background] duration-150 ' +
  'focus:bg-surface focus:shadow-[0_0_0_1px_var(--accent),0_0_0_4px_color-mix(in_srgb,var(--accent)_35%,transparent)] ' +
  'h-9 text-[13px] pointer-coarse:h-11 pointer-coarse:text-base max-md:text-base disabled:opacity-50';

export interface FieldProps {
  label?: string;
  helper?: ReactNode;
  error?: string | null;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
  trailing?: ReactNode;
}

/** Label above (12px/500 secondary), optional helper and inline validation below. */
export function Field({ label, helper, error, htmlFor, className, children, trailing }: FieldProps) {
  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      {(label || trailing) && (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <label htmlFor={htmlFor} className="text-[12px] font-medium text-ink-2 pointer-coarse:text-[13px]">
              {label}
            </label>
          ) : (
            <span />
          )}
          {trailing}
        </div>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[12px] text-danger" role="alert">
          <CircleAlert className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          {error}
        </p>
      ) : helper ? (
        <p className="text-[12px] leading-snug text-ink-3">{helper}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: ReactNode;
  error?: string | null;
  fieldClassName?: string;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, error, className, fieldClassName, id, trailing, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <Field label={label} helper={helper} error={error} htmlFor={inputId} className={fieldClassName} trailing={trailing}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        enterKeyHint="next"
        className={cx(fieldBase, error && 'shadow-[0_0_0_1px_var(--danger)]', className)}
        {...rest}
      />
    </Field>
  );
});

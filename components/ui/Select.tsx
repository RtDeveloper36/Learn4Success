'use client';
import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { Field, fieldBase } from './Input';
import { cx } from './layout-context';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helper?: string;
  options: { value: string; label: string }[];
}

/** Native select (best accessibility + native picker on phones), styled as a filled field. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helper, options, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const sid = id ?? auto;
  return (
    <Field label={label} helper={helper} htmlFor={sid}>
      <div className="relative">
        <select ref={ref} id={sid} className={cx(fieldBase, 'appearance-none pr-8', className)} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-2" strokeWidth={1.75} aria-hidden />
      </div>
    </Field>
  );
});

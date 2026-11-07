'use client';
import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { Field, fieldBase } from './Input';
import { cx } from './layout-context';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string | null;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, helper, error, className, id, rows = 2, ...rest },
  ref,
) {
  const auto = useId();
  const tid = id ?? auto;
  return (
    <Field label={label} helper={helper} error={error} htmlFor={tid}>
      <textarea
        ref={ref}
        id={tid}
        rows={rows}
        className={cx(fieldBase, 'h-auto min-h-[60px] resize-y py-2 leading-snug pointer-coarse:h-auto', className)}
        {...rest}
      />
    </Field>
  );
});

'use client';
import { useId, type ReactNode } from 'react';
import { cx } from './layout-context';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

/** iOS-style switch row; the whole row is a 44px touch target. */
export function Switch({ checked, onChange, label, description, disabled, icon }: Props) {
  const id = useId();
  return (
    <div className={cx('flex min-h-11 items-center gap-3 py-1.5', disabled && 'opacity-50')}>
      {icon ? <span className="text-ink-2 [&_svg]:size-[17px]">{icon}</span> : null}
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-[13px] text-ink pointer-coarse:text-[15px]">{label}</span>
        {description ? <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{description}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ease-apple',
          checked ? 'bg-success' : 'bg-fill',
          'before:absolute before:-inset-2 before:content-[""]',
        )}
      >
        <span
          className="absolute top-[2px] left-[2px] size-[22px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_0_0_0.5px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-apple"
          style={{ transform: checked ? 'translateX(18px)' : 'none' }}
        />
      </button>
    </div>
  );
}

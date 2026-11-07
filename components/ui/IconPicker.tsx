'use client';
import dynamic from 'next/dynamic';
import { getIcon, iconLabel } from '@/lib/icons';
import { Popover } from './Popover';
import { fieldBase } from './Input';
import { cx } from './layout-context';

// The searchable grid is lazy-loaded on first open to keep the initial bundle small.
const IconGrid = dynamic(() => import('./IconGrid').then((m) => m.IconGrid), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-lg bg-fill-2" />,
});

interface Props {
  label: string;
  value: string | null;
  onChange: (name: string | null) => void;
}

export function IconPicker({ label, value, onChange }: Props) {
  const Icon = getIcon(value);
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[12px] font-medium text-ink-2 pointer-coarse:text-[13px]">{label}</span>
      <Popover
        title={label}
        width={320}
        trigger={(p) => (
          <button type="button" {...p} aria-label={`${label}: ${value ? iconLabel(value) : 'No icon'}`} className={cx(fieldBase, 'flex items-center gap-2 text-left')}>
            {Icon ? <Icon className="size-4 shrink-0" strokeWidth={1.75} /> : <span className="size-4 shrink-0 rounded border border-dashed border-ink-3" />}
            <span className="truncate text-[12px] text-ink-2">{value ? iconLabel(value) : 'No icon'}</span>
          </button>
        )}
      >
        {(close) => (
          <IconGrid
            value={value}
            onPick={(n) => {
              onChange(n);
              close();
            }}
          />
        )}
      </Popover>
    </div>
  );
}

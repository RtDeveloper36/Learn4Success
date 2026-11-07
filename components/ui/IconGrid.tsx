'use client';
import { useMemo, useState } from 'react';
import { Ban, Search } from 'lucide-react';
import { ICON_CATEGORIES, getIcon, iconLabel } from '@/lib/icons';
import { fieldBase } from './Input';
import { cx } from './layout-context';

export function IconGrid({ value, onPick }: { value: string | null; onPick: (name: string | null) => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('All');
  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    return ICON_CATEGORIES.filter((g) => cat === 'All' || g.name === cat)
      .map((g) => ({ ...g, icons: g.icons.filter((n) => !query || iconLabel(n).toLowerCase().includes(query) || g.name.toLowerCase().includes(query)) }))
      .filter((g) => g.icons.length);
  }, [q, cat]);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" strokeWidth={1.75} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search icons, e.g. book" aria-label="Search icons" className={cx(fieldBase, 'pl-8')} />
      </div>
      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        {['All', ...ICON_CATEGORIES.map((g) => g.name)].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={cx('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium pointer-coarse:py-2', cat === c ? 'bg-ink text-surface' : 'bg-fill-2 text-ink-2 hover:text-ink')}
          >
            {c}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onPick(null)}
        aria-pressed={value === null}
        className={cx('flex h-9 items-center gap-2 rounded-lg px-2 text-[12px] text-ink-2 hover:bg-fill-2 pointer-coarse:h-11', value === null && 'bg-accent-soft text-accent')}
      >
        <Ban className="size-4" strokeWidth={1.75} /> No icon
      </button>
      {groups.map((g) => (
        <div key={g.name}>
          <div className="mb-1 text-[11px] font-medium text-ink-3">{g.name}</div>
          <div className="grid grid-cols-7 gap-1">
            {g.icons.map((n) => {
              const I = getIcon(n)!;
              return (
                <button
                  key={n}
                  type="button"
                  title={iconLabel(n)}
                  aria-label={iconLabel(n)}
                  aria-pressed={value === n}
                  onClick={() => onPick(n)}
                  className={cx('grid aspect-square place-items-center rounded-lg text-ink hover:bg-fill-2 pointer-coarse:min-h-11', value === n && 'bg-accent text-white hover:bg-accent')}
                >
                  <I className="size-[18px]" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!groups.length ? <p className="py-6 text-center text-[12px] text-ink-3">No icons match “{q}”.</p> : null}
    </div>
  );
}

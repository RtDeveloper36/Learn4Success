'use client';
import { useRef, type KeyboardEvent } from 'react';
import { CalendarClock, Download, LayoutPanelTop, Palette, Sparkles } from 'lucide-react';
import type { EditorTab } from '@/lib/types';
import { useUI } from '@/lib/ui';
import { cx } from '@/components/ui/layout-context';

export const TABS: { id: EditorTab; label: string; short: string; icon: typeof Sparkles }[] = [
  { id: 'setup', label: 'Setup', short: 'Setup', icon: Sparkles },
  { id: 'schedule', label: 'Schedule', short: 'Schedule', icon: CalendarClock },
  { id: 'headerFooter', label: 'Header & Footer', short: 'Header', icon: LayoutPanelTop },
  { id: 'design', label: 'Design', short: 'Design', icon: Palette },
  { id: 'export', label: 'Export', short: 'Export', icon: Download },
];

/** Icon + label tab navigation (keyboard: ←/→). `subset` limits which tabs appear (mobile Edit sheet). */
export function TabNav({ subset, variant = 'icons' }: { subset?: EditorTab[]; variant?: 'icons' | 'segmented' }) {
  const tab = useUI((s) => s.tab);
  const setTab = useUI((s) => s.setTab);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabs = subset ? TABS.filter((t) => subset.includes(t.id)) : TABS;
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    setTab(tabs[n].id);
    refs.current[n]?.focus();
  };

  if (variant === 'segmented') {
    return (
      <div role="tablist" aria-label="Editor sections" className="grid h-9 rounded-[9px] bg-fill p-[2px] pointer-coarse:h-11" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            tabIndex={tab === t.id ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => setTab(t.id)}
            className={cx('truncate rounded-[7px] px-1.5 text-[12px] font-medium transition-colors pointer-coarse:text-[14px]', tab === t.id ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.12)] dark:bg-surface-3' : 'text-ink-2')}
          >
            {t.short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div role="tablist" aria-label="Editor sections" className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}>
      {tabs.map((t, i) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-controls={`panel-${t.id}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => setTab(t.id)}
            className={cx('flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 transition-colors', active ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-fill-2 hover:text-ink')}
          >
            <t.icon className="size-[18px]" strokeWidth={1.75} />
            <span className="line-clamp-2 w-full text-center text-[11px] leading-tight font-medium">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

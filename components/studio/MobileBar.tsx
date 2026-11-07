'use client';
import { Download, Eye, Palette, SquarePen } from 'lucide-react';
import { useUI, type MobileTab } from '@/lib/ui';
import { Popover } from '@/components/ui/Popover';
import { IconButton } from '@/components/ui/Button';
import { cx } from '@/components/ui/layout-context';
import { AppMark, ExportMenuItems, UndoRedo, AppThemeToggle } from './Toolbar';

/** Compact phone top bar: app mark, undo/redo, export. */
export function MobileTopBar() {
  return (
    <header className="vibrancy hairline-b safe-x relative z-30 flex shrink-0 items-center gap-1 px-2" style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(52px + env(safe-area-inset-top))' }}>
      <AppMark withName />
      <div className="flex-1" />
      <UndoRedo />
      <AppThemeToggle />
      <Popover
        title="Export"
        trigger={(p) => (
          <IconButton label="Export" {...p} className="bg-accent text-white hover:bg-accent">
            <Download strokeWidth={1.75} />
          </IconButton>
        )}
      >
        {(close) => <ExportMenuItems close={close} />}
      </Popover>
    </header>
  );
}

const ITEMS: { id: MobileTab; label: string; icon: typeof Eye }[] = [
  { id: 'edit', label: 'Edit', icon: SquarePen },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'export', label: 'Export', icon: Download },
];

export const MOBILE_BAR_H = 56;

/** Bottom tab bar with safe-area padding. */
export function MobileBar() {
  const tab = useUI((s) => s.mobileTab);
  const set = useUI((s) => s.set);
  const snap = useUI((s) => s.sheetSnap);
  const choose = (id: MobileTab) => {
    if (id === 'preview') set({ mobileTab: 'preview', sheetSnap: 0 });
    else if (id === tab && snap > 0) set({ mobileTab: 'preview', sheetSnap: 0 });
    else {
      const editorTab = id === 'design' ? 'design' : id === 'export' ? 'export' : undefined;
      const cur = useUI.getState().tab;
      set({
        mobileTab: id,
        sheetSnap: snap === 0 ? 2 : snap,
        tab: editorTab ?? (cur === 'design' || cur === 'export' ? 'schedule' : cur),
      });
    }
  };
  return (
    <nav className="vibrancy hairline-t safe-x relative z-50 shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="Main">
      <div className="grid grid-cols-4" style={{ height: MOBILE_BAR_H }}>
        {ITEMS.map((i) => {
          const active = tab === i.id;
          return (
            <button key={i.id} type="button" onClick={() => choose(i.id)} aria-current={active ? 'page' : undefined} className={cx('flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium', active ? 'text-accent' : 'text-ink-2')}>
              <i.icon className="size-[22px]" strokeWidth={active ? 2 : 1.75} />
              {i.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

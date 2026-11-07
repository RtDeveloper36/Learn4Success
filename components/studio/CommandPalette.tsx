'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { useProjectStore } from '@/lib/store';
import { useUI } from '@/lib/ui';
import { THEMES } from '@/lib/presets';
import {
  addSlot,
  applyTemplate,
  clearAll,
  copyShareLink,
  doExportJson,
  doExportPdf,
  doExportPng,
  doPrint,
  loadDefaultTemplate,
  runGenerate,
  saveProfile,
} from '@/lib/actions';
import { TABS } from './TabNav';
import { cx } from '@/components/ui/layout-context';

interface Cmd {
  id: string;
  label: string;
  group: string;
  hint?: string;
  run: () => void;
}

function buildCommands(): Cmd[] {
  const ui = useUI.getState();
  const st = useProjectStore.getState();
  const d = st.project.design;
  return [
    { id: 'gen', group: 'Timetable', label: 'Generate my A4 timetable', run: () => void runGenerate(false) },
    { id: 'shuffle', group: 'Timetable', label: 'Shuffle variation', run: () => void runGenerate(true) },
    { id: 'default', group: 'Timetable', label: 'Load default Karo-Ya-Maro template', run: () => void loadDefaultTemplate() },
    { id: 'add-study', group: 'Timetable', label: 'Add study block', run: () => addSlot('study') },
    { id: 'add-break', group: 'Timetable', label: 'Add break', run: () => addSlot('break') },
    { id: 'clear', group: 'Timetable', label: 'Clear all (start blank)', run: () => void clearAll() },
    { id: 'tpl-timeline', group: 'Design', label: 'Template: Timeline', run: () => applyTemplate('timeline') },
    { id: 'tpl-editorial', group: 'Design', label: 'Template: Editorial two-column', run: () => applyTemplate('editorial') },
    { id: 'tpl-minimal', group: 'Design', label: 'Template: Minimal Print', run: () => applyTemplate('minimal') },
    ...THEMES.map((t) => ({ id: `theme-${t.id}`, group: 'Design', label: `Theme: ${t.name}`, run: () => st.setDesign({ themeId: t.id }) })),
    { id: 'cols', group: 'Design', label: d.columns === 1 ? 'Switch to 2 columns' : 'Switch to 1 column', run: () => st.setDesign({ columns: d.columns === 1 ? 2 : 1 }) },
    { id: 'time', group: 'Design', label: d.timeFormat === '12h' ? 'Use 24-hour times' : 'Use 12-hour times', run: () => st.setDesign({ timeFormat: d.timeFormat === '12h' ? '24h' : '12h' }) },
    { id: 'autofit', group: 'Design', label: d.autoFit ? 'Turn Auto-Fit off' : 'Turn Auto-Fit on', run: () => st.setDesign({ autoFit: !d.autoFit }) },
    { id: 'pdf', group: 'Export', label: 'Download A4 PDF', hint: '⌘E', run: () => void doExportPdf() },
    { id: 'png', group: 'Export', label: 'Download Ultra-HD PNG', run: () => void doExportPng() },
    { id: 'print', group: 'Export', label: 'Print', hint: '⌘P', run: () => doPrint() },
    { id: 'json', group: 'Export', label: 'Export project JSON', run: () => void doExportJson() },
    { id: 'share', group: 'Export', label: 'Copy share link', run: () => void copyShareLink() },
    { id: 'save', group: 'Export', label: 'Save profile', hint: '⌘S', run: saveProfile },
    ...TABS.map((t) => ({ id: `tab-${t.id}`, group: 'Go to', label: `Open ${t.label}`, run: () => ui.set({ tab: t.id, mobileTab: t.id === 'design' ? 'design' : t.id === 'export' ? 'export' : 'edit', sheetSnap: 2 }) })),
    { id: 'fit', group: 'View', label: 'Zoom to fit', hint: '⌘0', run: () => ui.setFitZoom() },
    { id: '100', group: 'View', label: 'Zoom to 100%', run: () => ui.setZoom(1) },
    { id: 'theme-app', group: 'View', label: 'Toggle app dark mode', run: () => ui.set({ appTheme: document.documentElement.classList.contains('dark') ? 'light' : 'dark' }) },
    { id: 'shortcuts', group: 'View', label: 'Keyboard shortcuts', hint: '?', run: () => ui.set({ shortcutsOpen: true }) },
  ];
}

/** ⌘K command palette. The body mounts fresh on each open, so its state always starts clean. */
export function CommandPalette() {
  const open = useUI((s) => s.commandOpen);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(<PaletteBody />, document.body);
}

function PaletteBody() {
  const set = useUI((s) => s.set);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const [cmds] = useState(buildCommands);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return cmds;
    return cmds.filter((c) => t.split(/\s+/).every((w) => `${c.label} ${c.group}`.toLowerCase().includes(w)));
  }, [cmds, q]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const close = () => set({ commandOpen: false });
  const run = (c: Cmd) => {
    close();
    setTimeout(c.run, 0);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center px-3 pt-[12vh]" role="presentation">
      <div className="absolute inset-0 bg-black/25 animate-fade-in" onClick={close} />
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="relative flex max-h-[70dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_0.5px_var(--hairline-strong),var(--shadow-lg)] animate-pop-in">
        <div className="hairline-b flex items-center gap-2.5 px-4">
          <Search className="size-[18px] shrink-0 text-ink-3" strokeWidth={1.75} />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(filtered.length - 1, a + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === 'Enter' && filtered[active]) run(filtered[active]);
              else if (e.key === 'Escape') close();
            }}
            placeholder="Type a command — e.g. “editorial”, “pdf”, “add break”"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-activedescendant={filtered[active] ? `cmd-${filtered[active].id}` : undefined}
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3 max-md:text-base"
          />
          <kbd className="rounded-md bg-fill-2 px-1.5 py-0.5 font-mono-ui text-[11px] text-ink-3">esc</kbd>
        </div>
        <div ref={listRef} id="cmd-list" role="listbox" className="scroll-thin min-h-0 flex-1 overflow-y-auto p-1.5">
          {filtered.length === 0 ? <p className="py-8 text-center text-[13px] text-ink-3">No commands found.</p> : null}
          {filtered.map((c, i) => (
            <div key={c.id}>
              {i === 0 || filtered[i - 1].group !== c.group ? <div className="px-2.5 pt-2 pb-1 text-[11px] font-medium text-ink-3">{c.group}</div> : null}
              <button
                id={`cmd-${c.id}`}
                data-idx={i}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseMove={() => setActive(i)}
                onClick={() => run(c)}
                className={cx('flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] pointer-coarse:h-12 pointer-coarse:text-[15px]', i === active ? 'bg-accent text-white' : 'text-ink')}
              >
                <span className="flex-1 truncate">{c.label}</span>
                {c.hint ? <kbd className={cx('font-mono-ui text-[11px]', i === active ? 'text-white/70' : 'text-ink-3')}>{c.hint}</kbd> : null}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

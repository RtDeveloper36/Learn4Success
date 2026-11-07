'use client';
import { useEffect } from 'react';
import { useProjectStore } from '@/lib/store';
import { useUI } from '@/lib/ui';
import { deleteSlot, doExportPdf, doPrint, duplicateSlot, saveProfile } from '@/lib/actions';
import { Dialog } from '@/components/ui/Dialog';

export const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: '⌘ Z', label: 'Undo' },
  { keys: '⇧ ⌘ Z', label: 'Redo' },
  { keys: '⌘ S', label: 'Save profile' },
  { keys: '⌘ E', label: 'Export PDF' },
  { keys: '⌘ P', label: 'Print' },
  { keys: '⌘ K', label: 'Command palette' },
  { keys: '⌘ D', label: 'Duplicate selected slot' },
  { keys: 'Delete', label: 'Delete selected slot' },
  { keys: '⌥ ↑ / ↓', label: 'Move selected slot' },
  { keys: 'Esc', label: 'Deselect / close' },
  { keys: '⌘ 0', label: 'Fit zoom' },
  { keys: '⌘ \\', label: 'Toggle sidebar' },
  { keys: '⌘ + scroll', label: 'Zoom canvas' },
  { keys: 'Space + drag', label: 'Pan canvas' },
  { keys: '?', label: 'Show shortcuts' },
];

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
};

/** Global keyboard shortcuts (⌘ on macOS, Ctrl elsewhere). */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const ui = useUI.getState();
      const typing = isTyping(e.target);
      const k = e.key.toLowerCase();
      const temporal = useProjectStore.temporal.getState();
      const sel = ui.selection?.type === 'slot' ? ui.selection.id : null;

      if (mod && k === 'z') {
        e.preventDefault();
        if (e.shiftKey) temporal.redo();
        else temporal.undo();
        return;
      }
      if (mod && k === 'y') {
        e.preventDefault();
        temporal.redo();
        return;
      }
      if (mod && k === 's') {
        e.preventDefault();
        saveProfile();
        return;
      }
      if (mod && k === 'e') {
        e.preventDefault();
        void doExportPdf();
        return;
      }
      if (mod && k === 'p') {
        e.preventDefault();
        doPrint();
        return;
      }
      if (mod && k === 'k') {
        e.preventDefault();
        ui.set({ commandOpen: !ui.commandOpen });
        return;
      }
      if (mod && k === '0') {
        e.preventDefault();
        ui.setFitZoom();
        return;
      }
      if (mod && k === '\\') {
        e.preventDefault();
        ui.set({ sidebarOpen: !ui.sidebarOpen });
        return;
      }
      if (mod && k === 'd' && sel) {
        e.preventDefault();
        duplicateSlot(sel);
        return;
      }
      if (typing) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
        e.preventDefault();
        deleteSlot(sel);
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && sel) {
        e.preventDefault();
        useProjectStore.getState().moveSlot(sel, e.key === 'ArrowUp' ? -1 : 1);
      } else if (e.key === 'Escape') {
        if (ui.selection) ui.select(null);
      } else if (e.key === '?') {
        ui.set({ shortcutsOpen: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function ShortcutsDialog() {
  const open = useUI((s) => s.shortcutsOpen);
  const set = useUI((s) => s.set);
  return (
    <Dialog open={open} onClose={() => set({ shortcutsOpen: false })} title="Keyboard shortcuts" width={440}>
      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 pb-1 text-[13px]">
        {SHORTCUTS.map((s) => (
          <div key={s.label} className="contents">
            <dt className="text-ink-2">{s.label}</dt>
            <dd>
              <kbd className="rounded-md bg-fill-2 px-1.5 py-0.5 font-mono-ui text-[12px]">{s.keys}</kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}

'use client';
import { useEffect, useLayoutEffect, useRef, type PointerEvent as RPointerEvent } from 'react';
import type { EditorTab } from '@/lib/types';
import { useUI } from '@/lib/ui';
import { SetupTab } from '@/components/editor/SetupTab';
import { ScheduleTab } from '@/components/editor/ScheduleTab';
import { HeaderFooterTab } from '@/components/editor/HeaderFooterTab';
import { DesignTab } from '@/components/editor/DesignTab';
import { ExportTab } from '@/components/editor/ExportTab';
import { TabNav } from './TabNav';

const PANELS: Record<EditorTab, () => React.JSX.Element> = {
  setup: SetupTab,
  schedule: ScheduleTab,
  headerFooter: HeaderFooterTab,
  design: DesignTab,
  export: ExportTab,
};

/** The active editor tab's content, plus scroll-to & focus behaviour for canvas selections. */
export function EditorContent({ tab }: { tab: EditorTab }) {
  const Panel = PANELS[tab];
  const selection = useUI((s) => s.selection);
  const focusTick = useUI((s) => s.focusTick);
  const ref = useRef<HTMLDivElement>(null);

  // A newly opened tab starts at the top (canvas selections then scroll to their target).
  useLayoutEffect(() => {
    ref.current?.closest('[data-scroll]')?.scrollTo({ top: 0 });
  }, [tab]);

  useEffect(() => {
    if (!focusTick || !selection || selection.type === 'slot') return;
    const t = setTimeout(() => {
      const el = document.getElementById(`edit-${selection.type}`);
      // never steal focus from the on-canvas (double-click) text editor
      if (!el || document.querySelector('[data-inline-edit]')) return;
      el.scrollIntoView({ block: 'start', behavior: 'smooth' });
      el.querySelector<HTMLElement>('input, button')?.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(t);
  }, [focusTick, selection]);

  return (
    <div ref={ref} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="animate-fade-in" key={tab}>
      <Panel />
    </div>
  );
}

interface SidebarProps {
  width: number;
  resizable?: boolean;
}

/** Left sidebar: translucent vibrancy, icon tabs, scrollable grouped sections, resizable 320–480px. */
export function Sidebar({ width, resizable = true }: SidebarProps) {
  const tab = useUI((s) => s.tab);
  const setUI = useUI((s) => s.set);
  const drag = useRef<{ x: number; w: number } | null>(null);

  const onDown = (e: RPointerEvent) => {
    drag.current = { x: e.clientX, w: width };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    if (!drag.current) return;
    const w = Math.round(Math.min(480, Math.max(320, drag.current.w + e.clientX - drag.current.x)));
    setUI({ sidebarWidth: w });
  };
  const onUp = () => (drag.current = null);

  return (
    <aside className="vibrancy hairline-r relative flex h-full min-h-0 shrink-0 flex-col" style={{ width }} aria-label="Editor">
      <div className="hairline-b shrink-0 px-3 pt-2.5 pb-2">
        <TabNav />
      </div>
      <div data-scroll className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-4 pb-10">
        <EditorContent tab={tab} />
      </div>
      {resizable ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuemin={320}
          aria-valuemax={480}
          aria-valuenow={width}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setUI({ sidebarWidth: Math.max(320, width - 16) });
            if (e.key === 'ArrowRight') setUI({ sidebarWidth: Math.min(480, width + 16) });
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onDoubleClick={() => setUI({ sidebarWidth: 0 })}
          className="absolute top-0 -right-1 bottom-0 z-10 w-2 cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-accent after:opacity-0 after:transition-opacity hover:after:opacity-100 focus-visible:after:opacity-100"
        />
      ) : null}
    </aside>
  );
}

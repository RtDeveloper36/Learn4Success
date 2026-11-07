'use client';
import { useEffect, useMemo, useRef, type PointerEvent as RPointerEvent } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { hydrateStore, useProjectStore, useSaveStatus } from '@/lib/store';
import { toast, useUI } from '@/lib/ui';
import { decodeShareHash, readPref, writePref } from '@/lib/storage';
import { loadSealDataUrl } from '@/lib/seal';
import { generateForExam } from '@/lib/actions';
import type { EditorTab } from '@/lib/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useScrollFocusedIntoView } from '@/hooks/useVisualViewport';
import { LayoutContext } from '@/components/ui/layout-context';
import { Toaster } from '@/components/ui/Toast';
import { IconButton } from '@/components/ui/Button';
import { Toolbar } from './Toolbar';
import { Sidebar, EditorContent } from './Sidebar';
import { CanvasStage } from './CanvasStage';
import { Inspector } from './Inspector';
import { CompareView } from './CompareView';
import { MobileBar, MobileTopBar, MOBILE_BAR_H } from './MobileBar';
import { BottomSheet } from './BottomSheet';
import { TabNav } from './TabNav';
import { CommandPalette } from './CommandPalette';
import { ShortcutsDialog, useShortcuts } from './Shortcuts';
import { ConfirmHost, ExportHost, ExportProgressDialog, MeasureHost, PrintHost, PrintTipDialog } from './Hosts';

const EDIT_SUBSET: EditorTab[] = ['setup', 'schedule', 'headerFooter'];

function useAppBootstrap() {
  const appTheme = useUI((s) => s.appTheme);

  // Hydrate saved data after mount (defaults render first → no hydration mismatch), then
  // open a shared project from the URL hash if present.
  useEffect(() => {
    useUI.getState().loadPrefs();
    const openShared = () => {
      if (!location.hash.includes('share=')) return;
      const shared = decodeShareHash(location.hash);
      history.replaceState(null, '', location.pathname + location.search);
      if (shared) {
        useProjectStore.getState().importProject({ ...shared, name: `${shared.name} (shared)` });
        toast('Shared timetable opened as a new profile', { tone: 'success' });
      } else toast('That share link is invalid or damaged', { tone: 'error' });
    };
    void loadSealDataUrl().catch(() => undefined);
    void hydrateStore().then(() => {
      if (useSaveStatus.getState().corrupted) toast('Saved data could not be read — defaults loaded', { tone: 'error' });
      openShared();
      // /studio/?exam=<name> (welcome-page exam chips): pre-fill + generate
      const params = new URLSearchParams(location.search);
      const exam = params.get('exam')?.trim();
      if (exam) {
        history.replaceState(null, '', location.pathname + location.hash);
        generateForExam(exam.slice(0, 80));
      }
      // One-time tip after arriving from the welcome page
      try {
        const fromWelcome = sessionStorage.getItem('l4s:fromWelcome') === '1';
        sessionStorage.removeItem('l4s:fromWelcome');
        if (fromWelcome && !readPref('cardTipShown', false)) {
          writePref('cardTipShown', true);
          setTimeout(() => toast('Tip: click any card on the timetable to edit it.', { duration: 9000, action: { label: 'Got it', run: () => undefined } }), 900);
        }
      } catch {
        /* storage blocked — skip the tip */
      }
    });
    window.addEventListener('hashchange', openShared);
    return () => window.removeEventListener('hashchange', openShared);
  }, []);

  // App light/dark follows the system unless toggled. Independent of the poster theme.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', appTheme === 'dark' || (appTheme === 'system' && mq.matches));
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [appTheme]);
}

function TabletPanel() {
  const tab = useUI((s) => s.tab);
  const h = useUI((s) => s.panelHeight);
  const set = useUI((s) => s.set);
  const drag = useRef<{ y: number; h: number } | null>(null);
  const onDown = (e: RPointerEvent) => {
    drag.current = { y: e.clientY, h };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent) => {
    if (!drag.current) return;
    const next = drag.current.h - (e.clientY - drag.current.y) / window.innerHeight;
    set({ panelHeight: Math.min(0.92, Math.max(0.2, next)) });
  };
  const full = h > 0.85;
  return (
    <section className="hairline-t flex shrink-0 flex-col bg-app" style={{ height: `${h * 100}%` }} aria-label="Editor">
      <div
        className="flex h-6 shrink-0 cursor-row-resize touch-none items-center justify-center"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize editor panel"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') set({ panelHeight: Math.min(0.92, h + 0.05) });
          if (e.key === 'ArrowDown') set({ panelHeight: Math.max(0.2, h - 0.05) });
        }}
      >
        <span className="h-[5px] w-10 rounded-full bg-hairline-strong" />
      </div>
      <div className="flex shrink-0 items-center gap-2 px-4 pb-2">
        <div className="min-w-0 flex-1">
          <TabNav variant="segmented" />
        </div>
        <IconButton label={full ? 'Exit full-screen editor' : 'Full-screen editor'} onClick={() => set({ panelHeight: full ? 0.45 : 0.92 })}>
          {full ? <Minimize2 strokeWidth={1.75} /> : <Maximize2 strokeWidth={1.75} />}
        </IconButton>
      </div>
      <div data-scroll className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10">
        <div className="mx-auto max-w-[640px]">
          <EditorContent tab={tab} />
        </div>
      </div>
    </section>
  );
}

export function ResponsiveShell() {
  const info = useBreakpoint();
  const { bp } = info;
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const sidebarWidthPref = useUI((s) => s.sidebarWidth);
  const inspectorOpen = useUI((s) => s.inspectorOpen);
  const compareOpen = useUI((s) => s.compareOpen);
  const mobileTab = useUI((s) => s.mobileTab);
  const tab = useUI((s) => s.tab);
  const set = useUI((s) => s.set);
  useAppBootstrap();
  useShortcuts();
  useScrollFocusedIntoView(info.stacked);

  const showInspector = (bp === 'desktop' || bp === 'wide') && inspectorOpen;
  useEffect(() => {
    if (useUI.getState().inspectorActive !== showInspector) set({ inspectorActive: showInspector });
  }, [showInspector, set]);

  const layout = useMemo(() => ({ bp, stacked: info.stacked, touch: info.touch, small: info.small }), [bp, info.stacked, info.touch, info.small]);
  const autoWidth = bp === 'wide' ? 420 : bp === 'desktop' ? 400 : info.width < 1280 ? 320 : 380;
  const sidebarWidth = sidebarWidthPref || autoWidth;

  let body: React.ReactNode;
  if (bp === 'phone') {
    const sheetTab: EditorTab = mobileTab === 'design' ? 'design' : mobileTab === 'export' ? 'export' : EDIT_SUBSET.includes(tab) ? tab : 'schedule';
    body = (
      <>
        <MobileTopBar />
        <main className="relative min-h-0 flex-1">
          <CanvasStage fitMode="width" padding={info.small ? 10 : 16} />
        </main>
        <BottomSheet
          bottom={MOBILE_BAR_H}
          header={mobileTab === 'edit' ? <TabNav variant="segmented" subset={EDIT_SUBSET} /> : <h2 className="px-1 text-[17px] font-semibold">{mobileTab === 'design' ? 'Design' : 'Export'}</h2>}
        >
          <EditorContent tab={sheetTab} />
        </BottomSheet>
        <MobileBar />
      </>
    );
  } else if (bp === 'tablet') {
    body = (
      <>
        <Toolbar bp={bp} width={info.width} sidebarOpen={false} />
        <main className="relative min-h-0 flex-1">
          <CanvasStage fitMode="width" padding={20} />
        </main>
        <TabletPanel />
      </>
    );
  } else {
    body = (
      <>
        <Toolbar bp={bp} width={info.width} sidebarOpen={sidebarOpen} onToggleSidebar={() => set({ sidebarOpen: !sidebarOpen })} />
        <div className="flex min-h-0 flex-1">
          {sidebarOpen ? <Sidebar width={sidebarWidth} /> : null}
          <main className="relative min-w-0 flex-1">{bp === 'wide' && compareOpen ? <CompareView /> : <CanvasStage fitMode="page" maxFitZoom={bp === 'wide' ? 1 : 1.25} />}</main>
          {showInspector ? <Inspector width={bp === 'wide' ? 320 : 300} /> : null}
        </div>
      </>
    );
  }

  return (
    <LayoutContext.Provider value={layout}>
      <div className="flex h-dvh w-full flex-col overflow-clip bg-app text-ink" data-bp={bp}>
        {body}
      </div>
      <MeasureHost />
      <ExportHost />
      <PrintHost />
      <CommandPalette />
      <ShortcutsDialog />
      <ConfirmHost />
      <PrintTipDialog />
      <ExportProgressDialog />
      <Toaster bottomOffset={bp === 'phone' ? MOBILE_BAR_H : 0} />
    </LayoutContext.Provider>
  );
}

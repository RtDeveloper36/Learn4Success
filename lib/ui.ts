'use client';
/** UI state that is not part of the project (selection, zoom, panels, toasts, dialogs). */
import { create } from 'zustand';
import type { EditorTab, FitResult, Selection } from './types';
import { readPref, writePref } from './storage';

export type AppTheme = 'system' | 'light' | 'dark';
export type MobileTab = 'edit' | 'preview' | 'design' | 'export';

export interface UIState {
  selection: Selection;
  tab: EditorTab;
  expandedSlotId: string | null;
  /** increments whenever the editor should scroll to & focus the selected item */
  focusTick: number;

  zoom: number;
  zoomMode: 'fit' | 'manual';
  fit: FitResult;

  sidebarOpen: boolean;
  sidebarWidth: number;
  inspectorOpen: boolean;
  compareOpen: boolean;
  sheetSnap: 0 | 1 | 2 | 3;
  mobileTab: MobileTab;
  panelHeight: number;

  commandOpen: boolean;
  shortcutsOpen: boolean;
  appTheme: AppTheme;

  autoChain: boolean;
  chainMode: 'all' | 'next';
  exportQuality: 'png' | 'jpeg';
  recentColors: string[];
  printTipDismissed: boolean;
  printTipOpen: boolean;
  /** right inspector is visible — the Schedule list then stays collapsed */
  inspectorActive: boolean;

  select: (sel: Selection, opts?: { focus?: boolean }) => void;
  setTab: (tab: EditorTab) => void;
  setExpanded: (id: string | null) => void;
  setZoom: (z: number) => void;
  setFitZoom: () => void;
  setFit: (f: FitResult) => void;
  set: (patch: Partial<UIState>) => void;
  pushRecentColor: (hex: string) => void;
  loadPrefs: () => void;
}

const tabFor = (sel: Selection): EditorTab | null => {
  if (!sel) return null;
  if (sel.type === 'slot') return 'schedule';
  return 'headerFooter';
};

export const useUI = create<UIState>((set, get) => ({
  selection: null,
  tab: 'setup',
  expandedSlotId: null,
  focusTick: 0,

  zoom: 0.6,
  zoomMode: 'fit',
  // initial k matches the default project's measured fit, so the pre-rendered poster looks right
  fit: { k: 0.905, scale: 1, split: null, status: 'fits', contentHeight: 0 },

  sidebarOpen: true,
  /** 0 = automatic width for the current breakpoint */
  sidebarWidth: 0,
  inspectorOpen: true,
  compareOpen: false,
  sheetSnap: 0,
  mobileTab: 'preview',
  panelHeight: 0.45,

  commandOpen: false,
  shortcutsOpen: false,
  appTheme: 'system',

  autoChain: true,
  chainMode: 'all',
  exportQuality: 'png',
  recentColors: [],
  printTipDismissed: false,
  printTipOpen: false,
  inspectorActive: false,

  select: (selection, opts) => {
    const tab = tabFor(selection);
    set((s) => ({
      selection,
      tab: tab ?? s.tab,
      expandedSlotId: selection?.type === 'slot' ? selection.id : s.expandedSlotId,
      focusTick: opts?.focus ? s.focusTick + 1 : s.focusTick,
      mobileTab: tab && opts?.focus ? 'edit' : s.mobileTab,
      sheetSnap: tab && opts?.focus && s.sheetSnap < 2 ? 2 : s.sheetSnap,
    }));
  },
  setTab: (tab) => set({ tab }),
  setExpanded: (expandedSlotId) => set({ expandedSlotId }),
  setZoom: (z) => set({ zoom: Math.min(2, Math.max(0.25, z)), zoomMode: 'manual' }),
  setFitZoom: () => set({ zoomMode: 'fit' }),
  setFit: (fit) => {
    const f = get().fit;
    if (f.k === fit.k && f.scale === fit.scale && f.status === fit.status && JSON.stringify(f.split) === JSON.stringify(fit.split)) return;
    set({ fit });
  },
  set: (patch) => {
    set(patch);
    const persistKeys: (keyof UIState)[] = ['appTheme', 'autoChain', 'chainMode', 'exportQuality', 'recentColors', 'printTipDismissed', 'sidebarWidth', 'inspectorOpen'];
    persistKeys.forEach((k) => {
      if (k in patch) writePref(k, patch[k]);
    });
  },
  pushRecentColor: (hex) => {
    const recentColors = [hex, ...get().recentColors.filter((c) => c !== hex)].slice(0, 8);
    set({ recentColors });
    writePref('recentColors', recentColors);
  },
  loadPrefs: () =>
    set({
      appTheme: readPref<AppTheme>('appTheme', 'system'),
      autoChain: readPref('autoChain', true),
      chainMode: readPref<'all' | 'next'>('chainMode', 'all'),
      exportQuality: readPref<'png' | 'jpeg'>('exportQuality', 'png'),
      recentColors: readPref<string[]>('recentColors', []),
      printTipDismissed: readPref('printTipDismissed', false),
      sidebarWidth: readPref('sidebarWidth', 0),
      inspectorOpen: readPref('inspectorOpen', true),
    }),
}));

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

export interface Toast {
  id: number;
  message: string;
  tone: 'neutral' | 'success' | 'error';
  action?: { label: string; run: () => void };
  duration: number;
}

export const useToasts = create<{ toasts: Toast[] }>(() => ({ toasts: [] }));
let toastId = 0;

export function toast(message: string, opts: Partial<Omit<Toast, 'id' | 'message'>> = {}): number {
  const id = ++toastId;
  const t: Toast = { id, message, tone: opts.tone ?? 'neutral', action: opts.action, duration: opts.duration ?? (opts.action ? 6000 : 3200) };
  useToasts.setState((s) => ({ toasts: [...s.toasts.slice(-2), t] }));
  setTimeout(() => dismissToast(id), t.duration);
  return id;
}

export function dismissToast(id: number) {
  useToasts.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

/* ------------------------------------------------------------------ */
/* Confirm dialog                                                      */
/* ------------------------------------------------------------------ */

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  resolve: (ok: boolean) => void;
}

export const useConfirm = create<{ request: ConfirmRequest | null }>(() => ({ request: null }));

export function confirmDialog(opts: Omit<ConfirmRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirm.setState({
      request: {
        ...opts,
        resolve: (ok) => {
          useConfirm.setState({ request: null });
          resolve(ok);
        },
      },
    });
  });
}

/* ------------------------------------------------------------------ */
/* Export progress                                                     */
/* ------------------------------------------------------------------ */

export type ExportStep = 'fonts' | 'render' | 'build' | 'done';
export const useExportProgress = create<{
  active: boolean;
  kind: 'pdf' | 'png' | null;
  step: ExportStep;
  error: string | null;
}>(() => ({ active: false, kind: null, step: 'fonts', error: null }));

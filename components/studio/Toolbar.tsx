'use client';
import Link from 'next/link';
import { useStore } from 'zustand';
import { BRAND } from '@/lib/brand';
import {
  Check,
  ChevronDown,
  Cloud,
  CloudUpload,
  Columns2,
  Command,
  Download,
  FileDown,
  FileJson,
  Image as ImageIcon,
  Monitor,
  Moon,
  PanelLeft,
  PanelRight,
  Plus,
  Printer,
  Redo2,
  Sun,
  Undo2,
} from 'lucide-react';
import { useProjectStore, useSaveStatus } from '@/lib/store';
import { useExportProgress, useUI, type AppTheme } from '@/lib/ui';
import { doExportJson, doExportPdf, doExportPng, doPrint } from '@/lib/actions';
import { createBlankProject } from '@/lib/defaults';
import { Button, IconButton } from '@/components/ui/Button';
import { Popover } from '@/components/ui/Popover';
import { Tooltip } from '@/components/ui/Tooltip';
import { cx } from '@/components/ui/layout-context';
import { ZoomControl } from './ZoomControl';
import type { Breakpoint } from '@/hooks/useBreakpoint';

/** Library seal (32px) + "Timetable Studio". Clicking it returns to the welcome page. */
export function AppMark({ withName }: { withName: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 rounded-lg pr-1 hover:opacity-85" aria-label={`Timetable Studio · ${BRAND.name} Library — back to welcome page`} data-app-mark>
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, fixed size */}
      <img src={BRAND.seal} alt="" width={32} height={32} className="size-8 shrink-0 rounded-full" />
      {withName ? <span className="truncate text-[15px] font-semibold tracking-[-0.01em]">Timetable Studio</span> : null}
    </Link>
  );
}

export function UndoRedo() {
  const canUndo = useStore(useProjectStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useProjectStore.temporal, (s) => s.futureStates.length > 0);
  const { undo, redo } = useProjectStore.temporal.getState();
  return (
    <div className="flex items-center">
      <IconButton label="Undo" shortcut="⌘Z" disabled={!canUndo} onClick={() => undo()}>
        <Undo2 strokeWidth={1.75} />
      </IconButton>
      <IconButton label="Redo" shortcut="⇧⌘Z" disabled={!canRedo} onClick={() => redo()}>
        <Redo2 strokeWidth={1.75} />
      </IconButton>
    </div>
  );
}

function SaveStatus() {
  const status = useSaveStatus((s) => s.status);
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-ink-3" role="status" aria-live="polite">
      {status === 'saving' ? <CloudUpload className="size-3.5" strokeWidth={1.75} /> : <Cloud className="size-3.5" strokeWidth={1.75} />}
      {status === 'saving' ? 'Saving…' : 'Saved'}
    </span>
  );
}

function ProfileSwitcher() {
  const project = useProjectStore((s) => s.project);
  const library = useProjectStore((s) => s.library);
  const switchProfile = useProjectStore((s) => s.switchProfile);
  const importProject = useProjectStore((s) => s.importProject);
  const saveAsNew = useProjectStore((s) => s.saveAsNew);
  const profiles = library.map((p) => (p.id === project.id ? project : p));
  return (
    <Popover
      title="Profiles"
      width={260}
      trigger={(p) => (
        <button type="button" {...p} className="flex h-8 max-w-[200px] min-w-0 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium hover:bg-fill-2 pointer-coarse:h-11">
          <span className="truncate">{project.name}</span>
          <ChevronDown className="size-3.5 shrink-0 text-ink-2" strokeWidth={2} />
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col">
          <div className="px-2 pb-1 text-[11px] font-medium text-ink-3">Profiles</div>
          {profiles.map((pr) => (
            <button
              key={pr.id}
              type="button"
              onClick={() => {
                switchProfile(pr.id);
                close();
              }}
              className="flex h-9 items-center gap-2 rounded-lg px-2 text-left text-[13px] hover:bg-fill-2 pointer-coarse:h-12"
            >
              <Check className={cx('size-4 shrink-0 text-accent', pr.id !== project.id && 'invisible')} strokeWidth={2} />
              <span className="truncate">{pr.name}</span>
            </button>
          ))}
          <div className="my-1 h-px bg-hairline" />
          <button
            type="button"
            onClick={() => {
              saveAsNew();
              close();
            }}
            className="flex h-9 items-center gap-2 rounded-lg px-2 text-left text-[13px] hover:bg-fill-2 pointer-coarse:h-12"
          >
            <Plus className="size-4 text-ink-2" strokeWidth={1.75} /> Save as new profile
          </button>
          <button
            type="button"
            onClick={() => {
              importProject(createBlankProject(`Blank ${profiles.length + 1}`));
              close();
            }}
            className="flex h-9 items-center gap-2 rounded-lg px-2 text-left text-[13px] hover:bg-fill-2 pointer-coarse:h-12"
          >
            <Plus className="size-4 text-ink-2" strokeWidth={1.75} /> New blank profile
          </button>
        </div>
      )}
    </Popover>
  );
}

export function ExportMenuItems({ close }: { close: () => void }) {
  const items = [
    { icon: FileDown, label: 'Download A4 PDF', hint: '⌘E', run: doExportPdf },
    { icon: ImageIcon, label: 'Download Ultra-HD PNG', hint: '', run: doExportPng },
    { icon: Printer, label: 'Print / Save as vector PDF', hint: '⌘P', run: doPrint },
    { icon: FileJson, label: 'Export project JSON', hint: '', run: doExportJson },
  ];
  return (
    <div className="flex flex-col" role="menu">
      {items.map((i) => (
        <button
          key={i.label}
          type="button"
          role="menuitem"
          onClick={() => {
            close();
            void i.run();
          }}
          className="flex h-10 items-center gap-2.5 rounded-lg px-2 text-left text-[13px] hover:bg-fill-2 pointer-coarse:h-12 pointer-coarse:text-[15px]"
        >
          <i.icon className="size-4 text-ink-2" strokeWidth={1.75} />
          <span className="flex-1">{i.label}</span>
          {i.hint ? <kbd className="font-mono-ui text-[11px] text-ink-3">{i.hint}</kbd> : null}
        </button>
      ))}
    </div>
  );
}

function DownloadSplitButton({ iconOnly }: { iconOnly: boolean }) {
  const busy = useExportProgress((s) => s.active);
  return (
    <div className="flex items-center">
      <Button variant="primary" className="rounded-r-none pr-3" loading={busy} icon={<Download strokeWidth={1.75} />} onClick={() => void doExportPdf()} title="Download PDF (⌘E)">
        {iconOnly ? <span className="sr-only">Download PDF</span> : 'Download PDF'}
      </Button>
      <Popover
        title="Export"
        width={270}
        align="end"
        trigger={(p) => (
          <button type="button" {...p} aria-label="More export options" className="grid h-9 w-8 place-items-center rounded-r-[10px] border-l border-white/25 bg-accent text-white hover:brightness-110 pointer-coarse:h-11 pointer-coarse:w-10">
            <ChevronDown className="size-4" strokeWidth={2} />
          </button>
        )}
      >
        {(close) => <ExportMenuItems close={close} />}
      </Popover>
    </div>
  );
}

export function AppThemeToggle() {
  const theme = useUI((s) => s.appTheme);
  const set = useUI((s) => s.set);
  const next: Record<AppTheme, AppTheme> = { system: 'light', light: 'dark', dark: 'system' };
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  return (
    <IconButton label={`App appearance: ${theme} (click to change)`} onClick={() => set({ appTheme: next[theme] })}>
      <Icon strokeWidth={1.75} />
    </IconButton>
  );
}

interface ToolbarProps {
  bp: Breakpoint;
  width: number;
  sidebarOpen: boolean;
  onToggleSidebar?: () => void;
}

/** 56px top toolbar for tablet & larger. */
export function Toolbar({ bp, width, sidebarOpen, onToggleSidebar }: ToolbarProps) {
  const setUI = useUI((s) => s.set);
  const inspectorOpen = useUI((s) => s.inspectorOpen);
  const compareOpen = useUI((s) => s.compareOpen);
  // 1024–1279: labels collapse to icons with tooltips
  const iconOnly = bp === 'tablet' || (bp === 'laptop' && width < 1280);
  return (
    <header className="vibrancy hairline-b safe-top safe-x relative z-30 flex h-14 shrink-0 items-center gap-1.5 px-3" style={{ height: 'calc(56px + env(safe-area-inset-top))' }}>
      {onToggleSidebar ? (
        <IconButton label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'} shortcut="⌘\" onClick={onToggleSidebar} active={sidebarOpen}>
          <PanelLeft strokeWidth={1.75} />
        </IconButton>
      ) : null}
      <AppMark withName={!iconOnly} />
      <div className="mx-1 h-5 w-px bg-hairline-strong" />
      <ProfileSwitcher />
      <UndoRedo />
      <div className="hidden lg:block">
        <SaveStatus />
      </div>
      <div className="flex-1" />
      <ZoomControl compact={bp === 'tablet'} />
      <Tooltip content="Command palette" shortcut="⌘K">
        <IconButton label="Command palette" onClick={() => setUI({ commandOpen: true })}>
          <Command strokeWidth={1.75} />
        </IconButton>
      </Tooltip>
      <AppThemeToggle />
      {bp === 'desktop' || bp === 'wide' ? (
        <IconButton label={inspectorOpen ? 'Hide inspector' : 'Show inspector'} active={inspectorOpen} onClick={() => setUI({ inspectorOpen: !inspectorOpen })}>
          <PanelRight strokeWidth={1.75} />
        </IconButton>
      ) : null}
      {bp === 'wide' ? (
        <IconButton label={compareOpen ? 'Close compare view' : 'Compare templates side by side'} active={compareOpen} onClick={() => setUI({ compareOpen: !compareOpen })}>
          <Columns2 strokeWidth={1.75} />
        </IconButton>
      ) : null}
      <div className="ml-1">
        <DownloadSplitButton iconOnly={iconOnly} />
      </div>
    </header>
  );
}

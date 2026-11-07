'use client';
import { useRef, useState } from 'react';
import { Copy, FileDown, FileJson, Image as ImageIcon, Link2, Pencil, Plus, Printer, Trash2, Upload } from 'lucide-react';
import { useProjectStore } from '@/lib/store';
import { confirmDialog, toast, useExportProgress, useUI } from '@/lib/ui';
import { exportFilename } from '@/lib/schedule';
import { readProjectFile } from '@/lib/storage';
import { copyShareLink, doExportJson, doExportPdf, doExportPng, doPrint } from '@/lib/actions';
import type { Project } from '@/lib/types';
import { Group } from '@/components/ui/Group';
import { Button, IconButton } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Poster } from '@/components/poster/Poster';
import { cx } from '@/components/ui/layout-context';

const THUMB_FIT = { k: 0.86, scale: 1, split: null, status: 'fits' as const, contentHeight: 0 };

function relTime(t: number): string {
  if (!t) return 'Default';
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
}

function Thumb({ project, live }: { project: Project; live: boolean }) {
  const fit = useUI((s) => s.fit);
  return (
    <div className="relative h-[70px] w-[50px] shrink-0 overflow-hidden rounded-[4px] bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.1)]" aria-hidden>
      <div style={{ transform: `scale(${50 / 794})`, transformOrigin: 'top left', width: 794, height: 1123 }}>
        <Poster project={project} fit={live ? fit : THUMB_FIT} mode="thumb" />
      </div>
    </div>
  );
}

export function ExportTab() {
  const project = useProjectStore((s) => s.project);
  const library = useProjectStore((s) => s.library);
  const switchProfile = useProjectStore((s) => s.switchProfile);
  const saveAsNew = useProjectStore((s) => s.saveAsNew);
  const duplicateProfile = useProjectStore((s) => s.duplicateProfile);
  const deleteProfile = useProjectStore((s) => s.deleteProfile);
  const renameProfile = useProjectStore((s) => s.renameProfile);
  const importProject = useProjectStore((s) => s.importProject);
  const quality = useUI((s) => s.exportQuality);
  const setUI = useUI((s) => s.set);
  const busy = useExportProgress((s) => s.active);
  const fileRef = useRef<HTMLInputElement>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const profiles = library.map((p) => (p.id === project.id ? project : p)).sort((a, b) => b.updatedAt - a.updatedAt);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    setImportError(null);
    const res = await readProjectFile(file);
    if (!res.ok) {
      setImportError(res.error);
      toast('Import failed', { tone: 'error' });
      return;
    }
    const ok = await confirmDialog({
      title: 'Import project?',
      message: `“${res.project.name}” will be added as a new profile and opened. Your current profile is kept.`,
      confirmLabel: 'Import',
    });
    if (!ok) return;
    importProject(res.project);
    toast(`Imported “${res.project.name}”`, { tone: 'success' });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="px-1">
        <h2 className="app-heading font-semibold">Export & Profiles</h2>
        <p className="mt-0.5 text-[12px] text-ink-2">Single-page A4 · 210 × 297 mm · rendered at 300 DPI.</p>
      </div>

      <Group title="Download">
        <Button variant="primary" size="lg" block icon={<FileDown strokeWidth={1.75} />} loading={busy} onClick={() => void doExportPdf()}>
          Download A4 PDF
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button icon={<ImageIcon strokeWidth={1.75} />} disabled={busy} onClick={() => void doExportPng()}>
            Ultra-HD PNG
          </Button>
          <Button icon={<Printer strokeWidth={1.75} />} onClick={() => doPrint()}>
            Print
          </Button>
        </div>
        <SegmentedControl<'png' | 'jpeg'>
          label="PDF quality"
          value={quality}
          onChange={(exportQuality) => setUI({ exportQuality })}
          options={[
            { value: 'png', label: 'High quality PNG' },
            { value: 'jpeg', label: 'Smaller file JPEG' },
          ]}
        />
        <div className="rounded-lg bg-fill-2 px-2.5 py-2">
          <div className="text-[11px] text-ink-3">Filename</div>
          <div className="truncate font-mono-ui text-[12px]" title={exportFilename(project.content, 'pdf')}>
            {exportFilename(project.content, 'pdf')}
          </div>
        </div>
      </Group>

      <Group
        title="Profiles"
        action={
          <Button size="sm" variant="ghost" icon={<Plus strokeWidth={1.75} />} onClick={() => { saveAsNew(); toast('Saved as a new profile', { tone: 'success' }); }}>
            Save as new
          </Button>
        }
      >
        <ul className="-mx-1 flex flex-col">
          {profiles.map((p) => {
            const active = p.id === project.id;
            return (
              <li key={p.id} className={cx('flex items-center gap-2.5 rounded-lg p-1.5', active && 'bg-accent-soft')}>
                {renaming === p.id ? (
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <Thumb project={p} live={active} />
                    <input
                      autoFocus
                      defaultValue={p.name}
                      aria-label="Profile name"
                      onBlur={(e) => {
                        renameProfile(p.id, e.target.value.trim() || p.name);
                        setRenaming(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                      className="h-9 min-w-0 flex-1 rounded-lg bg-surface px-2 text-[13px] shadow-[0_0_0_1px_var(--accent)] outline-none max-md:text-base"
                    />
                  </span>
                ) : (
                  <button type="button" onClick={() => switchProfile(p.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left" aria-current={active ? 'true' : undefined} aria-label={`Open profile ${p.name}`}>
                    <Thumb project={p} live={active} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{p.name}</span>
                      <span className="block text-[11px] text-ink-3">
                        {active ? 'Open · ' : ''}
                        {relTime(p.updatedAt)}
                      </span>
                    </span>
                  </button>
                )}
                <IconButton size="sm" label={`Rename ${p.name}`} onClick={() => setRenaming(p.id)}>
                  <Pencil strokeWidth={1.75} />
                </IconButton>
                <IconButton size="sm" label={`Duplicate ${p.name}`} onClick={() => duplicateProfile(p.id)}>
                  <Copy strokeWidth={1.75} />
                </IconButton>
                <IconButton
                  size="sm"
                  label={`Delete ${p.name}`}
                  onClick={async () => {
                    const ok = await confirmDialog({ title: `Delete “${p.name}”?`, message: 'This profile will be permanently removed from this browser.', confirmLabel: 'Delete Profile', destructive: true });
                    if (ok) deleteProfile(p.id);
                  }}
                >
                  <Trash2 strokeWidth={1.75} />
                </IconButton>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group title="Share & backup" footer="Share links store the whole timetable in the URL — nothing is uploaded anywhere.">
        <Button icon={<Link2 strokeWidth={1.75} />} onClick={() => void copyShareLink()}>
          Copy share link
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button icon={<FileJson strokeWidth={1.75} />} onClick={() => void doExportJson()}>
            Export JSON
          </Button>
          <Button icon={<Upload strokeWidth={1.75} />} onClick={() => fileRef.current?.click()}>
            Import JSON
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Import project JSON"
          onChange={(e) => {
            void onImport(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {importError ? (
          <p role="alert" className="rounded-lg bg-danger-soft px-2.5 py-2 text-[12px] text-danger">
            {importError}
          </p>
        ) : null}
      </Group>
    </div>
  );
}

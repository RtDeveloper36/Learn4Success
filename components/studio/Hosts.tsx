'use client';
/**
 * Invisible infrastructure: the auto-fit measurement node, the off-screen export node,
 * the print root, and global dialogs (confirm, export progress, print tip).
 */
import { useEffect, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Check, LoaderCircle } from 'lucide-react';
import { useProjectStore } from '@/lib/store';
import { useConfirm, useExportProgress, useUI, type ExportStep } from '@/lib/ui';
import { registerExportNode, printPoster } from '@/lib/export';
import { FitProbe } from '@/components/poster/FitProbe';
import { Poster } from '@/components/poster/Poster';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { cx } from '@/components/ui/layout-context';

const offscreen = { position: 'fixed', left: -20000, top: 0, pointerEvents: 'none', contain: 'layout style' } as const;

export { FitProbe };

export function MeasureHost() {
  const project = useProjectStore((s) => s.project);
  const setFit = useUI((s) => s.setFit);
  return <FitProbe project={project} onFit={setFit} />;
}

/** Off-screen 794 × 1123 export node, mounted only while an export runs. */
export function ExportHost() {
  const active = useExportProgress((s) => s.active);
  const project = useProjectStore((s) => s.project);
  const fit = useUI((s) => s.fit);
  if (!active) return null;
  return (
    <div style={offscreen} aria-hidden>
      <Poster ref={registerExportNode} project={project} fit={fit} mode="export" style={{ transform: 'none' }} />
    </div>
  );
}

/** Print root (210 × 297 mm) mounted on `beforeprint`, so ⌘P and the Print button both work. */
export function PrintHost() {
  const [printing, setPrinting] = useState(false);
  const project = useProjectStore((s) => s.project);
  const fit = useUI((s) => s.fit);
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);
  if (!printing || typeof document === 'undefined') return null;
  return createPortal(
    <div className="print-root">
      <Poster project={project} fit={fit} mode="print" />
    </div>,
    document.body,
  );
}

export function ConfirmHost() {
  const req = useConfirm((s) => s.request);
  return (
    <Dialog
      open={!!req}
      role="alertdialog"
      onClose={() => req?.resolve(false)}
      title={req?.title ?? ''}
      description={req?.message}
      footer={
        <>
          <Button onClick={() => req?.resolve(false)}>Cancel</Button>
          <Button data-autofocus variant={req?.destructive ? 'destructive' : 'primary'} className={req?.destructive ? '!bg-danger !text-white' : ''} onClick={() => req?.resolve(true)}>
            {req?.confirmLabel ?? 'OK'}
          </Button>
        </>
      }
    />
  );
}

const STEPS: { id: ExportStep; label: string }[] = [
  { id: 'fonts', label: 'Preparing fonts' },
  { id: 'render', label: 'Rendering at 300 DPI' },
  { id: 'build', label: 'Building A4 file' },
  { id: 'done', label: 'Done' },
];

export function ExportProgressDialog() {
  const { active, step, kind } = useExportProgress();
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    <Dialog open={active} persistent onClose={() => undefined} title={kind === 'png' ? 'Exporting Ultra-HD PNG' : 'Exporting A4 PDF'} width={360}>
      <ol className="flex flex-col gap-2.5 pb-1" aria-live="polite">
        {STEPS.map((s, i) => (
          <li key={s.id} className={cx('flex items-center gap-2.5 text-[13px]', i > idx ? 'text-ink-3' : 'text-ink')}>
            <span className={cx('grid size-5 place-items-center rounded-full', i < idx || step === 'done' ? 'bg-success text-white' : i === idx ? 'text-accent' : 'bg-fill-2')}>
              {i < idx || step === 'done' ? <Check className="size-3" strokeWidth={3} /> : i === idx ? <LoaderCircle className="size-4 animate-spin" strokeWidth={2} /> : null}
            </span>
            {s.id === 'build' && kind === 'pdf' ? 'Building A4 PDF' : s.label}
          </li>
        ))}
      </ol>
    </Dialog>
  );
}

export function PrintTipDialog() {
  const open = useUI((s) => s.printTipOpen);
  const set = useUI((s) => s.set);
  const [dontShow, setDontShow] = useState(false);
  const close = () => set({ printTipOpen: false });
  return (
    <Dialog
      open={open}
      onClose={close}
      title="Print a perfect A4 page"
      description="In the print dialog: set Margins to None, turn off Headers & Footers, and turn on Background graphics. Choose “Save as PDF” for a vector PDF."
      footer={
        <>
          <label className="mr-auto flex cursor-pointer items-center gap-2 text-[13px] text-ink-2 pointer-coarse:min-h-11">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            Don’t show again
          </label>
          <Button onClick={close}>Cancel</Button>
          <Button
            variant="primary"
            data-autofocus
            onClick={() => {
              set({ printTipOpen: false, ...(dontShow ? { printTipDismissed: true } : {}) });
              setTimeout(printPoster, 60);
            }}
          >
            Print
          </Button>
        </>
      }
    />
  );
}

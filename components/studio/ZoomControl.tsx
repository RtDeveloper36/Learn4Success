'use client';
import { Minus, Plus } from 'lucide-react';
import { useUI } from '@/lib/ui';
import { IconButton } from '@/components/ui/Button';
import { cx } from '@/components/ui/layout-context';

/** − / % / + / Fit */
export function ZoomControl({ compact }: { compact?: boolean }) {
  const zoom = useUI((s) => s.zoom);
  const mode = useUI((s) => s.zoomMode);
  const setZoom = useUI((s) => s.setZoom);
  const setFit = useUI((s) => s.setFitZoom);
  const steps = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.25, 1.5, 2];
  const next = (dir: 1 | -1) => {
    const list = dir === 1 ? steps : [...steps].reverse();
    const n = list.find((s) => (dir === 1 ? s > zoom + 0.001 : s < zoom - 0.001));
    setZoom(n ?? zoom);
  };
  return (
    <div className="flex items-center rounded-lg bg-fill-2 p-0.5" role="group" aria-label="Zoom">
      <IconButton size="sm" label="Zoom out" onClick={() => next(-1)} disabled={zoom <= 0.25}>
        <Minus strokeWidth={1.75} />
      </IconButton>
      {!compact ? (
        <button type="button" onClick={() => setZoom(1)} title="Zoom to 100%" className="h-8 w-12 rounded-md font-mono-ui text-[12px] text-ink tabular-nums hover:bg-fill pointer-coarse:h-11">
          {Math.round(zoom * 100)}%
        </button>
      ) : null}
      <IconButton size="sm" label="Zoom in" onClick={() => next(1)} disabled={zoom >= 2}>
        <Plus strokeWidth={1.75} />
      </IconButton>
      <button
        type="button"
        onClick={setFit}
        aria-pressed={mode === 'fit'}
        title="Fit (⌘0)"
        className={cx('h-8 rounded-md px-2.5 text-[12px] font-medium pointer-coarse:h-11', mode === 'fit' ? 'bg-surface text-accent shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:bg-surface-3' : 'text-ink hover:bg-fill')}
      >
        Fit
      </button>
    </div>
  );
}

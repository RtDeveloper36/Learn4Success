/**
 * Fit-to-A4 measurement.
 *
 * A hidden measurement node renders the real <Poster mode="measure"> with `height: auto`.
 * Every poster size is `calc(<base> * var(--k))`, so we can set `--k` directly on the node
 * and read its height synchronously — no React re-render per step.
 *
 * In the two-column layout the measure node stacks every item in the LEFT column, so each
 * item's height at the current k is readable; we then compute the height-balanced split and
 * replace the left column's height by the taller of the two balanced columns.
 */
import type { FitResult, Slot } from './types';
import { groupSlots, splitColumns } from './schedule';

export const PAGE_W = 794;
export const PAGE_H = 1123;
export const K_MIN = 0.6;
export const K_MAX = 1.25;

interface MeasureOptions {
  columns: 1 | 2;
  autoFit: boolean;
  slots: Slot[];
}

function measureAt(root: HTMLElement, k: number, opts: MeasureOptions): { h: number; split: [string[], string[]] | null } {
  root.style.setProperty('--k', String(k));
  const total = root.offsetHeight;
  if (opts.columns === 1) return { h: total, split: null };

  const left = root.querySelector<HTMLElement>('[data-col="left"]');
  if (!left) return { h: total, split: null };
  const heights = new Map<string, number>();
  root.querySelectorAll<HTMLElement>('[data-item-id]').forEach((el) => {
    heights.set(el.dataset.itemId!, el.offsetHeight);
  });
  const gap = parseFloat(getComputedStyle(left).rowGap) || 0;
  const groups = groupSlots(opts.slots);
  const split = splitColumns(groups, (id) => heights.get(id) ?? 0, gap);
  const colH = (ids: string[]) =>
    ids.reduce((n, id) => n + (heights.get(id) ?? 0), 0) + Math.max(0, ids.length - 1) * gap;
  const h = total - left.offsetHeight + Math.max(colH(split[0]), colH(split[1]));
  return { h, split };
}

/** Binary-searches the largest density factor k ∈ [0.60, 1.25] whose content fits one A4 page. */
export function computeFit(root: HTMLElement, opts: MeasureOptions): FitResult {
  const prev = root.style.getPropertyValue('--k');
  try {
    if (!opts.autoFit) {
      const r = measureAt(root, 1, opts);
      return { k: 1, scale: 1, split: r.split, status: r.h <= PAGE_H + 0.5 ? 'fits' : 'overflow', contentHeight: r.h };
    }
    const top = measureAt(root, K_MAX, opts);
    if (top.h <= PAGE_H) return { k: K_MAX, scale: 1, split: top.split, status: 'fits', contentHeight: top.h };

    const bottom = measureAt(root, K_MIN, opts);
    if (bottom.h > PAGE_H) {
      const scale = Math.floor((PAGE_H / bottom.h) * 1000) / 1000;
      return { k: K_MIN, scale, split: bottom.split, status: 'scaled', contentHeight: bottom.h };
    }

    let lo = K_MIN;
    let hi = K_MAX;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (measureAt(root, mid, opts).h <= PAGE_H) lo = mid;
      else hi = mid;
    }
    const k = Math.floor(lo * 1000) / 1000;
    const r = measureAt(root, k, opts);
    return { k, scale: 1, split: r.split, status: 'fits', contentHeight: r.h };
  } finally {
    if (prev) root.style.setProperty('--k', prev);
    else root.style.removeProperty('--k');
  }
}

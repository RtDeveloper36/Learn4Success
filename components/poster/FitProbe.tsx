'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FitResult, Project } from '@/lib/types';
import { computeFit } from '@/lib/autofit';
import { visibleSlots } from '@/lib/schedule';
import { Poster } from './Poster';

const MEASURE_FIT = { k: 1, scale: 1, split: null, status: 'fits' as const, contentHeight: 0 };
const offscreen = { position: 'fixed', left: -20000, top: 0, pointerEvents: 'none', contain: 'layout style' } as const;

/**
 * Hidden measurement node + binary search (lib/autofit). Re-runs on every project change
 * (debounced 100 ms), on size changes (ResizeObserver) and once web fonts finish loading.
 */
export function FitProbe({ project, onFit }: { project: Project; onFit: (f: FitResult) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const [fontsTick, setFontsTick] = useState(0);

  const run = useCallback(() => {
    const el = ref.current;
    // Skip while the node is not laid out (e.g. print media hides it) — never fit against 0px.
    if (!el || el.offsetHeight === 0 || window.matchMedia('print').matches) return;
    onFit(computeFit(el, { columns: project.design.columns, autoFit: project.design.autoFit, slots: visibleSlots(project.slots) }));
  }, [onFit, project]);

  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => alive && setFontsTick((t) => t + 1));
    const onLoad = () => setFontsTick((t) => t + 1);
    document.fonts.addEventListener?.('loadingdone', onLoad);
    return () => {
      alive = false;
      document.fonts.removeEventListener?.('loadingdone', onLoad);
    };
  }, []);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      run();
      return;
    }
    const t = setTimeout(run, 100);
    return () => clearTimeout(t);
  }, [fontsTick, run]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    let lastH = el.offsetHeight;
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (h === 0 || Math.abs(h - lastH) < 0.5) return;
      lastH = h;
      clearTimeout(t);
      t = setTimeout(run, 100);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [run]);

  return (
    <div style={{ ...offscreen, visibility: 'hidden' }} aria-hidden>
      <Poster ref={ref} project={project} fit={MEASURE_FIT} mode="measure" />
    </div>
  );
}

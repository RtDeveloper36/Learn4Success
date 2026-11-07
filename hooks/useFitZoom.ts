'use client';
import { useEffect, useState, type RefObject } from 'react';
import { PAGE_H, PAGE_W } from '@/lib/autofit';

/**
 * Computes the "Fit" zoom for a container: fit-to-width on phones/tablet portrait,
 * fit-to-page on laptops and up. Recalculated on resize, rotation and sidebar toggle
 * (ResizeObserver). `maxZoom` caps it (1.0 on large monitors so the sheet never looks giant).
 */
export function useFitZoom(
  ref: RefObject<HTMLElement | null>,
  mode: 'width' | 'page',
  opts: { padding?: number; maxZoom?: number; pageHeight?: number } = {},
): number {
  const { padding = 32, maxZoom = 1.5, pageHeight = PAGE_H } = opts;
  const [zoom, setZoom] = useState(0.6);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth - padding * 2;
      const h = el.clientHeight - padding * 2;
      if (w <= 0 || h <= 0) return;
      const zw = w / PAGE_W;
      const zp = Math.min(zw, h / pageHeight);
      const z = Math.max(0.2, Math.min(maxZoom, mode === 'width' ? zw : zp));
      setZoom(Math.floor(z * 1000) / 1000);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, mode, padding, maxZoom, pageHeight]);
  return zoom;
}

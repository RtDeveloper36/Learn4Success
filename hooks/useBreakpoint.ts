'use client';
import { useEffect, useState } from 'react';

export type Breakpoint = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'wide';

export interface BreakpointInfo {
  width: number;
  height: number;
  bp: Breakpoint;
  /** phone or tablet portrait — editor lives in a sheet / bottom panel */
  stacked: boolean;
  /** coarse pointer (touch) */
  touch: boolean;
  /** small phone: < 480 */
  small: boolean;
  mounted: boolean;
}

function compute(w: number, h: number): Omit<BreakpointInfo, 'mounted' | 'touch'> {
  let bp: Breakpoint;
  if (w < 768) bp = 'phone';
  else if (w < 1024) bp = 'tablet';
  else if (w < 1536) bp = 'laptop';
  else if (w < 1920) bp = 'desktop';
  else bp = 'wide';
  // A phone/tablet rotated to landscape switches to two panes when width allows (≥ 900px).
  const landscapeTwoPane = w >= 900 && w > h;
  if ((bp === 'phone' || bp === 'tablet') && landscapeTwoPane) bp = 'laptop';
  return { width: w, height: h, bp, stacked: bp === 'phone' || bp === 'tablet', small: w < 480 };
}

const SSR: BreakpointInfo = { ...compute(1280, 800), touch: false, mounted: false };

export function useBreakpoint(): BreakpointInfo {
  const [info, setInfo] = useState<BreakpointInfo>(SSR);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setInfo({ ...compute(window.innerWidth, window.innerHeight), touch: mq.matches, mounted: true }),
      );
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    mq.addEventListener('change', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      mq.removeEventListener('change', update);
    };
  }, []);
  return info;
}

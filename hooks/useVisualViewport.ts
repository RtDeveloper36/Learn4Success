'use client';
import { useEffect, useState } from 'react';

/**
 * Tracks how much of the layout viewport is covered by the on-screen keyboard
 * (via `visualViewport`), so bottom sheets can move above it.
 */
export function useVisualViewport(): { keyboardInset: number; height: number } {
  const [state, setState] = useState({ keyboardInset: 0, height: 0 });
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setState({ keyboardInset: inset > 80 ? inset : 0, height: vv.height });
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return state;
}

/** Scrolls a focused field into view after the keyboard animation settles. */
export function useScrollFocusedIntoView(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (!el.matches('input, textarea, select')) return;
      setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
    };
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, [enabled]);
}

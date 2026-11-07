'use client';
import { useEffect, type RefObject } from 'react';

interface Options {
  getZoom: () => number;
  setZoom: (z: number, anchor?: { x: number; y: number }) => void;
  onDoubleTap?: () => void;
}

/**
 * Pinch-to-zoom and ⌘/Ctrl + wheel zoom on a scroll container. Two-finger pan uses the
 * container's native scrolling. Double-tap toggles Fit ↔ 100% via `onDoubleTap`.
 * Space + drag pans with the mouse.
 */
export function usePinchZoom(ref: RefObject<HTMLElement | null>, { getZoom, setZoom, onDoubleTap }: Options) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0025);
      setZoom(getZoom() * factor, { x: e.clientX, y: e.clientY });
    };

    let startDist = 0;
    let startZoom = 1;
    let lastTap = 0;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        startDist = dist(e.touches);
        startZoom = getZoom();
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 280 && onDoubleTap) {
          e.preventDefault();
          onDoubleTap();
          lastTap = 0;
        } else lastTap = now;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDist > 0) {
        e.preventDefault();
        const mid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        setZoom(startZoom * (dist(e.touches) / startDist), mid);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) startDist = 0;
    };

    // Space + drag to pan (mouse)
    let spaceDown = false;
    let panning: { x: number; y: number; sl: number; st: number } | null = null;
    const isTyping = () => {
      const a = document.activeElement as HTMLElement | null;
      return !!a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping()) {
        spaceDown = true;
        el.style.cursor = 'grab';
        if (e.target === document.body) e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceDown = false;
        el.style.cursor = '';
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!spaceDown) return;
      e.preventDefault();
      panning = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
      el.style.cursor = 'grabbing';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!panning) return;
      el.scrollLeft = panning.sl - (e.clientX - panning.x);
      el.scrollTop = panning.st - (e.clientY - panning.y);
    };
    const onMouseUp = () => {
      if (panning) {
        panning = null;
        el.style.cursor = spaceDown ? 'grab' : '';
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [ref, getZoom, setZoom, onDoubleTap]);
}

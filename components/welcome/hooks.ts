'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { STORAGE_KEY } from '@/lib/storage';

const subscribeVisibility = (cb: () => void) => {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
};

/** false while the tab is hidden — particles and the clock pause. */
export function useDocumentVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== 'hidden',
    () => true,
  );
}

/** true after hydration (for values that must not be pre-rendered, e.g. the live clock). */
export function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

const MQ_DESKTOP = '(hover: hover) and (pointer: fine)';
export function useFinePointer(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(MQ_DESKTOP);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(MQ_DESKTOP).matches,
    () => false,
  );
}

export function relTime(t: number): string {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

export interface SavedProfile {
  name: string;
  updatedAt: number;
}

/** The returning student's active saved timetable, read straight from localStorage. */
export function useSavedProfile(): SavedProfile | null {
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { state?: { activeId?: string; projects?: { id: string; name: string; updatedAt: number; customized?: boolean }[] } };
      const projects = parsed.state?.projects ?? [];
      const active = projects.find((p) => p.id === parsed.state?.activeId) ?? projects[0];
      // only "returning" if the student actually edited or generated something
      if (active && (active.updatedAt > 0 || projects.length > 1)) {
        const value = { name: active.name, updatedAt: active.updatedAt };
        queueMicrotask(() => setProfile(value));
      }
    } catch {
      /* corrupted or blocked storage — treat as a new student */
    }
  }, []);
  return profile;
}

/** Live clock, ticking every second while the tab is visible. */
export function useNow(active: boolean): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active]);
  return now;
}

export const isHindi = (s: string) => /[ऀ-ॿ]/.test(s);

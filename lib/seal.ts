'use client';
/**
 * Library seal loader. The seal PNG is fetched once, converted to a data URL and cached in
 * memory. Every poster render uses that data URL as <img src>, so html-to-image always embeds
 * the logo (no missing image, no CORS issue, works on iOS Safari).
 */
import { useSyncExternalStore } from 'react';
import { BRAND } from './brand';
import type { DesignSettings, TemplateId } from './types';

let dataUrl: string | null = null;
let pending: Promise<string> | null = null;
const listeners = new Set<() => void>();

export function loadSealDataUrl(): Promise<string> {
  if (dataUrl) return Promise.resolve(dataUrl);
  if (pending) return pending;
  pending = fetch(BRAND.seal)
    .then((r) => {
      if (!r.ok) throw new Error(`Seal not found (${r.status})`);
      return r.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(blob);
        }),
    )
    .then((url) => {
      dataUrl = url;
      listeners.forEach((l) => l());
      return url;
    })
    .catch((e) => {
      pending = null;
      throw e;
    });
  return pending;
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Data URL once loaded; the static path before that (and during pre-rendering). */
export function useSealSrc(): string {
  return useSyncExternalStore(
    subscribe,
    () => dataUrl ?? BRAND.seal,
    () => BRAND.seal,
  );
}

/** Waits until every <img> inside `root` is decoded (used right before export). */
export async function decodeImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(imgs.map((img) => img.decode().catch(() => undefined)));
}

export interface ResolvedPosterLogo {
  size: number;
  position: DesignSettings['logo']['position'];
}

/**
 * The library logo that should appear on a poster. When BRAND.posterLogo.locked is true the
 * brand config always wins, so project data (JSON imports, share links) can never hide or move it.
 */
export function resolvePosterLogo(design: DesignSettings, template: TemplateId): ResolvedPosterLogo | null {
  const cfg = BRAND.posterLogo;
  if (!cfg.enabled) return null;
  const src = cfg.locked ? { show: true, size: cfg.sizePx, position: cfg.position } : design.logo;
  if (!src.show) return null;
  const size = Math.round(Math.min(128, Math.max(80, src.size)) * (template === 'minimal' ? 88 / 104 : 1));
  return { size, position: src.position };
}

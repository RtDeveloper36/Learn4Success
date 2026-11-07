import { createElement, type CSSProperties } from 'react';
import type { DesignSettings, FitResult, Kpi, PosterContent, Selection, Slot } from '@/lib/types';
import { alpha } from '@/lib/presets';
import { getIcon } from '@/lib/icons';
import type { ResolvedPosterLogo } from '@/lib/seal';

export type PosterMode = 'preview' | 'export' | 'print' | 'measure' | 'thumb';

/** Everything a template needs — computed once by <Poster>. */
export interface TemplateProps {
  content: PosterContent;
  design: DesignSettings;
  slots: Slot[];
  kpis: Kpi[];
  fit: FitResult;
  mode: PosterMode;
  dark: boolean;
  selectedKey: string | null;
  /** resolved library seal (null = hidden) */
  logo: ResolvedPosterLogo | null;
}

export function selKey(sel: Selection): string | null {
  if (!sel) return null;
  return sel.type === 'slot' ? `slot:${sel.id}` : sel.type;
}

export function parseSelKey(key: string): Selection {
  if (key.startsWith('slot:')) return { type: 'slot', id: key.slice(5) };
  if (key === 'header' || key === 'kpi' || key === 'footer' || key === 'milestones') return { type: key };
  return null;
}

export function slotVars(color: string, dark: boolean): CSSProperties {
  return {
    '--slot': color,
    '--slot-tint': alpha(color, dark ? 0.16 : 0.075),
    '--slot-soft': alpha(color, dark ? 0.22 : 0.11),
    '--slot-border': alpha(color, dark ? 0.5 : 0.32),
    '--slot-border-strong': alpha(color, 0.75),
    '--slot-shadow': alpha(color, 0.55),
    '--slot-glow': alpha(color, 0.85),
  } as CSSProperties;
}

export function PosterIcon({ name, className }: { name: string | null; className?: string }) {
  const icon = getIcon(name);
  if (!icon) return null;
  return createElement(icon, { className, strokeWidth: 1.75, 'aria-hidden': true });
}

/** Helper for interactive attributes; only emitted in preview mode. */
export function selAttrs(mode: PosterMode, key: string, selectedKey: string | null) {
  if (mode !== 'preview') return {};
  return { 'data-sel': key, 'data-selected': selectedKey === key ? 'true' : undefined };
}

export function editAttr(mode: PosterMode, field: string) {
  return mode === 'preview' ? { 'data-edit': field } : {};
}

'use client';
import { forwardRef, memo, type CSSProperties, type MouseEvent } from 'react';
import type { DesignSettings, FitResult, Project, Selection } from '@/lib/types';
import { BODY_FONTS, DISPLAY_FONTS, MONO_FONTS, alpha, fontStack, getTheme, mix } from '@/lib/presets';
import { effectiveKpis, visibleSlots } from '@/lib/schedule';
import { resolvePosterLogo } from '@/lib/seal';
import { Timeline } from './templates/Timeline';
import { Editorial } from './templates/Editorial';
import { MinimalPrint } from './templates/MinimalPrint';
import { parseSelKey, selKey, type PosterMode, type TemplateProps } from './shared';

export interface PosterProps {
  project: Project;
  fit: FitResult;
  mode: PosterMode;
  selection?: Selection;
  /** used by the compare view to render the same timetable with another template/theme */
  designOverride?: Partial<DesignSettings>;
  onSelect?: (sel: Selection) => void;
  onInlineEdit?: (field: string, el: HTMLElement) => void;
  onContextMenu?: (sel: Selection, x: number, y: number) => void;
  className?: string;
  style?: CSSProperties;
}

const DENSITY = { compact: 0.72, balanced: 1, spacious: 1.32 } as const;

function posterVars(design: DesignSettings, badgeColor: string, k: number): { style: CSSProperties; dark: boolean } {
  const t = getTheme(design.themeId, design.custom);
  const dark = t.dark;
  const body = BODY_FONTS.find((f) => f.id === design.bodyFont) ?? BODY_FONTS[0];
  const display = DISPLAY_FONTS.find((f) => f.id === design.displayFont) ?? DISPLAY_FONTS[0];
  const mono = MONO_FONTS.find((f) => f.id === design.monoFont) ?? MONO_FONTS[0];
  const style = {
    '--k': k,
    '--d': DENSITY[design.density],
    '--r': design.radius,
    '--c-bg': t.canvasBg,
    '--c-card': t.cardBg,
    '--c-card-soft': mix(t.cardBg, t.canvasBg, 0.5),
    '--c-border': t.border,
    '--c-text': t.text,
    '--c-text-soft': mix(t.text, t.canvasBg, 0.18),
    '--c-muted': t.muted,
    '--c-grad-from': t.gradientFrom,
    '--c-grad-to': t.gradientTo,
    '--c-accent': t.accent,
    '--c-dot': alpha(t.text, dark ? 0.09 : 0.085),
    '--c-rail': alpha(t.text, dark ? 0.18 : 0.13),
    '--c-break-dot': alpha(t.muted, 0.75),
    '--c-shadow': dark ? 'rgba(0,0,0,0.3)' : 'rgba(15,23,42,0.04)',
    '--wash-a': dark ? alpha(t.gradientFrom, 0.16) : 'rgba(253, 224, 71, 0.34)',
    '--wash-b': dark ? alpha(t.gradientTo, 0.12) : 'rgba(253, 186, 116, 0.22)',
    '--wash-c': dark ? alpha(t.gradientTo, 0.14) : 'rgba(165, 180, 252, 0.30)',
    '--wash-d': dark ? alpha(t.gradientFrom, 0.1) : 'rgba(147, 197, 253, 0.20)',
    '--badge': badgeColor,
    '--badge-soft': alpha(badgeColor, dark ? 0.2 : 0.1),
    '--badge-border': alpha(badgeColor, dark ? 0.45 : 0.25),
    '--rule-bg': dark ? alpha('#FACC15', 0.08) : '#FFFBEA',
    '--rule-border': dark ? alpha('#FACC15', 0.5) : '#F5C518',
    '--f-body': fontStack(body.css),
    '--f-display': fontStack(display.css || body.css),
    '--f-mono': fontStack(mono.css),
    '--display-weight': display.css ? 400 : 900,
  } as CSSProperties;
  return { style, dark };
}

/**
 * Pure poster renderer: fixed 794 × 1123 (A4 @ 96 DPI). The same component renders the
 * preview, the off-screen export node, the print node and the measurement node.
 */
export const Poster = memo(
  forwardRef<HTMLDivElement, PosterProps>(function Poster(
    { project, fit, mode, selection = null, designOverride, onSelect, onInlineEdit, onContextMenu, className, style },
    ref,
  ) {
    const design = designOverride ? { ...project.design, ...designOverride } : project.design;
    const k = mode === 'measure' ? 1 : fit.k;
    const { style: vars, dark } = posterVars(design, project.content.badgeColor, k);
    const slots = visibleSlots(project.slots);
    const kpis = effectiveKpis(project.slots, project.content, design.timeFormat);
    const tp: TemplateProps = {
      content: project.content,
      design,
      slots,
      kpis,
      fit,
      mode,
      dark,
      selectedKey: selKey(selection),
      logo: resolvePosterLogo(design, design.template),
    };

    const interactive = mode === 'preview';
    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
      if (!onSelect) return;
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-sel]');
      onSelect(el ? parseSelKey(el.dataset.sel!) : null);
    };
    const handleDouble = (e: MouseEvent<HTMLDivElement>) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-edit]');
      if (el && onInlineEdit) onInlineEdit(el.dataset.edit!, el);
    };
    const handleContext = (e: MouseEvent<HTMLDivElement>) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-sel]');
      if (!el || !onContextMenu) return;
      e.preventDefault();
      onContextMenu(parseSelKey(el.dataset.sel!), e.clientX, e.clientY);
    };

    const scale = mode !== 'measure' && fit.scale < 1 ? fit.scale : 1;
    const Template = design.template === 'editorial' ? Editorial : design.template === 'minimal' ? MinimalPrint : Timeline;

    return (
      <div
        ref={ref}
        className={`poster tpl-${design.template} ${className ?? ''}`}
        data-mode={mode}
        data-card={design.cardStyle}
        data-time={design.timeFormat}
        data-overflow={fit.status === 'overflow' ? 'true' : 'false'}
        style={{ ...vars, ...style }}
        onClick={interactive ? handleClick : undefined}
        onDoubleClick={interactive ? handleDouble : undefined}
        onContextMenu={interactive ? handleContext : undefined}
        aria-label={mode === 'preview' ? 'A4 timetable poster preview' : undefined}
      >
        {design.showColorWash ? <div className="p-wash" aria-hidden /> : null}
        {design.showDotGrid ? <div className="p-dots" aria-hidden /> : null}
        <div className="p-content" style={scale < 1 ? { transform: `scale(${scale})`, height: `${100 / scale}%` } : undefined}>
          <Template {...tp} />
        </div>
      </div>
    );
  }),
);

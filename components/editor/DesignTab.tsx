'use client';
import { Check, Lock } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { useProjectStore } from '@/lib/store';
import { BODY_FONTS, DISPLAY_FONTS, MONO_FONTS, THEMES, getTheme } from '@/lib/presets';
import { applyTemplate } from '@/lib/actions';
import type { CardStyle, Density, DesignSettings, TemplateId, ThemeColors } from '@/lib/types';
import { Group } from '@/components/ui/Group';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { cx } from '@/components/ui/layout-context';

const TEMPLATES: { id: TemplateId; name: string; blurb: string }[] = [
  { id: 'timeline', name: 'Timeline', blurb: 'Rail + colour pills' },
  { id: 'editorial', name: 'Editorial', blurb: 'Dark, two-column' },
  { id: 'minimal', name: 'Minimal Print', blurb: 'Ink-saving outlines' },
];

/** Tiny illustrative thumbnail of each template (pure markup, no extra poster render). */
function TemplateThumb({ id }: { id: TemplateId }) {
  const colors = ['#2563EB', '#DB2777', '#059669', '#EA580C'];
  if (id === 'editorial') {
    return (
      <div className="flex h-full flex-col gap-1 bg-[#0F172A] p-1.5">
        <div className="h-1.5 w-2/3 rounded-sm bg-gradient-to-r from-[#60A5FA] to-[#C084FC]" />
        <div className="grid grid-cols-4 gap-0.5">{[0, 1, 2, 3].map((i) => <div key={i} className="h-1.5 rounded-[2px] bg-[#1E293B]" />)}</div>
        <div className="grid flex-1 grid-cols-2 gap-1">
          {[0, 1].map((c) => (
            <div key={c} className="flex flex-col gap-0.5">
              {colors.map((col, i) => (
                <div key={i} className="relative h-2.5 rounded-[2px] bg-[#1E293B]">
                  <span className="absolute inset-y-0.5 left-0.5 w-[2px] rounded" style={{ background: col, boxShadow: `0 0 3px ${col}` }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (id === 'minimal') {
    return (
      <div className="flex h-full flex-col gap-1 bg-white p-1.5">
        <div className="h-1.5 w-1/2 rounded-sm bg-[#0F172A]" />
        {colors.map((col, i) => (
          <div key={i} className="flex h-2.5 items-center gap-1 rounded-[2px] border border-[#E2E8F0] pl-0.5" style={{ borderLeft: `2px solid ${col}` }}>
            <span className="h-[2px] w-3 bg-[#0F172A]" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="relative flex h-full flex-col gap-1 bg-[#FBFAF7] p-1.5">
      <span className="absolute inset-0 bg-[radial-gradient(60%_40%_at_100%_0%,rgba(253,224,71,.45),transparent)]" />
      <div className="relative h-1.5 w-2/3 rounded-sm bg-gradient-to-r from-[#0F172A] via-[#2563EB] to-[#DB2777]" />
      {colors.map((col, i) => (
        <div key={i} className="relative flex items-center gap-1">
          <span className="size-1.5 rounded-full" style={{ background: col }} />
          <div className="flex h-2.5 flex-1 items-center gap-1 rounded-[2px] border bg-white pl-0.5" style={{ borderColor: `${col}55` }}>
            <span className="h-1.5 w-4 rounded-[1px]" style={{ background: col }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const CUSTOM_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'canvasBg', label: 'Canvas' },
  { key: 'cardBg', label: 'Card' },
  { key: 'border', label: 'Border' },
  { key: 'text', label: 'Primary text' },
  { key: 'muted', label: 'Muted text' },
  { key: 'accent', label: 'Accent' },
  { key: 'gradientFrom', label: 'Gradient from' },
  { key: 'gradientTo', label: 'Gradient to' },
];

export function DesignTab() {
  const design = useProjectStore((s) => s.project.design);
  const setDesign = useProjectStore((s) => s.setDesign);
  const current = getTheme(design.themeId, design.custom);

  const setCustom = (key: keyof ThemeColors, value: string) => {
    const base: ThemeColors = design.themeId === 'custom' ? design.custom : { ...current };
    setDesign({ themeId: 'custom', custom: { ...base, [key]: value } });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="px-1">
        <h2 className="app-heading font-semibold">Design</h2>
        <p className="mt-0.5 text-[12px] text-ink-2">Templates, themes, fonts and layout. The poster never reflows — only its style changes.</p>
      </div>

      <Group title="Template">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Template">
          {TEMPLATES.map((t) => {
            const active = design.template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => applyTemplate(t.id)}
                className={cx('group flex flex-col gap-1.5 rounded-xl p-1.5 text-left transition-shadow', active ? 'shadow-[0_0_0_2px_var(--accent)]' : 'shadow-[0_0_0_1px_var(--hairline)] hover:shadow-[0_0_0_1px_var(--hairline-strong)]')}
              >
                <div className="aspect-[210/297] overflow-hidden rounded-md shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)]">
                  <TemplateThumb id={t.id} />
                </div>
                <div className="px-0.5">
                  <div className="text-[12px] font-semibold">{t.name}</div>
                  <div className="text-[11px] leading-tight text-ink-3">{t.blurb}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Theme">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => {
            const active = design.themeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setDesign({ themeId: t.id })}
                className={cx('flex items-center gap-2 rounded-lg p-2 text-left transition-shadow pointer-coarse:min-h-12', active ? 'shadow-[0_0_0_2px_var(--accent)]' : 'shadow-[0_0_0_1px_var(--hairline)] hover:shadow-[0_0_0_1px_var(--hairline-strong)]')}
              >
                <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]" style={{ background: t.canvasBg }}>
                  <span className="h-2 w-5 rounded-sm" style={{ background: `linear-gradient(90deg, ${t.gradientFrom}, ${t.gradientTo})` }} />
                  {active ? <Check className="absolute right-0.5 bottom-0.5 size-3" style={{ color: t.text }} strokeWidth={3} /> : null}
                </span>
                <span className="truncate text-[12px] font-medium">{t.name}</span>
              </button>
            );
          })}
        </div>
        <details className="group" open={design.themeId === 'custom'}>
          <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-medium text-accent pointer-coarse:min-h-11">
            Custom colours {design.themeId === 'custom' ? <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px]">Active</span> : null}
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {CUSTOM_FIELDS.map((f) => (
              <ColorPicker key={f.key} label={f.label} value={(design.themeId === 'custom' ? design.custom : current)[f.key]} onChange={(v) => setCustom(f.key, v)} contrastAgainst={f.key === 'text' || f.key === 'muted' ? current.canvasBg : '#FFFFFF'} />
            ))}
          </div>
        </details>
      </Group>

      <Group title="Fonts">
        <Select label="Body font" value={design.bodyFont} onChange={(e) => setDesign({ bodyFont: e.target.value })} options={BODY_FONTS.map((f) => ({ value: f.id, label: f.name }))} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Display font" value={design.displayFont} onChange={(e) => setDesign({ displayFont: e.target.value })} options={DISPLAY_FONTS.map((f) => ({ value: f.id, label: f.name }))} />
          <Select label="Mono font" value={design.monoFont} onChange={(e) => setDesign({ monoFont: e.target.value })} options={MONO_FONTS.map((f) => ({ value: f.id, label: f.name }))} />
        </div>
      </Group>

      <Group title="Layout">
        <div className="grid grid-cols-2 gap-3">
          <SegmentedControl<1 | 2> label="Columns" value={design.columns} onChange={(columns) => setDesign({ columns })} options={[{ value: 1, label: '1' }, { value: 2, label: '2' }]} />
          <SegmentedControl<'12h' | '24h'> label="Time" value={design.timeFormat} onChange={(timeFormat) => setDesign({ timeFormat })} options={[{ value: '12h', label: '12h' }, { value: '24h', label: '24h' }]} />
        </div>
        <SegmentedControl<Density>
          label="Density"
          value={design.density}
          onChange={(density) => setDesign({ density })}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'spacious', label: 'Spacious' },
          ]}
        />
        <SegmentedControl<CardStyle>
          label="Card style"
          value={design.cardStyle}
          onChange={(cardStyle) => setDesign({ cardStyle })}
          options={[
            { value: 'tinted', label: 'Tinted' },
            { value: 'outline', label: 'Outline' },
            { value: 'solid', label: 'Solid' },
          ]}
        />
        <Slider label="Corner radius" value={design.radius} min={0} max={20} onChange={(radius) => setDesign({ radius })} format={(v) => `${v}px`} />
        <div className="-my-1">
          <Switch label="Dot grid texture" checked={design.showDotGrid} onChange={(showDotGrid) => setDesign({ showDotGrid })} />
          <Switch label="Colour wash" checked={design.showColorWash} onChange={(showColorWash) => setDesign({ showColorWash })} />
        </div>
      </Group>

      <Group
        title="Library Logo"
        footer={BRAND.posterLogo.locked ? undefined : 'The library seal appears at the top of every timetable, in the preview, PDF, PNG and print.'}
        action={BRAND.posterLogo.locked ? <Lock className="size-3.5 text-ink-3" strokeWidth={2} aria-label="Locked" /> : undefined}
      >
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
          <img src={BRAND.seal} alt="" width={44} height={44} className="size-11 shrink-0 rounded-full" />
          <div className="min-w-0 text-[12px] leading-snug text-ink-2">
            {BRAND.posterLogo.locked ? (
              <>
                <span className="flex items-center gap-1 font-medium text-ink">
                  <Lock className="size-3" strokeWidth={2.25} /> Set by {BRAND.name} Library
                </span>
                Always shown at the {BRAND.posterLogo.position.replace('-', ' ')} of your timetable.
              </>
            ) : (
              <span className="font-medium text-ink">{BRAND.name} Library seal</span>
            )}
          </div>
        </div>
        <fieldset disabled={BRAND.posterLogo.locked} className={BRAND.posterLogo.locked ? 'pointer-events-none flex flex-col gap-3 opacity-55' : 'flex flex-col gap-3'} aria-describedby="logo-lock-note">
          <Switch label="Show library logo" checked={BRAND.posterLogo.locked ? true : design.logo.show} disabled={BRAND.posterLogo.locked} onChange={(show) => setDesign({ logo: { ...design.logo, show } })} />
          <Slider label="Size" value={BRAND.posterLogo.locked ? BRAND.posterLogo.sizePx : design.logo.size} min={80} max={128} step={4} onChange={(size) => setDesign({ logo: { ...design.logo, size } })} format={(v) => `${v}px`} />
          <SegmentedControl<DesignSettings['logo']['position']>
            label="Position"
            size="sm"
            value={BRAND.posterLogo.locked ? BRAND.posterLogo.position : design.logo.position}
            onChange={(position) => setDesign({ logo: { ...design.logo, position } })}
            options={[
              { value: 'top-left', label: 'Top left' },
              { value: 'top-center', label: 'Center' },
              { value: 'top-right', label: 'Top right' },
            ]}
          />
        </fieldset>
        {BRAND.posterLogo.locked ? (
          <p id="logo-lock-note" className="sr-only">
            These settings are locked by the library.
          </p>
        ) : null}
      </Group>

      <Group title="Page" footer="Shrinks or grows spacing and type so everything fits exactly one A4 page (4–30 slots).">
        <Switch label="Auto-Fit to single A4 page" checked={design.autoFit} onChange={(autoFit) => setDesign({ autoFit })} />
      </Group>
    </div>
  );
}

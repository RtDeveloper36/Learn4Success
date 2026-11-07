'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useProjectStore } from '@/lib/store';
import { useUI } from '@/lib/ui';
import { THEMES } from '@/lib/presets';
import type { DesignSettings, FitResult, TemplateId } from '@/lib/types';
import { FitProbe } from './Hosts';
import { PAGE_H, PAGE_W } from '@/lib/autofit';
import { Poster } from '@/components/poster/Poster';
import { Button, IconButton } from '@/components/ui/Button';

const TEMPLATE_OPTS: { value: TemplateId; label: string }[] = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'minimal', label: 'Minimal Print' },
];

/** Side-by-side compare (≥1920px): the same timetable with another template/theme. */
export function CompareView() {
  const project = useProjectStore((s) => s.project);
  const setDesign = useProjectStore((s) => s.setDesign);
  const fit = useUI((s) => s.fit);
  const setUI = useUI((s) => s.set);
  const [alt, setAlt] = useState<Partial<DesignSettings>>({ template: 'editorial', themeId: 'midnight-slate', columns: 2 });
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // two A4 sheets side by side, never above 100%
  const z = Math.max(0.2, Math.min(1, (box.w - 48 - 24) / 2 / PAGE_W, (box.h - 48 - 28) / PAGE_H));
  const [altFit, setAltFit] = useState<FitResult>(fit);
  const altProject = useMemo(() => ({ ...project, design: { ...project.design, ...alt } }), [project, alt]);

  const sel = 'h-8 rounded-lg bg-fill px-2 text-[12px] outline-none';
  return (
    <div className="flex h-full min-h-0 flex-col">
      <FitProbe project={altProject} onFit={setAltFit} />
      <div className="hairline-b flex h-12 shrink-0 items-center gap-2 px-4">
        <h2 className="text-[13px] font-semibold">Compare</h2>
        <span className="text-[12px] text-ink-3">Current design vs.</span>
        <select aria-label="Compare template" className={sel} value={alt.template} onChange={(e) => setAlt({ ...alt, template: e.target.value as TemplateId })}>
          {TEMPLATE_OPTS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select aria-label="Compare theme" className={sel} value={alt.themeId} onChange={(e) => setAlt({ ...alt, themeId: e.target.value })}>
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select aria-label="Compare columns" className={sel} value={alt.columns} onChange={(e) => setAlt({ ...alt, columns: Number(e.target.value) as 1 | 2 })}>
          <option value={1}>1 column</option>
          <option value={2}>2 columns</option>
        </select>
        <Button size="sm" variant="tinted" className="ml-auto" onClick={() => setDesign(alt)}>
          Use this design
        </Button>
        <IconButton size="sm" label="Close compare" onClick={() => setUI({ compareOpen: false })}>
          <X strokeWidth={1.75} />
        </IconButton>
      </div>
      <div ref={ref} className="canvas-bg flex min-h-0 flex-1 items-center justify-center gap-6 overflow-auto p-6">
        {[undefined, alt].map((ov, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: PAGE_W * z, height: PAGE_H * z }}>
              <div className="paper-shadow absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${z})` }}>
                <Poster project={project} fit={i === 0 ? fit : altFit} mode="thumb" designOverride={ov} />
              </div>
            </div>
            <span className="text-[12px] text-ink-2">{i === 0 ? 'Current' : 'Alternative'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

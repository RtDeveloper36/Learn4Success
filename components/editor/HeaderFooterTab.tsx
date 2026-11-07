'use client';
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/lib/store';
import { uid } from '@/lib/defaults';
import { computeAutoKpis } from '@/lib/schedule';
import type { Kpi, Milestone } from '@/lib/types';
import { Group, Divider } from '@/components/ui/Group';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Button, IconButton } from '@/components/ui/Button';
import { cx } from '@/components/ui/layout-context';

export function HeaderFooterTab() {
  const content = useProjectStore((s) => s.project.content);
  const slots = useProjectStore((s) => s.project.slots);
  const timeFormat = useProjectStore((s) => s.project.design.timeFormat);
  const setContent = useProjectStore((s) => s.setContent);
  const setSections = useProjectStore((s) => s.setSections);
  const sec = content.sections;

  const setKpi = (id: string, patch: Partial<Kpi>) => setContent({ kpis: content.kpis.map((k) => (k.id === id ? { ...k, ...patch } : k)) });
  const setMs = (list: Milestone[]) => setContent({ milestones: list });
  const autoKpis = computeAutoKpis(slots, content, timeFormat);

  return (
    <div className="flex flex-col gap-5">
      <div className="px-1">
        <h2 className="app-heading font-semibold">Header & Footer</h2>
        <p className="mt-0.5 text-[12px] text-ink-2">Toggle poster sections and edit every line of text.</p>
      </div>

      <Group title="Sections" className="[&>div]:gap-0 [&>div]:py-1">
        <Switch label="Header" checked={sec.header} onChange={(header) => setSections({ header })} />
        <Switch label="KPI bar" checked={sec.kpi} onChange={(kpi) => setSections({ kpi })} />
        <Switch label="Footer (quote & rule)" checked={sec.footer} onChange={(footer) => setSections({ footer })} />
        <Switch label="Milestones" checked={sec.milestones} onChange={(milestones) => setSections({ milestones })} />
        <Switch label="Timeline rail" checked={sec.rail} onChange={(rail) => setSections({ rail })} />
      </Group>

      <Group title="Header" id="edit-header">
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <Input label="Exam badge" value={content.badgeText} placeholder="e.g. IBPS SO 2026" onChange={(e) => setContent({ badgeText: e.target.value })} />
          <ColorPicker label="Badge colour" compact value={content.badgeColor} onChange={(badgeColor) => setContent({ badgeColor })} contrastAgainst="#FFFFFF" />
        </div>
        <Input label="Student badge" value={content.studentName} placeholder="e.g. Aarav Sharma" onChange={(e) => setContent({ studentName: e.target.value })} />
        <Switch label="Pulse dot on exam badge" checked={content.showPulseDot} onChange={(showPulseDot) => setContent({ showPulseDot })} />
        <Divider />
        <Input label="Main title" value={content.titleMain} placeholder="DAILY MASTER" onChange={(e) => setContent({ titleMain: e.target.value })} />
        <Input label="Gradient title" value={content.titleGradient} placeholder="STUDY SCHEDULE" onChange={(e) => setContent({ titleGradient: e.target.value })} />
        <Input label="Subtitle" value={content.subtitle} placeholder="10 focused blocks · 8 smart breaks" onChange={(e) => setContent({ subtitle: e.target.value })} />
      </Group>

      <Group title="KPI bar" id="edit-kpi">
        <SegmentedControl<'auto' | 'manual'>
          value={content.kpiMode}
          onChange={(kpiMode) => setContent(kpiMode === 'manual' && content.kpiMode === 'auto' ? { kpiMode, kpis: autoKpis } : { kpiMode })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'manual', label: 'Manual' },
          ]}
        />
        {content.kpiMode === 'auto' ? (
          <div className="grid grid-cols-2 gap-2">
            {autoKpis.map((k) => (
              <div key={k.id} className="rounded-lg bg-fill-2 px-2.5 py-2">
                <div className="text-[10px] font-semibold tracking-[0.08em] text-ink-3 uppercase">{k.label}</div>
                <div className="truncate text-[13px] font-semibold">{k.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {content.kpis.map((k) => (
              <div key={k.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <Input label="Label" value={k.label} onChange={(e) => setKpi(k.id, { label: e.target.value })} />
                <Input label="Value" value={k.value} onChange={(e) => setKpi(k.id, { value: e.target.value })} />
                <IconButton label={`Remove ${k.label}`} onClick={() => setContent({ kpis: content.kpis.filter((x) => x.id !== k.id) })}>
                  <Trash2 strokeWidth={1.75} />
                </IconButton>
              </div>
            ))}
            <Button size="sm" icon={<Plus strokeWidth={1.75} />} disabled={content.kpis.length >= 4} onClick={() => setContent({ kpis: [...content.kpis, { id: uid('kpi'), label: 'New KPI', value: '—' }] })}>
              Add KPI {content.kpis.length >= 4 ? '(max 4)' : ''}
            </Button>
          </div>
        )}
      </Group>

      <Group title="Footer" id="edit-footer">
        <Input label="Quote line 1" value={content.quoteLine1} onChange={(e) => setContent({ quoteLine1: e.target.value })} />
        <Input label="Quote line 2 (accent colour)" value={content.quoteLine2} onChange={(e) => setContent({ quoteLine2: e.target.value })} />
        <Divider />
        <Input label="Rule title" value={content.ruleTitle} helper="Text inside “quotes” is shown in the accent colour." onChange={(e) => setContent({ ruleTitle: e.target.value })} />
        <Input label="Rule text" value={content.ruleText} onChange={(e) => setContent({ ruleText: e.target.value })} />
        <Input label="Highlight phrase" value={content.ruleHighlight} onChange={(e) => setContent({ ruleHighlight: e.target.value })} />
      </Group>

      <Group
        title="Milestones"
        id="edit-milestones"
        action={
          <Button size="sm" variant="ghost" icon={<Plus strokeWidth={1.75} />} onClick={() => setMs([...content.milestones, { id: uid('ms'), label: `DAY ${content.milestones.length ? 15 * content.milestones.length : 1}`, done: false }])}>
            Add
          </Button>
        }
      >
        {content.milestones.length === 0 ? <p className="text-[12px] text-ink-3">No milestones yet.</p> : null}
        {content.milestones.map((m, i) => (
          <div key={m.id} className="flex items-center gap-1.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={m.done}
              aria-label={`Mark ${m.label} ${m.done ? 'not done' : 'done'}`}
              onClick={() => setMs(content.milestones.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)))}
              className={cx('grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors pointer-coarse:size-11', m.done ? 'border-accent bg-accent text-white' : 'border-hairline-strong text-transparent')}
            >
              <Check className="size-3.5" strokeWidth={3} />
            </button>
            <input
              aria-label="Milestone label"
              value={m.label}
              onChange={(e) => setMs(content.milestones.map((x) => (x.id === m.id ? { ...x, label: e.target.value } : x)))}
              className="h-9 min-w-0 flex-1 rounded-lg bg-fill px-2.5 text-[13px] outline-none focus:bg-surface focus:shadow-[0_0_0_1px_var(--accent)] max-md:text-base pointer-coarse:h-11"
            />
            <IconButton size="sm" label="Move up" disabled={i === 0} onClick={() => { const l = content.milestones.slice(); [l[i - 1], l[i]] = [l[i], l[i - 1]]; setMs(l); }}>
              <ArrowUp strokeWidth={1.75} />
            </IconButton>
            <IconButton size="sm" label="Move down" disabled={i === content.milestones.length - 1} onClick={() => { const l = content.milestones.slice(); [l[i + 1], l[i]] = [l[i], l[i + 1]]; setMs(l); }}>
              <ArrowDown strokeWidth={1.75} />
            </IconButton>
            <IconButton size="sm" label={`Delete ${m.label}`} onClick={() => setMs(content.milestones.filter((x) => x.id !== m.id))}>
              <Trash2 strokeWidth={1.75} />
            </IconButton>
          </div>
        ))}
      </Group>
    </div>
  );
}

'use client';
import { useMemo, useState } from 'react';
import { ChevronDown, Eraser, LayoutTemplate, Shuffle, Sparkles, TriangleAlert } from 'lucide-react';
import { useProjectStore } from '@/lib/store';
import { EXAM_PRESETS } from '@/lib/presets';
import { clearAll, loadDefaultTemplate, runGenerate } from '@/lib/actions';
import { parseTimeInput, toMinutes } from '@/lib/time';
import type { BlockLength, BreakStyle } from '@/lib/types';
import { Group } from '@/components/ui/Group';
import { Input } from '@/components/ui/Input';
import { TimePicker } from '@/components/ui/TimePicker';
import { ChipInput } from '@/components/ui/ChipInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Button } from '@/components/ui/Button';
import { cx } from '@/components/ui/layout-context';

export function SetupTab() {
  const setup = useProjectStore((s) => s.project.setup);
  const timeFormat = useProjectStore((s) => s.project.design.timeFormat);
  const setSetup = useProjectStore((s) => s.setSetup);
  const setContent = useProjectStore((s) => s.setContent);
  const [showPresets, setShowPresets] = useState(true);

  const warning = useMemo(() => {
    const a = parseTimeInput(setup.startTime);
    const b = parseTimeInput(setup.endTime);
    if (!a || !b) return null;
    let d = toMinutes(b) - toMinutes(a);
    if (d <= 0) {
      d += 1440;
      if (d < 180) return 'This window is under 3 hours (it crosses midnight). The timetable will be short.';
      return 'End time is before start time — the window will cross midnight.';
    }
    if (d < 180) return 'Your study window is under 3 hours, so the timetable will be short.';
    return null;
  }, [setup.startTime, setup.endTime]);

  return (
    <div className="flex flex-col gap-5">
      <div className="px-1">
        <h2 className="app-heading font-semibold">Smart setup</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">Fill in what you know — or nothing at all. Generate always gives you a complete, print-ready A4 timetable.</p>
      </div>

      <Group title="Exam & student">
        <Input
          label="Exam name"
          placeholder="e.g. UPSC CSE 2027"
          value={setup.examName}
          onChange={(e) => setSetup({ examName: e.target.value })}
          autoComplete="off"
          helper="Matching exams pre-fill subjects automatically."
        />
        <div>
          <button
            type="button"
            onClick={() => setShowPresets((v) => !v)}
            aria-expanded={showPresets}
            className="flex items-center gap-1 text-[12px] font-medium text-accent pointer-coarse:min-h-11"
          >
            Exam presets
            <ChevronDown className={cx('size-3.5 transition-transform', showPresets && 'rotate-180')} strokeWidth={2} />
          </button>
          {showPresets ? (
            <div className="mt-2 flex flex-col gap-2.5">
              {EXAM_PRESETS.map((g) => (
                <div key={g.group}>
                  <div className="mb-1 text-[11px] text-ink-3">{g.group}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.presets.map((p) => {
                      const active = setup.examName.trim().toLowerCase() === p.label.toLowerCase();
                      return (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setSetup({ examName: p.label, subjects: [] });
                            setContent({ examName: p.label, badgeText: p.label.toUpperCase() });
                          }}
                          className={cx(
                            'rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors pointer-coarse:px-3 pointer-coarse:py-2.5 pointer-coarse:text-[13px]',
                            active ? 'bg-accent text-white' : 'bg-fill-2 text-ink hover:bg-fill',
                          )}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <Input
          label="Student name or motto"
          placeholder="e.g. Aarav · Karo Ya Maro"
          value={setup.studentName}
          onChange={(e) => setSetup({ studentName: e.target.value })}
          autoComplete="off"
        />
      </Group>

      <Group title="Daily window" footer={warning ? undefined : 'Leave blank for 06:30 AM → 09:30 PM.'}>
        <div className="grid grid-cols-2 gap-3">
          <TimePicker label="Start" value={parseTimeInput(setup.startTime) ?? ''} onChange={(v) => setSetup({ startTime: v })} format={timeFormat} allowEmpty />
          <TimePicker label="End" value={parseTimeInput(setup.endTime) ?? ''} onChange={(v) => setSetup({ endTime: v })} format={timeFormat} allowEmpty placeholder={timeFormat === '12h' ? '09:30 PM' : '21:30'} />
        </div>
        {warning ? (
          <p className="flex items-start gap-1.5 text-[12px] text-warning-ink" role="status">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
            {warning}
          </p>
        ) : null}
      </Group>

      <Group title="Subjects">
        <ChipInput
          label="Your subjects"
          value={setup.subjects}
          onChange={(subjects) => setSetup({ subjects })}
          placeholder="Type a subject and press Enter"
          helper="Optional. Empty = exam preset subjects, or the default master subjects. Paste a comma-separated list to add many."
        />
        <SegmentedControl<BlockLength>
          label="Preferred block length"
          value={setup.blockLength}
          onChange={(blockLength) => setSetup({ blockLength })}
          options={[
            { value: 60, label: '60 min' },
            { value: 90, label: '90 min' },
            { value: 120, label: '120 min' },
          ]}
        />
        <SegmentedControl<BreakStyle>
          label="Break style"
          value={setup.breakStyle}
          onChange={(breakStyle) => setSetup({ breakStyle })}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'frequent', label: 'Frequent' },
          ]}
        />
      </Group>

      <div className="flex flex-col gap-2">
        <Button variant="primary" size="lg" block icon={<Sparkles strokeWidth={1.75} />} onClick={() => void runGenerate(false)}>
          Generate My A4 Timetable
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button icon={<Shuffle strokeWidth={1.75} />} onClick={() => void runGenerate(true)}>
            Shuffle variation
          </Button>
          <Button icon={<LayoutTemplate strokeWidth={1.75} />} onClick={() => void loadDefaultTemplate()} title="Load Default Karo-Ya-Maro Template">
            Load default
          </Button>
        </div>
        <Button variant="destructive" icon={<Eraser strokeWidth={1.75} />} onClick={() => void clearAll()}>
          Clear All (Start Blank)
        </Button>
      </div>
    </div>
  );
}

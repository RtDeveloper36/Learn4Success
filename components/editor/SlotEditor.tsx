'use client';
import { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Coffee, Copy, Plus, Trash2 } from 'lucide-react';
import type { Slot, SlotKind } from '@/lib/types';
import { useProjectStore } from '@/lib/store';
import { useUI } from '@/lib/ui';
import { BREAK_GRAY, BREAK_TAGS, CATEGORY_SUGGESTIONS } from '@/lib/presets';
import { durationMinutes, formatDuration } from '@/lib/time';
import { addSlot, deleteSlot, duplicateSlot } from '@/lib/actions';
import type { SlotIssue } from '@/lib/schedule';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TimePicker } from '@/components/ui/TimePicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { IconPicker } from '@/components/ui/IconPicker';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';

interface Props {
  slot: Slot;
  index: number;
  count: number;
  issues?: SlotIssue[];
  /** focus the first field when this editor is opened from the canvas */
  autoFocus?: boolean;
}

export function SlotEditor({ slot, index, count, issues = [], autoFocus }: Props) {
  const updateSlot = useProjectStore((s) => s.updateSlot);
  const setSlotTime = useProjectStore((s) => s.setSlotTime);
  const moveSlot = useProjectStore((s) => s.moveSlot);
  const timeFormat = useProjectStore((s) => s.project.design.timeFormat);
  const autoChain = useUI((s) => s.autoChain);
  const chainMode = useUI((s) => s.chainMode);
  const focusTick = useUI((s) => s.focusTick);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && focusTick > 0) {
      const t = setTimeout(() => {
        if (!document.querySelector('[data-inline-edit]')) firstRef.current?.focus({ preventScroll: false });
      }, 120);
      return () => clearTimeout(t);
    }
  }, [autoFocus, focusTick]);

  const mins = durationMinutes(slot.start, slot.end);
  const isStudy = slot.kind === 'study';
  const endErr = issues.find((i) => /end time/i.test(i.message))?.message;
  const tagIsCustom = !!slot.breakTag && !BREAK_TAGS.includes(slot.breakTag);
  const listId = `cat-${slot.id}`;

  const setKind = (kind: SlotKind) => {
    if (kind === slot.kind) return;
    if (kind === 'break')
      updateSlot(slot.id, { kind, breakTag: slot.breakTag || 'BREAK', color: BREAK_GRAY, icon: slot.icon || 'Coffee', category: undefined });
    else updateSlot(slot.id, { kind, category: slot.category || 'FOCUS BLOCK', color: slot.color === BREAK_GRAY ? '#2563EB' : slot.color, icon: slot.icon || 'BookOpen' });
  };

  return (
    <div className="flex flex-col gap-3 pt-1">
      <SegmentedControl<SlotKind>
        label="Type"
        value={slot.kind}
        onChange={setKind}
        options={[
          { value: 'study', label: 'Study Block', icon: <BookOpen strokeWidth={1.75} /> },
          { value: 'break', label: 'Break Strip', icon: <Coffee strokeWidth={1.75} /> },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <TimePicker label="Start" value={slot.start} format={timeFormat} onChange={(v) => setSlotTime(slot.id, 'start', v, null)} />
        <TimePicker label="End" value={slot.end} format={timeFormat} error={endErr} onChange={(v) => setSlotTime(slot.id, 'end', v, autoChain ? chainMode : null)} />
      </div>
      <Input
        label="Duration label"
        placeholder={formatDuration(mins)}
        value={slot.durationOverride ?? ''}
        onChange={(e) => updateSlot(slot.id, { durationOverride: e.target.value || undefined })}
        trailing={<span className="rounded-full bg-fill-2 px-2 py-0.5 font-mono-ui text-[11px] text-ink-2">auto: {formatDuration(mins)}</span>}
        helper={isStudy ? 'Leave empty to use the automatic duration.' : undefined}
      />
      {isStudy ? (
        <>
          <Input
            ref={firstRef}
            label="Title"
            value={slot.title}
            placeholder="e.g. Quantitative Aptitude"
            onChange={(e) => updateSlot(slot.id, { title: e.target.value })}
          />
          <Input
            label="Category tag"
            list={listId}
            value={slot.category ?? ''}
            placeholder="e.g. EARLY BIRD"
            onChange={(e) => updateSlot(slot.id, { category: e.target.value.toUpperCase() })}
          />
          <datalist id={listId}>
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <TextArea label="Sub-topics" value={slot.details ?? ''} placeholder="e.g. High-focus problem sets, DI, Arithmetic" onChange={(e) => updateSlot(slot.id, { details: e.target.value })} />
        </>
      ) : (
        <>
          <Input ref={firstRef} label="Label" value={slot.title} placeholder="e.g. Breakfast & Recharge" onChange={(e) => updateSlot(slot.id, { title: e.target.value })} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-2">Break tag</span>
            <div className="flex flex-wrap gap-1.5">
              {[...BREAK_TAGS, 'Custom'].map((t) => {
                const active = t === 'Custom' ? tagIsCustom : slot.breakTag === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => updateSlot(slot.id, { breakTag: t === 'Custom' ? (tagIsCustom ? slot.breakTag : 'BREATHE') : t })}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] pointer-coarse:px-3 pointer-coarse:py-2.5 ${active ? 'bg-ink text-surface' : 'bg-fill-2 text-ink-2 hover:text-ink'}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            {tagIsCustom ? <Input aria-label="Custom break tag" value={slot.breakTag ?? ''} onChange={(e) => updateSlot(slot.id, { breakTag: e.target.value.toUpperCase() })} /> : null}
          </div>
          <Input label="Note (optional)" value={slot.details ?? ''} placeholder="e.g. Hydrate, light walk, fresh air" onChange={(e) => updateSlot(slot.id, { details: e.target.value })} />
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        <ColorPicker label="Colour" value={slot.color} onChange={(color) => updateSlot(slot.id, { color })} />
        <IconPicker label="Icon" value={slot.icon} onChange={(icon) => updateSlot(slot.id, { icon })} />
      </div>
      <SegmentedControl<Slot['column']>
        label="Column placement (2-column layout)"
        size="sm"
        value={slot.column}
        onChange={(column) => updateSlot(slot.id, { column })}
        options={[
          { value: 'auto', label: 'Auto' },
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
        ]}
      />
      <Switch label="Hide on poster" checked={!!slot.hidden} onChange={(hidden) => updateSlot(slot.id, { hidden })} />
      <div className="flex flex-wrap gap-1.5 border-t border-hairline pt-3">
        <Button size="sm" variant="ghost" icon={<Copy strokeWidth={1.75} />} onClick={() => duplicateSlot(slot.id)}>
          Duplicate
        </Button>
        <Button size="sm" variant="ghost" icon={<ArrowUp strokeWidth={1.75} />} disabled={index === 0} onClick={() => moveSlot(slot.id, -1)} aria-label="Move up">
          Up
        </Button>
        <Button size="sm" variant="ghost" icon={<ArrowDown strokeWidth={1.75} />} disabled={index === count - 1} onClick={() => moveSlot(slot.id, 1)} aria-label="Move down">
          Down
        </Button>
        <Button size="sm" variant="ghost" icon={<Plus strokeWidth={1.75} />} onClick={() => addSlot('break', slot.id)}>
          Break after
        </Button>
        <Button size="sm" variant="ghost" icon={<Plus strokeWidth={1.75} />} onClick={() => addSlot('study', slot.id)}>
          Study after
        </Button>
        <Button size="sm" variant="destructive" icon={<Trash2 strokeWidth={1.75} />} onClick={() => deleteSlot(slot.id)} className="ml-auto">
          Delete
        </Button>
      </div>
    </div>
  );
}

'use client';
import { createElement, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDownUp, ChevronRight, CircleAlert, Copy, EyeOff, GripVertical, Palette, Plus, SquareSplitVertical, Trash2, TriangleAlert, Wand2 } from 'lucide-react';
import type { Slot } from '@/lib/types';
import { useProjectStore } from '@/lib/store';
import { toast, useUI } from '@/lib/ui';
import { fillGaps, makeBreak, recolorBySubject, sortByTime, validateSchedule, type GapInfo, type SlotIssue } from '@/lib/schedule';
import { durationMinutes, formatDurationShort, formatRange } from '@/lib/time';
import { addSlot, deleteSlot, duplicateSlot } from '@/lib/actions';
import { getIcon } from '@/lib/icons';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Popover } from '@/components/ui/Popover';
import { cx } from '@/components/ui/layout-context';
import { SlotEditor } from './SlotEditor';

function SlotRow({ slot, index, count, issues, expanded, onToggle }: { slot: Slot; index: number; count: number; issues: SlotIssue[]; expanded: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: slot.id });
  const timeFormat = useProjectStore((s) => s.project.design.timeFormat);
  const [swipe, setSwipe] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const focusTick = useUI((s) => s.focusTick);
  const icon = getIcon(slot.icon);
  const err = issues.some((i) => i.level === 'error');
  const warn = !err && issues.some((i) => i.level === 'warning');

  useEffect(() => {
    if (expanded && focusTick > 0) rowRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [expanded, focusTick]);

  const onPointerDown = (e: RPointerEvent) => {
    if (e.pointerType !== 'touch') return;
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: RPointerEvent) => {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (Math.abs(dy) > Math.abs(dx)) return;
    setSwipe(Math.max(-136, Math.min(0, dx + (revealed ? -136 : 0))));
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    const open = swipe < -60;
    setRevealed(open);
    setSwipe(0);
  };
  const offset = swipe || (revealed ? -136 : 0);

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        rowRef.current = el;
      }}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      className={cx('relative overflow-hidden rounded-xl bg-surface shadow-[0_0_0_var(--hair)_var(--hairline)] dark:bg-surface-2', isDragging && 'shadow-[var(--shadow-lg)]', expanded && 'shadow-[0_0_0_1.5px_var(--accent)]')}
    >
      {/* swipe-revealed actions (touch) */}
      <div className="absolute inset-y-0 right-0 flex" aria-hidden={!revealed}>
        <button type="button" tabIndex={revealed ? 0 : -1} onClick={() => { setRevealed(false); duplicateSlot(slot.id); }} className="grid w-[68px] place-items-center bg-accent text-[12px] font-medium text-white">
          <Copy className="size-5" strokeWidth={1.75} />
          Duplicate
        </button>
        <button type="button" tabIndex={revealed ? 0 : -1} onClick={() => { setRevealed(false); deleteSlot(slot.id); }} className="grid w-[68px] place-items-center bg-danger text-[12px] font-medium text-white">
          <Trash2 className="size-5" strokeWidth={1.75} />
          Delete
        </button>
      </div>
      <div
        className="relative bg-surface transition-transform duration-200 ease-apple dark:bg-surface-2"
        style={{ transform: offset ? `translateX(${offset}px)` : undefined, transition: swipe ? 'none' : undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex min-h-12 items-center gap-1 pr-1.5 pl-0.5 pointer-coarse:min-h-14">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${slot.title || 'slot'}. Press space to pick up, arrow keys to move.`}
            className="grid h-11 w-8 shrink-0 cursor-grab touch-none place-items-center text-ink-3 hover:text-ink-2 active:cursor-grabbing pointer-coarse:w-10"
          >
            <GripVertical className="size-4" strokeWidth={1.75} />
          </button>
          <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: slot.kind === 'study' ? slot.color : 'var(--fill)' }}>
              {icon ? createElement(icon, { className: cx('size-3.5', slot.kind === 'break' && 'text-ink-2'), strokeWidth: 2 }) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cx('block truncate text-[13px] font-medium pointer-coarse:text-[15px]', slot.hidden && 'text-ink-3 line-through')}>{slot.title || 'Untitled'}</span>
              <span className="block truncate font-mono-ui text-[11px] text-ink-2 pointer-coarse:text-[12px]">
                {formatRange(slot.start, slot.end, timeFormat)} · {formatDurationShort(durationMinutes(slot.start, slot.end))}
              </span>
            </span>
            {slot.hidden ? <EyeOff className="size-3.5 shrink-0 text-ink-3" strokeWidth={1.75} aria-label="Hidden" /> : null}
            {err ? <CircleAlert className="size-4 shrink-0 text-danger" strokeWidth={2} aria-label="Has errors" /> : null}
            {warn ? <TriangleAlert className="size-4 shrink-0 text-warning" strokeWidth={2} aria-label="Has warnings" /> : null}
            <span className={cx('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase', slot.kind === 'study' ? 'bg-accent-soft text-accent' : 'bg-fill-2 text-ink-2')}>{slot.kind === 'study' ? 'Study' : slot.breakTag || 'Break'}</span>
            <ChevronRight className={cx('size-4 shrink-0 text-ink-3 transition-transform duration-200', expanded && 'rotate-90')} strokeWidth={1.75} />
          </button>
        </div>
        {issues.length && !expanded ? (
          <div className="px-10 pb-2 text-[11px]">
            {issues.map((i, k) => (
              <div key={k} className={i.level === 'error' ? 'text-danger' : 'text-warning-ink'}>
                {i.message}
              </div>
            ))}
          </div>
        ) : null}
        {expanded ? (
          <div className="border-t border-hairline px-3 pb-3">
            {issues.length ? (
              <div className="mt-2 flex flex-col gap-1 rounded-lg bg-danger-soft px-2.5 py-2 text-[12px]">
                {issues.map((i, k) => (
                  <div key={k} className={cx('flex items-center gap-1.5', i.level === 'error' ? 'text-danger' : 'text-warning-ink')}>
                    {i.level === 'error' ? <CircleAlert className="size-3.5" strokeWidth={2} /> : <TriangleAlert className="size-3.5" strokeWidth={2} />}
                    {i.message}
                  </div>
                ))}
              </div>
            ) : null}
            <SlotEditor slot={slot} index={index} count={count} issues={issues} autoFocus />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GapRow({ gap }: { gap: GapInfo }) {
  const slots = useProjectStore((s) => s.project.slots);
  const setSlots = useProjectStore((s) => s.setSlots);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-hairline-strong px-3 py-1.5 text-[12px] text-ink-2">
      <span className="font-mono-ui">Gap · {gap.minutes} min</span>
      <button
        type="button"
        onClick={() => {
          const i = slots.findIndex((s) => s.id === gap.afterId);
          const out = slots.slice();
          out.splice(i + 1, 0, makeBreak(gap.start, gap.end));
          setSlots(out);
        }}
        className="ml-auto rounded-md px-2 py-1 font-medium text-accent hover:bg-accent-soft pointer-coarse:py-2.5"
      >
        Fill with break
      </button>
    </div>
  );
}

export function ScheduleTab() {
  const slots = useProjectStore((s) => s.project.slots);
  const setup = useProjectStore((s) => s.project.setup);
  const reorder = useProjectStore((s) => s.reorderSlots);
  const setSlots = useProjectStore((s) => s.setSlots);
  const expanded = useUI((s) => s.expandedSlotId);
  const setExpanded = useUI((s) => s.setExpanded);
  const select = useUI((s) => s.select);
  const autoChain = useUI((s) => s.autoChain);
  const chainMode = useUI((s) => s.chainMode);
  const setUI = useUI((s) => s.set);

  const validation = useMemo(
    () => validateSchedule(slots, setup.startTime && setup.endTime ? { start: setup.startTime, end: setup.endTime } : undefined),
    [slots, setup.startTime, setup.endTime],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) reorder(String(e.active.id), String(e.over.id));
  };

  const studyCount = slots.filter((s) => s.kind === 'study').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-2 px-1">
        <div>
          <h2 className="app-heading font-semibold">Schedule</h2>
          <p className="mt-0.5 text-[12px] text-ink-2">
            {studyCount} study · {slots.length - studyCount} breaks
            {validation.errorCount ? <span className="text-danger"> · {validation.errorCount} issue{validation.errorCount > 1 ? 's' : ''}</span> : null}
            {validation.gaps.length ? <span className="text-warning-ink"> · {validation.gaps.length} gap{validation.gaps.length > 1 ? 's' : ''}</span> : null}
          </p>
        </div>
        <Popover
          title="Bulk actions"
          width={248}
          align="end"
          trigger={(p) => (
            <Button size="sm" variant="ghost" icon={<Wand2 strokeWidth={1.75} />} {...p}>
              Bulk
            </Button>
          )}
        >
          {(close) => (
            <div className="flex flex-col">
              {[
                { icon: Palette, label: 'Recolor by subject', run: () => setSlots(recolorBySubject(slots)) },
                { icon: ArrowDownUp, label: 'Sort by time', run: () => setSlots(sortByTime(slots)) },
                {
                  icon: SquareSplitVertical,
                  label: 'Convert all short gaps to breaks',
                  run: () => {
                    const next = fillGaps(slots, 30);
                    if (next.length === slots.length) toast('No short gaps found');
                    setSlots(next);
                  },
                },
              ].map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    a.run();
                    close();
                  }}
                  className="flex h-10 items-center gap-2.5 rounded-lg px-2 text-left text-[13px] hover:bg-fill-2 pointer-coarse:h-12 pointer-coarse:text-[15px]"
                >
                  <a.icon className="size-4 text-ink-2" strokeWidth={1.75} />
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </Popover>
      </div>

      <div className="rounded-xl bg-surface px-3 py-1 shadow-[0_0_0_var(--hair)_var(--hairline)] dark:bg-surface-2">
        <Switch label="Auto-Chain Times" description="Editing an end time shifts the following slots so durations stay the same." checked={autoChain} onChange={(v) => setUI({ autoChain: v })} />
        {autoChain ? (
          <div className="pb-2.5">
            <SegmentedControl<'all' | 'next'>
              size="sm"
              value={chainMode}
              onChange={(v) => setUI({ chainMode: v })}
              options={[
                { value: 'all', label: 'Shift following slots' },
                { value: 'next', label: 'Only next slot' },
              ]}
            />
          </div>
        ) : null}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={slots.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5" role="list" aria-label="Slots">
            {slots.map((s, i) => {
              const gap = validation.gaps.find((g) => g.afterId === s.id);
              return (
                <div key={s.id} role="listitem" className="flex flex-col gap-1.5">
                  <SlotRow
                    slot={s}
                    index={i}
                    count={slots.length}
                    issues={validation.issues[s.id] ?? []}
                    expanded={expanded === s.id}
                    onToggle={() => {
                      if (expanded === s.id) setExpanded(null);
                      else select({ type: 'slot', id: s.id });
                    }}
                  />
                  {gap ? <GapRow gap={gap} /> : null}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {slots.length === 0 ? <p className="rounded-xl border border-dashed border-hairline-strong p-6 text-center text-[13px] text-ink-2">No slots yet. Add your first study block, or generate a full day from the Setup tab.</p> : null}

      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Plus strokeWidth={1.75} />} onClick={() => addSlot('study', slots.length ? slots[slots.length - 1].id : null)}>
          Study block
        </Button>
        <Button icon={<Plus strokeWidth={1.75} />} onClick={() => addSlot('break', slots.length ? slots[slots.length - 1].id : null)}>
          Break
        </Button>
      </div>
    </div>
  );
}

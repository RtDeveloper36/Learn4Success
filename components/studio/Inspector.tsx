'use client';
import { MousePointerClick, X } from 'lucide-react';
import { useProjectStore } from '@/lib/store';
import { BRAND } from '@/lib/brand';
import { useUI } from '@/lib/ui';
import { validateSchedule } from '@/lib/schedule';
import { SlotEditor } from '@/components/editor/SlotEditor';
import { IconButton } from '@/components/ui/Button';

/** Right inspector (≥1536px): edits the selected slot so the left sidebar can stay on the list. */
export function Inspector({ width }: { width: number }) {
  const selection = useUI((s) => s.selection);
  const setUI = useUI((s) => s.set);
  const select = useUI((s) => s.select);
  const slots = useProjectStore((s) => s.project.slots);
  const setup = useProjectStore((s) => s.project.setup);
  const id = selection?.type === 'slot' ? selection.id : null;
  const index = id ? slots.findIndex((s) => s.id === id) : -1;
  const slot = index >= 0 ? slots[index] : null;
  const issues = slot ? (validateSchedule(slots, setup.startTime && setup.endTime ? { start: setup.startTime, end: setup.endTime } : undefined).issues[slot.id] ?? []) : [];

  return (
    <aside className="vibrancy hairline-l flex h-full min-h-0 shrink-0 flex-col" style={{ width }} aria-label="Inspector">
      <div className="hairline-b flex h-12 shrink-0 items-center justify-between pr-1.5 pl-4">
        <h2 className="text-[13px] font-semibold">Inspector</h2>
        <IconButton size="sm" label="Hide inspector" onClick={() => setUI({ inspectorOpen: false })}>
          <X strokeWidth={1.75} />
        </IconButton>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-10">
        {slot ? (
          <div key={slot.id} className="animate-fade-in">
            <div className="mb-2 flex items-center gap-2">
              <span className="size-3 rounded-full" style={{ background: slot.color }} />
              <span className="truncate text-[13px] font-medium">{slot.title || 'Untitled'}</span>
              <button type="button" onClick={() => select(null)} className="ml-auto text-[12px] text-accent">
                Deselect
              </button>
            </div>
            {issues.length ? (
              <div className="mb-2 rounded-lg bg-danger-soft px-2.5 py-2 text-[12px] text-danger">
                {issues.map((i, k) => (
                  <div key={k}>{i.message}</div>
                ))}
              </div>
            ) : null}
            <SlotEditor slot={slot} index={index} count={slots.length} issues={issues} autoFocus />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 pt-16 text-center text-ink-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset */}
            <img src={BRAND.seal} alt={`${BRAND.name} Library logo`} width={64} height={64} className="mb-1 size-16 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.18)]" />
            <MousePointerClick className="size-6" strokeWidth={1.5} />
            <p className="text-[13px]">Select a card on the poster to edit its time, text, colour and icon here.</p>
            <p className="text-[12px]">Double-click any title to edit it right on the canvas.</p>
          </div>
        )}
      </div>
    </aside>
  );
}

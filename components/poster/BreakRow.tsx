import type { Slot } from '@/lib/types';
import { formatRange } from '@/lib/time';
import { PosterIcon, editAttr, selAttrs, type PosterMode } from './shared';

interface Props {
  slot: Slot;
  timeFormat: '12h' | '24h';
  mode: PosterMode;
  selectedKey: string | null;
}

export function BreakRow({ slot, timeFormat, mode, selectedKey }: Props) {
  const key = `slot:${slot.id}`;
  return (
    <div className="p-break" {...selAttrs(mode, key, selectedKey)}>
      <span className="p-break-time">{formatRange(slot.start, slot.end, timeFormat)}</span>
      {slot.icon ? (
        <span className="p-break-icon">
          <PosterIcon name={slot.icon} />
        </span>
      ) : null}
      {slot.breakTag ? <span className="p-break-tag">{slot.breakTag}</span> : null}
      <span className="p-break-title" {...editAttr(mode, `slot.${slot.id}.title`)}>
        {slot.title}
      </span>
      {slot.details ? (
        <span className="p-break-note" {...editAttr(mode, `slot.${slot.id}.details`)}>
          · {slot.details}
        </span>
      ) : null}
      <span className="p-break-line" aria-hidden />
    </div>
  );
}

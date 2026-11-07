import type { Slot } from '@/lib/types';
import { formatRange, formatTime } from '@/lib/time';
import { durationLabel } from '@/lib/schedule';
import { PosterIcon, editAttr, selAttrs, slotVars, type PosterMode } from './shared';

interface Props {
  slot: Slot;
  template: 'timeline' | 'editorial' | 'minimal';
  timeFormat: '12h' | '24h';
  dark: boolean;
  mode: PosterMode;
  selectedKey: string | null;
}

export function StudyCard({ slot, template, timeFormat, dark, mode, selectedKey }: Props) {
  const key = `slot:${slot.id}`;
  const range = formatRange(slot.start, slot.end, timeFormat);
  const dur = durationLabel(slot);

  const text = (
    <div className="p-text">
      {slot.category ? (
        <div className="p-cat" {...editAttr(mode, `slot.${slot.id}.category`)}>
          {slot.category}
        </div>
      ) : null}
      <div className="p-slot-title" {...editAttr(mode, `slot.${slot.id}.title`)}>
        {slot.title || 'Untitled block'}
      </div>
      {slot.details ? (
        <div className="p-details" {...editAttr(mode, `slot.${slot.id}.details`)}>
          {slot.details}
        </div>
      ) : null}
    </div>
  );

  if (template === 'editorial') {
    return (
      <div className="p-card" style={slotVars(slot.color, dark)} {...selAttrs(mode, key, selectedKey)}>
        <div className="p-text">
          <div className="p-ed-time">
            {range}
            <span>{dur}</span>
          </div>
          {slot.category ? (
            <div className="p-cat" {...editAttr(mode, `slot.${slot.id}.category`)}>
              {slot.category}
            </div>
          ) : null}
          <div className="p-slot-title" {...editAttr(mode, `slot.${slot.id}.title`)}>
            {slot.title || 'Untitled block'}
          </div>
          {slot.details ? (
            <div className="p-details" {...editAttr(mode, `slot.${slot.id}.details`)}>
              {slot.details}
            </div>
          ) : null}
        </div>
        {slot.icon ? (
          <div className="p-icon">
            <PosterIcon name={slot.icon} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-card" style={slotVars(slot.color, dark)} {...selAttrs(mode, key, selectedKey)}>
      <div className="p-pill">
        <div className="p-pill-time">
          <span>{formatTime(slot.start, timeFormat)}</span>
          <span className="p-t-sep"> – </span>
          <span>{formatTime(slot.end, timeFormat)}</span>
        </div>
        <div className="p-pill-dur">{dur}</div>
      </div>
      {slot.icon ? (
        <div className="p-icon">
          <PosterIcon name={slot.icon} />
        </div>
      ) : null}
      {text}
    </div>
  );
}

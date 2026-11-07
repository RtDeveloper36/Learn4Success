import type { Slot } from '@/lib/types';
import { groupSlots, splitColumns } from '@/lib/schedule';
import { StudyCard } from './StudyCard';
import { BreakRow } from './BreakRow';
import { slotVars, type TemplateProps } from './shared';

/**
 * Renders the slot column(s).
 * - measure mode + 2 columns: every item stacked in the left column (autofit reads each height).
 * - 2 columns: uses the measured split from autofit; falls back to a count-based split while
 *   a fresh measurement is pending (e.g. right after adding a slot).
 */
function resolveColumns(slots: Slot[], props: TemplateProps): [Slot[], Slot[]] {
  const byId = new Map(slots.map((s) => [s.id, s]));
  if (props.mode === 'measure' || props.design.columns === 1) return [slots, []];
  const split = props.fit.split;
  const known = split ? new Set([...split[0], ...split[1]]) : null;
  const fresh = split && known && slots.every((s) => known.has(s.id)) && known.size === slots.length;
  const [l, r] = fresh ? split! : splitColumns(groupSlots(slots), (id) => (byId.get(id)?.kind === 'study' ? 3 : 1), 0);
  return [l.map((id) => byId.get(id)!).filter(Boolean), r.map((id) => byId.get(id)!).filter(Boolean)];
}

export function SlotList(props: TemplateProps & { rail: boolean }) {
  const { slots, design, mode, dark, selectedKey, rail } = props;
  const [left, right] = resolveColumns(slots, props);
  const cols = design.columns === 2 ? 2 : 1;

  const renderCol = (list: Slot[], side: 'left' | 'right') => (
    <div className="p-col" data-col={side} data-rail={rail && list.length > 0 ? 'true' : 'false'}>
      {list.map((s) => (
        <div className="p-item" key={s.id} data-item-id={s.id}>
          {rail ? <div className="p-gutter">{s.kind === 'study' ? <span className="p-dot" style={slotVars(s.color, dark)} /> : <span className="p-dot-sm" />}</div> : null}
          {s.kind === 'study' ? (
            <StudyCard slot={s} template={design.template} timeFormat={design.timeFormat} dark={dark} mode={mode} selectedKey={selectedKey} />
          ) : (
            <BreakRow slot={s} timeFormat={design.timeFormat} mode={mode} selectedKey={selectedKey} />
          )}
        </div>
      ))}
    </div>
  );

  if (slots.length === 0 && mode !== 'measure') {
    return (
      <div className="p-list" data-cols={1}>
        <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: 14, padding: '48px 0', border: '1px dashed var(--c-border)', borderRadius: 12 }}>
          No slots yet — add a study block or press “Generate”.
        </div>
      </div>
    );
  }

  return (
    <div className="p-list" data-cols={cols}>
      {renderCol(left, 'left')}
      {cols === 2 ? renderCol(right, 'right') : null}
    </div>
  );
}

import { Fragment } from 'react';
import { Check } from 'lucide-react';
import type { Milestone } from '@/lib/types';
import { selAttrs, type PosterMode } from './shared';

export function Milestones({ items, mode, selectedKey }: { items: Milestone[]; mode: PosterMode; selectedKey: string | null }) {
  if (!items.length) return null;
  return (
    <div className="p-milestones" {...selAttrs(mode, 'milestones', selectedKey)}>
      <span className="p-ms-label">Milestones</span>
      <div className="p-ms-track">
        {items.map((m, i) => (
          <Fragment key={m.id}>
            {i > 0 ? <span className="p-ms-sep" aria-hidden /> : null}
            <span className="p-ms" data-done={m.done ? 'true' : 'false'}>
              <span className="p-ms-badge">
                <Check strokeWidth={3} aria-hidden />
              </span>
              {m.label}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

import type { Kpi } from '@/lib/types';
import { selAttrs, type PosterMode } from './shared';

export function KpiBar({ kpis, mode, selectedKey }: { kpis: Kpi[]; mode: PosterMode; selectedKey: string | null }) {
  if (!kpis.length) return null;
  return (
    <div className="p-kpis" style={{ gridTemplateColumns: `repeat(${kpis.length}, minmax(0, 1fr))` }} {...selAttrs(mode, 'kpi', selectedKey)}>
      {kpis.map((k) => (
        <div className="p-kpi" key={k.id}>
          <div className="p-kpi-label">{k.label}</div>
          <div className="p-kpi-value">{k.value}</div>
        </div>
      ))}
    </div>
  );
}

import { PosterHeader } from '../PosterHeader';
import { BrandStrip } from '../LibraryLogo';
import { KpiBar } from '../KpiBar';
import { SlotList } from '../SlotList';
import { Milestones } from '../Milestones';
import { PosterFooter } from '../PosterFooter';
import type { TemplateProps } from '../shared';

/** Editorial two-column: big gradient title, KPI tiles, glowing accent bars, dashed break strips. */
export function Editorial(props: TemplateProps) {
  const { content, mode, selectedKey, kpis, logo, dark } = props;
  const s = content.sections;
  return (
    <>
      {s.header ? (
        <PosterHeader content={content} variant="full" mode={mode} selectedKey={selectedKey} logo={logo} dark={dark} />
      ) : logo ? (
        <BrandStrip dark={dark} position={logo.position} />
      ) : null}
      {s.kpi ? <KpiBar kpis={kpis} mode={mode} selectedKey={selectedKey} /> : null}
      <SlotList {...props} rail={false} />
      {s.milestones ? <Milestones items={content.milestones} mode={mode} selectedKey={selectedKey} /> : null}
      {s.footer ? <PosterFooter content={content} mode={mode} selectedKey={selectedKey} /> : null}
    </>
  );
}

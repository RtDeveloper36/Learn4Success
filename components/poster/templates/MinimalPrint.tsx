import { PosterHeader } from '../PosterHeader';
import { BrandStrip } from '../LibraryLogo';
import { KpiBar } from '../KpiBar';
import { SlotList } from '../SlotList';
import { Milestones } from '../Milestones';
import { PosterFooter } from '../PosterFooter';
import type { TemplateProps } from '../shared';

/** Minimal Print: ink-saving outlines, colour only as thin accents. */
export function MinimalPrint(props: TemplateProps) {
  const { content, mode, selectedKey, kpis, logo, dark } = props;
  const s = content.sections;
  return (
    <>
      {s.header ? (
        <PosterHeader content={content} variant="minimal" mode={mode} selectedKey={selectedKey} logo={logo} dark={dark} />
      ) : logo ? (
        <BrandStrip dark={dark} position={logo.position} />
      ) : null}
      {s.kpi ? <KpiBar kpis={kpis} mode={mode} selectedKey={selectedKey} /> : null}
      <SlotList {...props} rail={s.rail} />
      {s.milestones ? <Milestones items={content.milestones} mode={mode} selectedKey={selectedKey} /> : null}
      {s.footer ? <PosterFooter content={content} mode={mode} selectedKey={selectedKey} /> : null}
    </>
  );
}

import { UserRound } from 'lucide-react';
import type { PosterContent } from '@/lib/types';
import type { ResolvedPosterLogo } from '@/lib/seal';
import { editAttr, selAttrs, type PosterMode } from './shared';
import { LibraryLogo } from './LibraryLogo';

interface Props {
  content: PosterContent;
  variant: 'compact' | 'full' | 'minimal';
  mode: PosterMode;
  selectedKey: string | null;
  logo: ResolvedPosterLogo | null;
  dark: boolean;
}

/**
 * Header: exam + student pills, title, gradient title, subtitle in the main area; the library
 * seal takes a fixed column (seal size + 16px gap) so nothing ever overlaps it.
 */
export function PosterHeader({ content, variant, mode, selectedKey, logo, dark }: Props) {
  const pills =
    content.badgeText || content.studentName ? (
      <div className="p-badges">
        {content.badgeText ? (
          <span className="p-badge" {...editAttr(mode, 'content.badgeText')}>
            {content.showPulseDot ? <span className="p-pulse" aria-hidden /> : null}
            {content.badgeText}
          </span>
        ) : null}
        {content.studentName ? (
          <span className="p-student" {...editAttr(mode, 'content.studentName')}>
            <UserRound strokeWidth={2} aria-hidden />
            {content.studentName}
          </span>
        ) : null}
      </div>
    ) : null;

  const title =
    content.titleMain || content.titleGradient ? (
      <div className="p-title">
        {content.titleMain ? <span {...editAttr(mode, 'content.titleMain')}>{content.titleMain}</span> : null}
        {variant === 'full' ? <br /> : content.titleMain && content.titleGradient ? ' ' : null}
        {content.titleGradient ? (
          <span
            className={variant === 'minimal' ? '' : 'p-grad'}
            style={variant === 'minimal' ? { color: 'var(--c-accent)' } : undefined}
            {...editAttr(mode, 'content.titleGradient')}
          >
            {content.titleGradient}
          </span>
        ) : null}
      </div>
    ) : null;

  return (
    <header className="p-header" data-logo={logo ? logo.position : undefined} {...selAttrs(mode, 'header', selectedKey)}>
      <div className="p-header-main">
        {pills}
        {title || content.subtitle ? (
          <div className="p-title-row">
            {title}
            {content.subtitle ? (
              <div className="p-subtitle" {...editAttr(mode, 'content.subtitle')}>
                {content.subtitle}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {logo ? (
        <div className="p-header-seal" style={{ width: logo.size }}>
          <LibraryLogo size={logo.size} dark={dark} />
        </div>
      ) : null}
    </header>
  );
}

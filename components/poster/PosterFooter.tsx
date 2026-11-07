import { Lock } from 'lucide-react';
import type { PosterContent } from '@/lib/types';
import { editAttr, selAttrs, type PosterMode } from './shared';

/** Renders `“करो या मरो” Rule:` with the quoted part in the accent colour. */
function RuleTitle({ text }: { text: string }) {
  const m = /^(.*?)([“"][^”"]+[”"])(.*)$/.exec(text);
  if (!m) return <b>{text}</b>;
  return (
    <b>
      {m[1]}
      <span className="p-rule-quote">{m[2]}</span>
      {m[3]}
    </b>
  );
}

export function PosterFooter({ content, mode, selectedKey }: { content: PosterContent; mode: PosterMode; selectedKey: string | null }) {
  const hasQuote = content.quoteLine1 || content.quoteLine2;
  const hasRule = content.ruleTitle || content.ruleText || content.ruleHighlight;
  if (!hasQuote && !hasRule) return null;
  return (
    <footer className="p-footer" {...selAttrs(mode, 'footer', selectedKey)}>
      {hasQuote ? (
        <div className="p-quote">
          <span {...editAttr(mode, 'content.quoteLine1')}>{content.quoteLine1}</span>{' '}
          {content.quoteLine2 ? <em {...editAttr(mode, 'content.quoteLine2')}>{content.quoteLine2}</em> : null}
        </div>
      ) : (
        <span />
      )}
      {hasRule ? (
        <div className="p-rule">
          <span className="p-rule-icon">
            <Lock strokeWidth={2.25} aria-hidden />
          </span>
          <div>
            {content.ruleTitle ? <RuleTitle text={content.ruleTitle} /> : null} <span {...editAttr(mode, 'content.ruleText')}>{content.ruleText}</span>{' '}
            {content.ruleHighlight ? <span className="p-rule-hl">{content.ruleHighlight}</span> : null}
          </div>
        </div>
      ) : null}
    </footer>
  );
}

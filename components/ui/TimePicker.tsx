'use client';
import { useId, useState, type KeyboardEvent } from 'react';
import { Clock } from 'lucide-react';
import { addMinutes, formatTime, isValidTime, parseTimeInput } from '@/lib/time';
import { Field, fieldBase } from './Input';
import { cx, useLayout } from './layout-context';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  format: '12h' | '24h';
  placeholder?: string;
  error?: string | null;
  allowEmpty?: boolean;
}

/**
 * 12h/24h-aware time field. Accepts typed input like `0630`, `6:30pm`, `18:30`.
 * ↑/↓ step by 5 minutes. On phones it falls back to the native `type="time"` picker.
 */
export function TimePicker({ label, value, onChange, format, placeholder, error, allowEmpty }: Props) {
  const id = useId();
  const { touch, stacked } = useLayout();
  const [draft, setDraft] = useState(value ? formatTime(value, format) : '');
  const [bad, setBad] = useState(false);
  const sig = `${value}|${format}`;
  const [prevSig, setPrevSig] = useState(sig);
  if (prevSig !== sig) {
    setPrevSig(sig);
    setDraft(value ? formatTime(value, format) : '');
    setBad(false);
  }

  if (touch && stacked) {
    return (
      <Field label={label} htmlFor={id} error={error}>
        <input
          id={id}
          type="time"
          value={isValidTime(value) ? value : ''}
          step={300}
          onChange={(e) => (e.target.value || allowEmpty) && onChange(e.target.value)}
          className={cx(fieldBase, 'font-mono-ui')}
          enterKeyHint="next"
        />
      </Field>
    );
  }

  const commit = () => {
    if (!draft.trim()) {
      if (allowEmpty) {
        onChange('');
        setBad(false);
      } else setDraft(value ? formatTime(value, format) : '');
      return;
    }
    const parsed = parseTimeInput(draft);
    if (!parsed) {
      setBad(true);
      return;
    }
    setBad(false);
    setDraft(formatTime(parsed, format));
    if (parsed !== value) onChange(parsed);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const base = parseTimeInput(draft) ?? value ?? '00:00';
      const next = addMinutes(base || '00:00', e.key === 'ArrowUp' ? 5 : -5);
      setDraft(formatTime(next, format));
      onChange(next);
    }
  };

  return (
    <Field label={label} htmlFor={id} error={bad ? 'Try a time like 0630, 6:30pm or 18:30' : error}>
      <div className="relative">
        <Clock className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" strokeWidth={1.75} aria-hidden />
        <input
          id={id}
          value={draft}
          placeholder={placeholder ?? (format === '12h' ? '06:30 AM' : '06:30')}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKey}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="next"
          aria-invalid={bad || !!error}
          className={cx(fieldBase, 'pl-8 font-mono-ui tabular-nums', (bad || error) && 'shadow-[0_0_0_1px_var(--danger)]')}
        />
      </div>
    </Field>
  );
}

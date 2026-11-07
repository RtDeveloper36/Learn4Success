/**
 * Time helpers. Internally every time is a 24h "HH:MM" string.
 * Durations that cross midnight are handled by wrapping (end < start ⇒ +24h).
 */

export const DAY = 1440;

export function toMinutes(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return NaN;
  return (Number(m[1]) % 24) * 60 + Number(m[2]);
}

export function fromMinutes(min: number): string {
  const v = ((Math.round(min) % DAY) + DAY) % DAY;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isValidTime(t: string | undefined | null): t is string {
  return !!t && !Number.isNaN(toMinutes(t));
}

/**
 * Parses loose user input into "HH:MM".
 * Accepts: "0630", "630", "6:30", "6.30", "6", "6pm", "6:30 pm", "18:30", "6:30p", "12am".
 * Returns null when it cannot be understood.
 */
export function parseTimeInput(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  const m = /^(\d{1,4})(?:[:.](\d{1,2}))?(a|am|p|pm)?$/.exec(s);
  if (!m) return null;
  let h: number;
  let min: number;
  const [, a, b, ap] = m;
  if (b !== undefined) {
    h = Number(a);
    min = Number(b.padEnd(2, '0'));
  } else if (a.length <= 2) {
    h = Number(a);
    min = 0;
  } else {
    const padded = a.padStart(4, '0');
    h = Number(padded.slice(0, 2));
    min = Number(padded.slice(2));
  }
  if (min > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    const pm = ap.startsWith('p');
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
  }
  if (h > 24) return null;
  if (h === 24) h = 0;
  return fromMinutes(h * 60 + min);
}

/** "06:30" → "06:30 AM" (12h) or "06:30" (24h) */
export function formatTime(t: string, format: '12h' | '24h'): string {
  const v = toMinutes(t);
  if (Number.isNaN(v)) return t || '--:--';
  if (format === '24h') return fromMinutes(v);
  const h = Math.floor(v / 60);
  const m = v % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
}

export function formatRange(start: string, end: string, format: '12h' | '24h'): string {
  return `${formatTime(start, format)} – ${formatTime(end, format)}`;
}

/** Duration in minutes, wrapping across midnight. Returns 0 for invalid or equal times. */
export function durationMinutes(start: string, end: string): number {
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  const d = b - a;
  return d < 0 ? d + DAY : d;
}

/** 120 → "2 HRS", 60 → "1 HR", 90 → "1 HR 30 MIN", 40 → "40 MIN" */
export function formatDuration(min: number): string {
  if (min <= 0) return '0 MIN';
  const h = Math.floor(min / 60);
  const m = min % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ${h === 1 ? 'HR' : 'HRS'}`);
  if (m > 0) parts.push(`${m} MIN`);
  return parts.join(' ');
}

/** Lower-case friendly duration for UI badges, e.g. "1h 30m" */
export function formatDurationShort(min: number): string {
  if (min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ');
}

export function addMinutes(t: string, delta: number): string {
  const v = toMinutes(t);
  if (Number.isNaN(v)) return t;
  return fromMinutes(v + delta);
}

export function snap(min: number, step = 10): number {
  return Math.round(min / step) * step;
}

/**
 * Converts a list of [start, end] pairs into absolute minutes along a single day line,
 * where each next slot is placed at or after the previous start (supports midnight crossing).
 */
export function toTimeline(pairs: { start: string; end: string }[]): { s: number; e: number }[] {
  const out: { s: number; e: number }[] = [];
  let offset = 0;
  let prevStart = -1;
  for (const p of pairs) {
    let s = toMinutes(p.start);
    if (Number.isNaN(s)) s = prevStart < 0 ? 0 : prevStart - offset;
    if (prevStart >= 0 && s + offset < prevStart - 720) offset += DAY;
    const abs = s + offset;
    const e = abs + durationMinutes(p.start, p.end);
    out.push({ s: abs, e });
    prevStart = abs;
  }
  return out;
}

export function rangesOverlap(a: { s: number; e: number }, b: { s: number; e: number }): boolean {
  return a.s < b.e && b.s < a.e;
}

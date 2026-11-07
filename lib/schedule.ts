/** Schedule-level helpers: KPIs, validation, chaining, column split, bulk actions. */
import type { Kpi, PosterContent, Slot } from './types';
import { BREAK_GRAY, SUBJECT_COLOR_ROTATION } from './presets';
import { addMinutes, durationMinutes, formatDuration, formatTime, fromMinutes, toMinutes, toTimeline } from './time';
import { uid } from './defaults';
import { BRAND } from './brand';

export const visibleSlots = (slots: Slot[]) => slots.filter((s) => !s.hidden);

export function durationLabel(slot: Slot): string {
  return slot.durationOverride?.trim() || formatDuration(durationMinutes(slot.start, slot.end));
}

export function focusRuleFromTitle(ruleTitle: string): string {
  const quoted = /[“"«]([^”"»]+)[”"»]/.exec(ruleTitle);
  if (quoted) return quoted[1].trim();
  return ruleTitle.replace(/rule:?/i, '').trim() || '—';
}

export function computeAutoKpis(slots: Slot[], content: PosterContent, timeFormat: '12h' | '24h'): Kpi[] {
  const vis = visibleSlots(slots);
  const study = vis.filter((s) => s.kind === 'study');
  const total = study.reduce((n, s) => n + durationMinutes(s.start, s.end), 0);
  const window = vis.length ? `${formatTime(vis[0].start, timeFormat)} – ${formatTime(vis[vis.length - 1].end, timeFormat)}` : '—';
  return [
    { id: 'k1', label: 'Total Study', value: total ? formatDuration(total) : '0 MIN' },
    { id: 'k2', label: 'Core Blocks', value: String(study.length) },
    { id: 'k3', label: 'Active Window', value: window },
    { id: 'k4', label: 'Focus Rule', value: focusRuleFromTitle(content.ruleTitle) },
  ];
}

export function effectiveKpis(slots: Slot[], content: PosterContent, timeFormat: '12h' | '24h'): Kpi[] {
  return content.kpiMode === 'auto' ? computeAutoKpis(slots, content, timeFormat) : content.kpis.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export type IssueLevel = 'error' | 'warning';
export interface SlotIssue {
  level: IssueLevel;
  message: string;
}
export interface GapInfo {
  afterId: string;
  start: string;
  end: string;
  minutes: number;
}

export interface ValidationResult {
  issues: Record<string, SlotIssue[]>;
  gaps: GapInfo[];
  errorCount: number;
  warningCount: number;
}

export function validateSchedule(slots: Slot[], window?: { start: string; end: string }): ValidationResult {
  const issues: Record<string, SlotIssue[]> = {};
  const gaps: GapInfo[] = [];
  const push = (id: string, i: SlotIssue) => (issues[id] ??= []).push(i);
  const vis = visibleSlots(slots);
  const tl = toTimeline(vis);

  vis.forEach((s, i) => {
    if (Number.isNaN(toMinutes(s.start)) || Number.isNaN(toMinutes(s.end))) {
      push(s.id, { level: 'error', message: 'Invalid time' });
      return;
    }
    if (toMinutes(s.end) <= toMinutes(s.start) && !(toMinutes(s.end) < toMinutes(s.start) && toMinutes(s.start) >= 18 * 60 && toMinutes(s.end) <= 6 * 60)) {
      push(s.id, { level: 'error', message: 'End time must be after start time' });
    }
    const next = vis[i + 1];
    if (next) {
      const a = tl[i];
      const b = tl[i + 1];
      if (b.s < a.e) {
        push(s.id, { level: 'error', message: `Overlaps “${next.title || 'next slot'}”` });
        push(next.id, { level: 'error', message: `Overlaps “${s.title || 'previous slot'}”` });
      } else if (b.s > a.e) {
        gaps.push({ afterId: s.id, start: fromMinutes(a.e), end: fromMinutes(b.s), minutes: b.s - a.e });
      }
    }
  });

  if (window && window.start && window.end && vis.length) {
    const ws = toMinutes(window.start);
    let we = toMinutes(window.end);
    if (!Number.isNaN(ws) && !Number.isNaN(we)) {
      if (we <= ws) we += 1440;
      let wsAbs = ws;
      if (tl[0].s - wsAbs > 720) wsAbs += 1440;
      const weAbs = wsAbs + (we - ws);
      vis.forEach((s, i) => {
        if (tl[i].s < wsAbs || tl[i].e > weAbs) push(s.id, { level: 'warning', message: 'Outside your daily window' });
      });
    }
  }

  let errorCount = 0;
  let warningCount = 0;
  Object.values(issues).forEach((list) =>
    list.forEach((i) => (i.level === 'error' ? errorCount++ : warningCount++)),
  );
  return { issues, gaps, errorCount, warningCount };
}

/* ------------------------------------------------------------------ */
/* Editing helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Auto-chain: after changing slot `id`'s end time by `delta` minutes, shift following slots.
 * mode 'all' shifts every following slot; mode 'next' only moves the next slot's start
 * (its end stays, so its duration changes).
 */
export function chainTimes(slots: Slot[], id: string, delta: number, mode: 'all' | 'next'): Slot[] {
  const i = slots.findIndex((s) => s.id === id);
  if (i < 0 || delta === 0) return slots;
  return slots.map((s, j) => {
    if (j <= i) return s;
    if (mode === 'next') return j === i + 1 ? { ...s, start: addMinutes(s.start, delta) } : s;
    return { ...s, start: addMinutes(s.start, delta), end: addMinutes(s.end, delta) };
  });
}

export function makeBreak(start: string, end: string): Slot {
  return {
    id: uid('slot'),
    kind: 'break',
    start,
    end,
    breakTag: 'REST',
    title: 'Short Break',
    details: '',
    color: BREAK_GRAY,
    icon: 'Pause',
    column: 'auto',
  };
}

export function makeStudy(start: string, end: string, color = '#2563EB'): Slot {
  return {
    id: uid('slot'),
    kind: 'study',
    start,
    end,
    category: 'FOCUS BLOCK',
    title: 'New Subject',
    details: 'Topics to cover',
    color,
    icon: 'BookOpen',
    column: 'auto',
  };
}

export function fillGaps(slots: Slot[], maxGap = Infinity): Slot[] {
  const { gaps } = validateSchedule(slots);
  if (!gaps.length) return slots;
  const out: Slot[] = [];
  for (const s of slots) {
    out.push(s);
    const g = gaps.find((x) => x.afterId === s.id);
    if (g && g.minutes <= maxGap) out.push(makeBreak(g.start, g.end));
  }
  return out;
}

export function sortByTime(slots: Slot[]): Slot[] {
  const first = slots.length ? toMinutes(slots[0].start) : 0;
  const key = (s: Slot) => {
    const v = toMinutes(s.start);
    return v < first - 360 ? v + 1440 : v;
  };
  return [...slots].sort((a, b) => key(a) - key(b));
}

const baseSubject = (title: string) => title.split(/·|\(|—|-/)[0].trim().toLowerCase();

/** Same subject ⇒ same colour; adjacent study blocks never share a colour. */
export function recolorBySubject(slots: Slot[]): Slot[] {
  const map = new Map<string, string>();
  let n = 0;
  let prev: string | null = null;
  return slots.map((s) => {
    if (s.kind === 'break') return s;
    const key = baseSubject(s.title);
    if (!map.has(key)) map.set(key, SUBJECT_COLOR_ROTATION[n++ % SUBJECT_COLOR_ROTATION.length]);
    let color = map.get(key)!;
    if (color === prev) color = SUBJECT_COLOR_ROTATION.find((c) => c !== prev) ?? color;
    prev = color;
    return { ...s, color };
  });
}

/* ------------------------------------------------------------------ */
/* Two-column split                                                    */
/* ------------------------------------------------------------------ */

export interface SlotGroup {
  ids: string[];
  column: 'auto' | 'left' | 'right';
}

/** A break stays attached to the study block before it; leading breaks join the first group. */
export function groupSlots(slots: Slot[]): SlotGroup[] {
  const groups: SlotGroup[] = [];
  for (const s of visibleSlots(slots)) {
    if (s.kind === 'study' || groups.length === 0) groups.push({ ids: [s.id], column: s.kind === 'study' ? s.column : 'auto' });
    else {
      const g = groups[groups.length - 1];
      g.ids.push(s.id);
      if (g.column === 'auto' && s.column !== 'auto') g.column = s.column;
    }
  }
  return groups;
}

/**
 * Balance groups between two columns by measured height (not slot count).
 * Manual left/right overrides are respected; auto groups are split contiguously
 * so each column still reads top-to-bottom in time order.
 */
export function splitColumns(groups: SlotGroup[], heightOf: (id: string) => number, gap: number): [string[], string[]] {
  const h = (g: SlotGroup) => g.ids.reduce((n, id) => n + heightOf(id) + gap, 0);
  const forcedL = groups.filter((g) => g.column === 'left');
  const forcedR = groups.filter((g) => g.column === 'right');
  const auto = groups.filter((g) => g.column === 'auto');
  const baseL = forcedL.reduce((n, g) => n + h(g), 0);
  const baseR = forcedR.reduce((n, g) => n + h(g), 0);
  let best = { k: auto.length, score: Infinity };
  for (let k = 0; k <= auto.length; k++) {
    const l = baseL + auto.slice(0, k).reduce((n, g) => n + h(g), 0);
    const r = baseR + auto.slice(k).reduce((n, g) => n + h(g), 0);
    const score = Math.max(l, r);
    if (score < best.score - 0.5) best = { k, score };
  }
  const leftSet = new Set([...forcedL, ...auto.slice(0, best.k)]);
  const left: string[] = [];
  const right: string[] = [];
  for (const g of groups) (leftSet.has(g) ? left : right).push(...g.ids);
  return [left, right];
}

/* ------------------------------------------------------------------ */
/* Filenames                                                           */
/* ------------------------------------------------------------------ */

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9ऀ-ॿ]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function exportFilename(content: PosterContent, ext: 'pdf' | 'png' | 'json'): string {
  const parts = [slugify(content.examName), slugify(content.studentName)].filter(Boolean);
  const prefix = BRAND.shortName;
  if (!parts.length) return `${prefix}-Master-Study-Timetable-A4.${ext}`;
  return `${prefix}-${parts.join('-')}-Timetable-A4.${ext}`;
}

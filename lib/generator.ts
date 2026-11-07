/**
 * Smart timetable generator — pure and deterministic.
 *
 * Same input (including `seed`) ⇒ same output. No DOM, no Date.now(), no Math.random():
 * randomness comes from a seeded PRNG so "Shuffle variation" is reproducible.
 *
 * Pipeline
 * 1. Resolve the window (defaults 06:30 → 21:30, supports midnight crossing) and the subjects
 *    (custom list → exam preset → default master subjects).
 * 2. Reserve anchored meal/reset breaks that fall inside the window.
 * 3. Walk the timeline: fill the free time with study blocks (30–120 min, snapped to 10),
 *    inserting 10-min rests between blocks and 15-min breaks after ≥ 2h of study.
 * 4. Heavy subjects go first (morning), light subjects become 30-min RAPID FIRE slots in the
 *    evening, and the day always ends with a 30-min WRAP-UP.
 * 5. Tag categories by time of day (overridden by subject maps), colour subjects consistently.
 */
import type { PosterContent, SetupInput, Slot } from './types';
import { DEFAULT_SUBJECTS, defaultSlots, uid } from './defaults';
import {
  BREAK_GRAY,
  SHORT_BREAKS,
  SUBJECT_COLOR_ROTATION,
  findPreset,
  isFinanceSubject,
  subjectInfo,
} from './presets';
import { DAY, fromMinutes, parseTimeInput, snap, toMinutes } from './time';

export interface GenerateResult {
  slots: Slot[];
  contentPatch: Partial<PosterContent>;
  warnings: string[];
  /** label of the exam preset used for subjects, if any */
  presetLabel: string | null;
  subjectSource: 'custom' | 'preset' | 'default';
}

/** Small, fast seeded PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rotate<T>(arr: T[], by: number): T[] {
  if (arr.length === 0) return arr;
  const k = ((by % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

export function isSetupBlank(s: SetupInput): boolean {
  return (
    !s.examName.trim() &&
    !s.studentName.trim() &&
    !s.startTime.trim() &&
    !s.endTime.trim() &&
    s.subjects.filter((x) => x.trim()).length === 0 &&
    s.blockLength === 120 &&
    s.breakStyle === 'balanced'
  );
}

interface Job {
  base: string;
  title: string;
  details: string;
  icon: string;
  weight: number;
  len: number;
  category?: string;
}

interface Placed {
  kind: 'study' | 'break';
  s: number;
  e: number;
  title: string;
  details: string;
  icon: string;
  tag?: string;
  base?: string;
  category?: string;
  weight?: number;
}

function timeOfDayCategory(absMin: number): string {
  const m = ((absMin % DAY) + DAY) % DAY;
  if (m < 8 * 60) return 'EARLY BIRD';
  if (m < 12 * 60) return 'MORNING CORE';
  if (m < 15 * 60) return 'AFTERNOON FOCUS';
  if (m < 18 * 60) return 'POWER HOURS';
  return 'EVENING SPRINT';
}

/** Absolute minute (≥ dayStart) at which a given clock time next occurs. */
function nextOccurrence(clockMin: number, from: number): number {
  let v = clockMin;
  while (v < from) v += DAY;
  return v;
}

export function generateTimetable(input: SetupInput): GenerateResult {
  const warnings: string[] = [];
  const contentPatch = buildContentPatch(input);

  // 1. Everything blank ⇒ exactly the default master schedule.
  if (isSetupBlank(input) && input.seed === 0) {
    return { slots: defaultSlots(), contentPatch, warnings, presetLabel: null, subjectSource: 'default' };
  }

  const rng = mulberry32(input.seed * 7919 + 17);

  // Window ---------------------------------------------------------------
  const startStr = parseTimeInput(input.startTime) ?? '06:30';
  const endStr = parseTimeInput(input.endTime) ?? '21:30';
  const S = toMinutes(startStr);
  let E = toMinutes(endStr);
  if (E <= S) {
    E += DAY;
    if (input.endTime.trim()) warnings.push('End time is before start time — treated as a window that crosses midnight.');
  }
  if (E - S < 60) {
    warnings.push('The window is under 1 hour, so it was extended to 3 hours.');
    E = S + 180;
  } else if (E - S < 180) {
    warnings.push('The study window is under 3 hours — the timetable will be very short.');
  }

  // Subjects -------------------------------------------------------------
  const custom = input.subjects.map((s) => s.trim()).filter(Boolean);
  const preset = custom.length ? null : findPreset(input.examName);
  const subjects = custom.length ? custom : preset ? preset.subjects : DEFAULT_SUBJECTS;
  const subjectSource: GenerateResult['subjectSource'] = custom.length ? 'custom' : preset ? 'preset' : 'default';
  const unique = Array.from(new Set(subjects));

  const L = input.breakStyle === 'frequent' ? Math.min(input.blockLength, 60) : input.blockLength;
  const infos = unique.map((name) => ({ name, info: subjectInfo(name) }));
  const heavy = rotate(infos.filter((x) => x.info.weight >= 2), input.seed);
  const normal = rotate(infos.filter((x) => x.info.weight === 1), input.seed * 3);
  const light = infos.filter((x) => x.info.weight < 1);

  const lenFor = (w: number): number => {
    if (w >= 2) return L;
    if (L === 120) return rng() < 0.5 ? 90 : 120;
    return L;
  };

  const toJob = (x: { name: string; info: ReturnType<typeof subjectInfo> }, suffix?: string, suffixDetails?: string): Job => ({
    base: x.name,
    title: suffix ? `${x.name} · ${suffix}` : x.name,
    details: suffixDetails ?? x.info.details,
    icon: x.info.icon,
    weight: x.info.weight,
    len: suffix ? Math.min(L, 90) : lenFor(x.info.weight),
    category: x.info.category,
  });

  // First pass: heavy (analytical) subjects first so they land in the morning, then normal ones.
  const firstPass: Job[] = [...heavy, ...normal].map((x) => toJob(x));
  // If light-only input, treat light subjects as normal jobs to avoid an empty day.
  if (firstPass.length === 0) light.forEach((x) => firstPass.push({ ...toJob(x), len: Math.min(L, 60), weight: 1 }));
  const lightQueue: Job[] = firstPass.length && heavy.length + normal.length > 0 ? light.map((x) => ({ ...toJob(x), len: 30 })) : [];

  // 2. Anchored breaks -----------------------------------------------------
  const wrapLen = E - S >= 90 ? 30 : 0;
  const wrapStart = E - wrapLen;
  const style = input.breakStyle;
  const anchorDefs = [
    { at: 8 * 60 + 30, dur: style === 'light' ? 45 : 60, tag: 'BREAK', title: 'Breakfast & Recharge', details: 'Hydrate, light walk, fresh air', icon: 'Coffee' },
    { at: 13 * 60 + 40, dur: style === 'light' ? 45 : 30, tag: 'LUNCH', title: 'Lunch & Power Nap', details: 'Light meal, 15-min rest', icon: 'Utensils' },
    { at: 18 * 60 + 40, dur: style === 'light' ? 15 : 20, tag: 'BREAK', title: 'Evening Reset', details: 'Walk, stretch, hydrate', icon: 'Footprints' },
  ];
  const anchors = anchorDefs
    .map((a) => ({ ...a, start: nextOccurrence(a.at, S) }))
    .filter((a) => a.start >= S + 30 && a.start + a.dur <= wrapStart - 30)
    .sort((a, b) => a.start - b.start);

  // Fit the first pass into the available time: if every subject cannot fit at its preferred
  // length, shrink blocks proportionally (min 30 min) so no subject is silently dropped.
  {
    const anchorTotal = anchors.reduce((n, a) => n + a.dur, 0);
    const blocks = firstPass.length + lightQueue.length;
    const available = wrapStart - S - anchorTotal - Math.max(0, blocks - 1 - anchors.length) * 11;
    const need = firstPass.reduce((n, j) => n + j.len, 0);
    const lightNeed = lightQueue.length * 30;
    if (need + lightNeed > available && need > 0) {
      const f = Math.max(0, available - lightNeed) / need;
      firstPass.forEach((j) => (j.len = Math.max(30, snap(j.len * f, 10))));
    }
  }

  const repeatPlan: { suffix: string; details: string }[] = [
    { suffix: 'PYQs', details: 'Previous-year questions, timed practice' },
    { suffix: 'Part 2', details: 'Advanced sets & weak areas' },
    { suffix: 'Revision', details: 'Spaced revision, error log' },
  ];
  const repeatPool = heavy.length ? [...heavy, ...normal] : normal.length ? normal : infos;
  let fpIndex = 0;
  let repIndex = 0;

  /** Next subject job, never the same subject as `avoid` when an alternative exists. */
  const nextJob = (avoid: string | null): Job => {
    if (fpIndex < firstPass.length) {
      let j = firstPass[fpIndex];
      if (j.base === avoid && fpIndex + 1 < firstPass.length) {
        [firstPass[fpIndex], firstPass[fpIndex + 1]] = [firstPass[fpIndex + 1], firstPass[fpIndex]];
        j = firstPass[fpIndex];
      }
      fpIndex++;
      return j;
    }
    for (let tries = 0; tries < repeatPool.length + 1; tries++) {
      const x = repeatPool[repIndex % repeatPool.length];
      const plan = repeatPlan[Math.floor(repIndex / repeatPool.length) % repeatPlan.length];
      repIndex++;
      if (x.name !== avoid || repeatPool.length === 1) return toJob(x, plan.suffix, plan.details);
    }
    return toJob(repeatPool[0], 'Revision', repeatPlan[2].details);
  };

  // 3. Walk the timeline ----------------------------------------------------
  const out: Placed[] = [];
  let cursor = S;
  let continuous = 0;
  let lastSubject: string | null = null;
  let anchorIdx = 0;
  let breakRot = input.seed % SHORT_BREAKS.length;
  const eveningAbs = nextOccurrence(17 * 60, S);
  const maxBlock = Math.max(L, 120);
  let guard = 0;

  while (cursor < wrapStart && guard++ < 200) {
    while (anchorIdx < anchors.length && anchors[anchorIdx].start + anchors[anchorIdx].dur <= cursor) anchorIdx++;
    const anchor = anchors[anchorIdx];
    const limit = anchor ? anchor.start : wrapStart;
    const gap = limit - cursor;

    if (anchor && gap < 30) {
      // Place the anchored break now, absorbing any small gap before it.
      let end = anchor.start + anchor.dur;
      if (end - cursor < 10) end = cursor + anchor.dur;
      out.push({ kind: 'break', s: cursor, e: end, tag: anchor.tag, title: anchor.title, details: anchor.details, icon: anchor.icon });
      cursor = end;
      continuous = 0;
      anchorIdx++;
      continue;
    }
    if (!anchor && gap < 30) {
      // Leftover before the wrap-up: give it to the previous item.
      const last = out[out.length - 1];
      if (last) last.e += gap;
      cursor = wrapStart;
      break;
    }

    // Pick a subject. Light subjects become 30-min RAPID FIRE slots in the evening
    // (or as soon as only enough time for them remains).
    const anchorTimeLeft = anchors.slice(anchorIdx).reduce((n, a) => n + a.dur, 0);
    const studyTimeLeft = wrapStart - cursor - anchorTimeLeft;
    const lightDue =
      lightQueue.length > 0 &&
      out.some((p) => p.kind === 'study') &&
      (gap < 45 || studyTimeLeft <= lightQueue.length * 40 + 40 || (fpIndex >= firstPass.length && cursor >= eveningAbs));
    const job: Job = lightDue ? (lightQueue[0].base === lastSubject && lightQueue.length > 1 ? lightQueue.splice(1, 1)[0] : lightQueue.shift()!) : nextJob(lastSubject);

    let len = Math.min(job.len, gap);
    len = Math.max(30, snap(len, 10));
    if (len > gap) len = gap;
    const leftover = gap - len;
    const nextBreak = continuous + len >= 120 ? 15 : 10;
    if (leftover > 0 && leftover < 30 + nextBreak) {
      if (len + leftover <= maxBlock && job.weight >= 1) len += leftover;
      else if (!anchor) len += leftover;
    }

    out.push({
      kind: 'study',
      s: cursor,
      e: cursor + len,
      title: job.title,
      details: job.details,
      icon: job.icon,
      base: job.base,
      category: lightDue ? 'RAPID FIRE' : job.category,
      weight: job.weight,
    });
    cursor += len;
    continuous += len;
    lastSubject = job.base;

    if (cursor >= wrapStart) break;
    const nextLimit = anchors[anchorIdx] ? anchors[anchorIdx].start : wrapStart;
    if (anchors[anchorIdx] && nextLimit - cursor < 30) continue; // the anchor follows directly
    const needBreak = style === 'light' ? continuous >= 90 : true;
    if (!needBreak) continue;
    const bl = continuous >= 120 ? 15 : 10;
    if (nextLimit - cursor - bl < 30) continue;
    if (bl === 15) {
      out.push({ kind: 'break', s: cursor, e: cursor + bl, tag: 'BREAK', title: 'Tea & Stretch', details: 'Hydrate, move around', icon: 'Coffee' });
    } else {
      const b = SHORT_BREAKS[breakRot % SHORT_BREAKS.length];
      breakRot++;
      out.push({ kind: 'break', s: cursor, e: cursor + bl, tag: b.tag, title: b.title, details: b.details, icon: b.icon });
    }
    cursor += bl;
    continuous = 0;
  }

  if (wrapLen) {
    out.push({
      kind: 'study',
      s: wrapStart,
      e: E,
      title: 'Daily Revision',
      details: 'Recap today’s notes, error log, plan tomorrow',
      icon: 'RotateCcw',
      base: '__wrap',
      category: 'WRAP-UP',
      weight: 1,
    });
  }

  // 4–7. Categories & colours ----------------------------------------------
  const colorOf = new Map<string, string>();
  unique.forEach((name, i) => colorOf.set(name, SUBJECT_COLOR_ROTATION[i % SUBJECT_COLOR_ROTATION.length]));
  colorOf.set('__wrap', '#7C3AED');
  let financeN = 0;
  let prevStudyColor: string | null = null;

  const slots: Slot[] = out.map((p) => {
    if (p.kind === 'break') {
      return {
        id: uid('slot'),
        kind: 'break',
        start: fromMinutes(p.s),
        end: fromMinutes(p.e),
        title: p.title,
        details: p.details,
        breakTag: p.tag,
        color: BREAK_GRAY,
        icon: p.icon,
        column: 'auto',
      };
    }
    let category = p.category ?? timeOfDayCategory(p.s);
    if (p.base && isFinanceSubject(p.base)) category = `FINANCE ${++financeN}`;
    let color = colorOf.get(p.base ?? '') ?? SUBJECT_COLOR_ROTATION[0];
    if (color === prevStudyColor) {
      color = SUBJECT_COLOR_ROTATION.find((c) => c !== prevStudyColor && c !== '#7C3AED') ?? color;
    }
    prevStudyColor = color;
    return {
      id: uid('slot'),
      kind: 'study',
      start: fromMinutes(p.s),
      end: fromMinutes(p.e),
      category,
      title: p.title,
      details: p.details,
      color,
      icon: p.icon,
      column: 'auto',
    };
  });

  const studyCount = slots.filter((s) => s.kind === 'study').length;
  const breakCount = slots.length - studyCount;
  contentPatch.subtitle = `${studyCount} focused blocks · ${breakCount} smart breaks · one locked-in day`;

  return { slots, contentPatch, warnings, presetLabel: preset?.label ?? null, subjectSource };
}

function buildContentPatch(input: SetupInput): Partial<PosterContent> {
  const exam = input.examName.trim();
  const student = input.studentName.trim();
  return {
    examName: exam,
    studentName: student,
    badgeText: exam ? exam.toUpperCase() : 'KARO YA MARO',
    subtitle: '10 focused blocks · 8 smart breaks · one locked-in day',
  };
}

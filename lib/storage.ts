/**
 * Persistence: zod schemas, schema migrations, JSON import/export and share links.
 * Everything here is client-only and side-effect free except the explicit helpers.
 */
import { z } from 'zod';
import LZString from 'lz-string';
import type { Project } from './types';
import { defaultContent, defaultDesign, defaultSetup, uid } from './defaults';

export const STORAGE_KEY = 'timetable-studio:v1';
export const CURRENT_SCHEMA = 1;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const time = z.string().regex(/^\d{2}:\d{2}$/);

const SlotSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['study', 'break']),
  start: time,
  end: time,
  durationOverride: z.string().optional(),
  category: z.string().optional(),
  title: z.string(),
  details: z.string().optional(),
  breakTag: z.string().optional(),
  color: hex,
  icon: z.string().nullable(),
  column: z.enum(['auto', 'left', 'right']).default('auto'),
  hidden: z.boolean().optional(),
});

const dc = defaultContent();
const dd = defaultDesign();
const ds = defaultSetup();

const ContentSchema = z.object({
  examName: z.string().default(''),
  studentName: z.string().default(''),
  badgeText: z.string().default(dc.badgeText),
  badgeColor: hex.default(dc.badgeColor),
  showPulseDot: z.boolean().default(true),
  titleMain: z.string().default(dc.titleMain),
  titleGradient: z.string().default(dc.titleGradient),
  subtitle: z.string().default(''),
  kpiMode: z.enum(['auto', 'manual']).default('auto'),
  kpis: z.array(z.object({ id: z.string(), label: z.string(), value: z.string() })).max(4).default(dc.kpis),
  quoteLine1: z.string().default(dc.quoteLine1),
  quoteLine2: z.string().default(dc.quoteLine2),
  ruleTitle: z.string().default(dc.ruleTitle),
  ruleText: z.string().default(dc.ruleText),
  ruleHighlight: z.string().default(dc.ruleHighlight),
  milestones: z.array(z.object({ id: z.string(), label: z.string(), done: z.boolean() })).default(dc.milestones),
  sections: z
    .object({
      header: z.boolean(),
      kpi: z.boolean(),
      footer: z.boolean(),
      milestones: z.boolean(),
      rail: z.boolean(),
    })
    .default(dc.sections),
});

const ThemeColorsSchema = z.object({
  canvasBg: hex,
  cardBg: hex,
  border: hex,
  text: hex,
  muted: hex,
  gradientFrom: hex,
  gradientTo: hex,
  accent: hex,
});

const DesignSchema = z.object({
  template: z.enum(['timeline', 'editorial', 'minimal']).default('timeline'),
  themeId: z.string().default(dd.themeId),
  custom: ThemeColorsSchema.default(dd.custom),
  bodyFont: z.string().default(dd.bodyFont),
  displayFont: z.string().default(dd.displayFont),
  monoFont: z.string().default(dd.monoFont),
  columns: z.union([z.literal(1), z.literal(2)]).default(1),
  density: z.enum(['compact', 'balanced', 'spacious']).default('balanced'),
  autoFit: z.boolean().default(true),
  timeFormat: z.enum(['12h', '24h']).default('12h'),
  cardStyle: z.enum(['tinted', 'outline', 'solid']).default('tinted'),
  radius: z.number().min(0).max(20).default(12),
  showDotGrid: z.boolean().default(true),
  showColorWash: z.boolean().default(true),
  logo: z
    .object({
      show: z.boolean(),
      size: z.number().min(80).max(128),
      position: z.enum(['top-right', 'top-left', 'top-center']),
    })
    .default(dd.logo),
});

const SetupSchema = z.object({
  examName: z.string().default(''),
  studentName: z.string().default(''),
  startTime: z.string().default(''),
  endTime: z.string().default(''),
  subjects: z.array(z.string()).default([]),
  blockLength: z.union([z.literal(60), z.literal(90), z.literal(120)]).default(120),
  breakStyle: z.enum(['light', 'balanced', 'frequent']).default('balanced'),
  seed: z.number().int().default(0),
});

export const ProjectSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().default('Untitled'),
  updatedAt: z.number().default(0),
  slots: z.array(SlotSchema).max(80),
  content: ContentSchema,
  design: DesignSchema,
  setup: SetupSchema.default(ds),
  customized: z.boolean().default(false),
});

export const PersistedSchema = z.object({
  activeId: z.string(),
  projects: z.array(ProjectSchema).min(1),
});

export type Persisted = z.infer<typeof PersistedSchema>;

/**
 * Migrates any older payload to the current schema. Version 0 (pre-release) payloads had no
 * `schemaVersion`, no `setup` and no `badgeColor`; the zod defaults fill those in.
 */
export function migrateProject(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const p = { ...(raw as Record<string, unknown>) };
  if (p.schemaVersion === undefined || p.schemaVersion === 0) p.schemaVersion = 1;
  return p;
}

export function parseProject(raw: unknown): { ok: true; project: Project } | { ok: false; error: string } {
  const res = ProjectSchema.safeParse(migrateProject(raw));
  if (res.success) return { ok: true, project: res.data as Project };
  const first = res.error.issues[0];
  return { ok: false, error: first ? `${first.path.join('.') || 'file'}: ${first.message}` : 'Invalid project file' };
}

export function parsePersisted(raw: unknown): Persisted | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as { activeId?: unknown; projects?: unknown };
  const projects = Array.isArray(r.projects) ? r.projects.map(migrateProject) : r.projects;
  const res = PersistedSchema.safeParse({ ...r, projects });
  if (!res.success) return null;
  const data = res.data;
  if (!data.projects.some((p) => p.id === data.activeId)) data.activeId = data.projects[0].id;
  return data;
}

/* ------------------------------------------------------------------ */
/* JSON import / export                                                */
/* ------------------------------------------------------------------ */

export function projectToJson(p: Project): string {
  return JSON.stringify(p, null, 2);
}

export async function readProjectFile(file: File): Promise<{ ok: true; project: Project } | { ok: false; error: string }> {
  if (file.size > 2_000_000) return { ok: false, error: 'File is too large (max 2 MB).' };
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  const res = parseProject(data);
  if (!res.ok) return { ok: false, error: `Not a Timetable Studio project — ${res.error}` };
  return { ok: true, project: { ...res.project, id: uid('proj'), updatedAt: Date.now() } };
}

/* ------------------------------------------------------------------ */
/* Share links (state compressed into the URL hash)                    */
/* ------------------------------------------------------------------ */

export function encodeShareHash(p: Project): string {
  const { id: _id, updatedAt: _u, ...rest } = p;
  void _id;
  void _u;
  return `#share=${LZString.compressToEncodedURIComponent(JSON.stringify(rest))}`;
}

export function decodeShareHash(hash: string): Project | null {
  const m = /[#&](?:share|data)=([^&]+)/.exec(hash);
  if (!m) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(m[1]);
    if (!json) return null;
    const data = { ...JSON.parse(json), id: uid('proj'), updatedAt: Date.now() };
    const res = parseProject(data);
    return res.ok ? res.project : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Small prefs (not part of the project / undo history)                */
/* ------------------------------------------------------------------ */

export function readPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(`timetable-studio:pref:${key}`);
    return v === null ? fallback : (JSON.parse(v) as T);
  } catch {
    return fallback;
  }
}

export function writePref<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`timetable-studio:pref:${key}`, JSON.stringify(value));
  } catch {
    /* storage may be full or blocked (private mode) — prefs are optional */
  }
}

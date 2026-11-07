import type { DesignSettings, PosterContent, Project, SetupInput, Slot } from './types';
import { BREAK_GRAY, THEMES } from './presets';
import { BRAND } from './brand';

export function uid(prefix = 'id'): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rnd}`;
}

type SlotSeed = Omit<Slot, 'id' | 'column'> & { column?: Slot['column'] };

const study = (
  start: string,
  end: string,
  category: string,
  title: string,
  details: string,
  color: string,
  icon: string,
): SlotSeed => ({ kind: 'study', start, end, category, title, details, color, icon });

const brk = (start: string, end: string, breakTag: string, title: string, details: string, icon: string): SlotSeed => ({
  kind: 'break',
  start,
  end,
  breakTag,
  title,
  details,
  color: BREAK_GRAY,
  icon,
});

/** The default "Karo-Ya-Maro" 18-slot master schedule (10 study + 8 breaks). */
export const DEFAULT_SLOT_SEEDS: SlotSeed[] = [
  study('06:30', '08:30', 'EARLY BIRD', 'Quantitative Aptitude', 'High-focus problem sets, DI, Arithmetic', '#2563EB', 'Sigma'),
  brk('08:30', '09:30', 'BREAK', 'Breakfast & Recharge', 'Hydrate, light walk, fresh air', 'Coffee'),
  study('09:30', '11:30', 'MORNING CORE', 'Hindi Language', 'Grammar rules, passage reading, vocab', '#DB2777', 'BookOpen'),
  brk('11:30', '11:40', 'REST', 'Screen/Book Break', 'Eye rest & stretching', 'Pause'),
  study('11:40', '13:40', 'TECHNICAL CORE', 'Professional Knowledge (PK)', 'Core domain, concepts', '#059669', 'Laptop'),
  brk('13:40', '13:50', 'RESET', 'Quick Reset', '', 'Pause'),
  study('13:50', '14:30', 'FINANCE 1', 'Financial Awareness (FA)', 'Banking terms, schemes', '#EA580C', 'TrendingUp'),
  brk('14:30', '14:45', 'LUNCH', 'Power Snack', '', 'Utensils'),
  study('14:45', '15:45', 'FINANCE 2', 'Financial Awareness (FA)', 'Revision, quiz practice', '#EA580C', 'ChartColumn'),
  brk('15:45', '16:00', 'RESET', 'Unwind', '', 'Pause'),
  study('16:00', '17:30', 'TECH & LOGIC', 'Computer Awareness', 'Networking, DBMS, OS, MCQs', '#059669', 'Monitor'),
  brk('17:30', '17:40', 'REST', 'Mind Refresh', '', 'Pause'),
  study('17:40', '18:40', 'LANGUAGE SKILL', 'English Language', 'Editorial, grammar, mock drills', '#DB2777', 'PenLine'),
  brk('18:40', '19:00', 'BREAK', 'Evening Reset', '', 'Footprints'),
  study('19:00', '19:30', 'RAPID FIRE', 'GK / GS', 'Daily current affairs capsules', '#EA580C', 'Newspaper'),
  brk('19:30', '19:40', 'PREP', 'Workspace Prep', '', 'Pause'),
  study('19:40', '21:00', 'BRAIN SPRINT', 'Reasoning Ability', 'Puzzles, seating arrangement', '#2563EB', 'Brain'),
  study('21:00', '21:30', 'WRAP-UP', 'Teaching Methodology', 'Pedagogy concepts, revision', '#7C3AED', 'GraduationCap'),
];

/** Subjects of the default master schedule, used when the generator gets no subjects. */
export const DEFAULT_SUBJECTS = [
  'Quantitative Aptitude',
  'Hindi Language',
  'Professional Knowledge (PK)',
  'Financial Awareness (FA)',
  'Computer Awareness',
  'English Language',
  'GK / GS',
  'Reasoning Ability',
  'Teaching Methodology',
];

/** `stable` gives deterministic ids so the statically pre-rendered HTML matches the first client render. */
export function defaultSlots(stable = false): Slot[] {
  return DEFAULT_SLOT_SEEDS.map((s, i) => ({ ...s, column: s.column ?? 'auto', id: stable ? `slot_d${i + 1}` : uid('slot') }));
}

export function defaultContent(): PosterContent {
  return {
    examName: '',
    studentName: '',
    badgeText: 'KARO YA MARO',
    badgeColor: '#2563EB',
    showPulseDot: true,
    titleMain: 'DAILY MASTER',
    titleGradient: 'STUDY SCHEDULE',
    subtitle: '10 focused blocks · 8 smart breaks · one locked-in day',
    kpiMode: 'auto',
    kpis: [
      { id: 'k1', label: 'Total Study', value: '12 HRS 30 MIN' },
      { id: 'k2', label: 'Core Blocks', value: '10' },
      { id: 'k3', label: 'Active Window', value: '06:30 AM – 09:30 PM' },
      { id: 'k4', label: 'Focus Rule', value: 'करो या मरो' },
    ],
    quoteLine1: 'SUCCESS ISN’T ALWAYS ABOUT GREATNESS.',
    quoteLine2: 'IT’S ABOUT CONSISTENCY.',
    ruleTitle: '“करो या मरो” Rule:',
    ruleText: 'If you sit at the desk, eliminate all notifications.',
    ruleHighlight: 'Fully locked-in!',
    milestones: [
      { id: 'm1', label: 'DAY 1', done: true },
      { id: 'm2', label: 'DAY 15', done: false },
      { id: 'm3', label: 'DAY 30', done: false },
    ],
    sections: { header: true, kpi: false, footer: true, milestones: false, rail: true },
  };
}

export function defaultDesign(): DesignSettings {
  const t = THEMES[0];
  return {
    template: 'timeline',
    themeId: 'clean-paper',
    custom: {
      canvasBg: t.canvasBg,
      cardBg: t.cardBg,
      border: t.border,
      text: t.text,
      muted: t.muted,
      gradientFrom: t.gradientFrom,
      gradientTo: t.gradientTo,
      accent: t.accent,
    },
    bodyFont: 'jakarta',
    displayFont: 'anton',
    monoFont: 'jetbrains',
    columns: 1,
    density: 'balanced',
    autoFit: true,
    timeFormat: '12h',
    cardStyle: 'tinted',
    radius: 12,
    showDotGrid: true,
    showColorWash: true,
    logo: { show: BRAND.posterLogo.enabled, size: BRAND.posterLogo.sizePx, position: BRAND.posterLogo.position },
  };
}

export function defaultSetup(): SetupInput {
  return {
    examName: '',
    studentName: '',
    startTime: '',
    endTime: '',
    subjects: [],
    blockLength: 120,
    breakStyle: 'balanced',
    seed: 0,
  };
}

export function createDefaultProject(name = 'Karo-Ya-Maro Master', stable = false): Project {
  return {
    schemaVersion: 1,
    id: stable ? 'proj_default' : uid('proj'),
    name,
    updatedAt: stable ? 0 : Date.now(),
    slots: defaultSlots(stable),
    content: defaultContent(),
    design: defaultDesign(),
    setup: defaultSetup(),
    customized: false,
  };
}

export function createBlankProject(name = 'Blank Timetable'): Project {
  const p = createDefaultProject(name);
  p.slots = [];
  p.content = {
    ...p.content,
    badgeText: '',
    subtitle: '',
    milestones: [],
  };
  return p;
}

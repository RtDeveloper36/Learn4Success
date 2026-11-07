import type { ThemeColors } from './types';

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */

export const PALETTE = [
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Magenta', hex: '#DB2777' },
  { name: 'Rose', hex: '#E11D48' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Yellow', hex: '#CA8A04' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Cyan', hex: '#0891B2' },
] as const;

/** Order used by the generator when assigning a colour to each new subject. */
export const SUBJECT_COLOR_ROTATION = [
  '#2563EB',
  '#DB2777',
  '#059669',
  '#EA580C',
  '#7C3AED',
  '#0D9488',
  '#E11D48',
  '#4F46E5',
  '#D97706',
  '#0891B2',
  '#16A34A',
  '#CA8A04',
];

export const BREAK_GRAY = '#94A3B8';

/* ------------------------------------------------------------------ */
/* Poster themes                                                       */
/* ------------------------------------------------------------------ */

export interface PosterTheme extends ThemeColors {
  id: string;
  name: string;
  dark: boolean;
}

export const THEMES: PosterTheme[] = [
  {
    id: 'clean-paper',
    name: 'Clean Paper',
    dark: false,
    canvasBg: '#FBFAF7',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B',
    gradientFrom: '#2563EB',
    gradientTo: '#DB2777',
    accent: '#E11D48',
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    dark: true,
    canvasBg: '#0F172A',
    cardBg: '#1E293B',
    border: '#334155',
    text: '#F1F5F9',
    muted: '#94A3B8',
    gradientFrom: '#60A5FA',
    gradientTo: '#C084FC',
    accent: '#F472B6',
  },
  {
    id: 'oled-black',
    name: 'OLED Pure Black',
    dark: true,
    canvasBg: '#000000',
    cardBg: '#0B0B0C',
    border: '#27272A',
    text: '#FAFAFA',
    muted: '#A1A1AA',
    gradientFrom: '#22D3EE',
    gradientTo: '#A78BFA',
    accent: '#F43F5E',
  },
  {
    id: 'cyberpunk-navy',
    name: 'Cyberpunk Navy',
    dark: true,
    canvasBg: '#0A0F2C',
    cardBg: '#121A45',
    border: '#2A3576',
    text: '#E0E7FF',
    muted: '#8B95D6',
    gradientFrom: '#22D3EE',
    gradientTo: '#F0ABFC',
    accent: '#FACC15',
  },
  {
    id: 'emerald-focus',
    name: 'Emerald Focus',
    dark: false,
    canvasBg: '#F3FAF6',
    cardBg: '#FFFFFF',
    border: '#CDE9DA',
    text: '#052E1C',
    muted: '#4B6B5C',
    gradientFrom: '#059669',
    gradientTo: '#0891B2',
    accent: '#059669',
  },
  {
    id: 'royal-plum',
    name: 'Royal Plum',
    dark: true,
    canvasBg: '#1C0F26',
    cardBg: '#2A1838',
    border: '#4A2E5E',
    text: '#F7EDFF',
    muted: '#BBA3CC',
    gradientFrom: '#F0ABFC',
    gradientTo: '#FDE68A',
    accent: '#F472B6',
  },
];

export function getTheme(themeId: string, custom: ThemeColors): ThemeColors & { dark: boolean } {
  if (themeId === 'custom') return { ...custom, dark: isDarkColor(custom.canvasBg) };
  const t = THEMES.find((x) => x.id === themeId) ?? THEMES[0];
  return t;
}

/* ------------------------------------------------------------------ */
/* Colour utilities                                                    */
/* ------------------------------------------------------------------ */

export function normalizeHex(input: string): string | null {
  let s = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(s)) return null;
  return `#${s.toUpperCase()}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = normalizeHex(hex) ?? '#000000';
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)];
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Mixes `hex` towards `base` by `t` (0..1). */
export function mix(hex: string, base: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(base);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `#${[c(r1, r2), c(g1, g2), c(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function isDarkColor(hex: string): boolean {
  return luminance(hex) < 0.35;
}

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

export const BODY_FONTS = [
  { id: 'jakarta', name: 'Plus Jakarta Sans', css: 'var(--font-jakarta)' },
  { id: 'inter', name: 'Inter', css: 'var(--font-inter)' },
  { id: 'poppins', name: 'Poppins', css: 'var(--font-poppins)' },
  { id: 'grotesk', name: 'Space Grotesk', css: 'var(--font-grotesk)' },
  { id: 'jetbrains', name: 'JetBrains Mono', css: 'var(--font-jetbrains)' },
];

export const DISPLAY_FONTS = [
  { id: 'anton', name: 'Anton', css: 'var(--font-anton)' },
  { id: 'oswald', name: 'Oswald', css: 'var(--font-oswald)' },
  { id: 'body', name: 'Same as body', css: '' },
];

export const MONO_FONTS = [
  { id: 'jetbrains', name: 'JetBrains Mono', css: 'var(--font-jetbrains)' },
  { id: 'grotesk', name: 'Space Grotesk', css: 'var(--font-grotesk)' },
];

/** Every poster font stack ends with Devanagari so Hindi always renders (also inside exports). */
export function fontStack(primary: string): string {
  return `${primary}, var(--font-devanagari), system-ui, sans-serif`;
}

/* ------------------------------------------------------------------ */
/* Exam presets                                                        */
/* ------------------------------------------------------------------ */

export interface ExamPreset {
  id: string;
  label: string;
  /** extra lowercase tokens for fuzzy matching on the exam name */
  match: string[];
  subjects: string[];
}

export interface ExamPresetGroup {
  group: string;
  presets: ExamPreset[];
}

const BANK = ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'Banking & Financial Awareness', 'Computer Awareness'];
const SSC = ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'General Awareness', 'General Science'];
const UPSC = ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Current Affairs', 'CSAT', 'Answer Writing'];

export const EXAM_PRESETS: ExamPresetGroup[] = [
  {
    group: 'Banking & IBPS',
    presets: [
      { id: 'ibps-po', label: 'IBPS PO', match: ['ibps po', 'ibps clerk', 'po clerk'], subjects: BANK },
      { id: 'ibps-clerk', label: 'IBPS Clerk', match: ['ibps clerk'], subjects: BANK },
      { id: 'ibps-rrb', label: 'IBPS RRB PO/Clerk', match: ['rrb po', 'rrb clerk', 'ibps rrb'], subjects: BANK },
      {
        id: 'ibps-so-it',
        label: 'IBPS SO IT Officer',
        match: ['ibps so', 'it officer', 'so it'],
        subjects: ['Professional Knowledge (PK)', 'Reasoning Ability', 'English Language', 'Quantitative Aptitude', 'Computer Awareness'],
      },
      {
        id: 'ibps-rrb-so',
        label: 'IBPS RRB SO',
        match: ['rrb so'],
        subjects: ['Professional Knowledge (PK)', 'Reasoning Ability', 'Quantitative Aptitude', 'English Language', 'Banking & Financial Awareness'],
      },
      { id: 'sbi-po', label: 'SBI PO', match: ['sbi po', 'sbi'], subjects: BANK },
      {
        id: 'rbi-b',
        label: 'RBI Grade B',
        match: ['rbi', 'grade b'],
        subjects: ['Quantitative Aptitude', 'Reasoning Ability', 'English Language', 'Banking & Financial Awareness', 'Economy', 'Current Affairs'],
      },
    ],
  },
  {
    group: 'SSC & Railways',
    presets: [
      { id: 'ssc-cgl', label: 'SSC CGL', match: ['cgl'], subjects: SSC },
      { id: 'ssc-chsl', label: 'SSC CHSL', match: ['chsl'], subjects: SSC },
      { id: 'ssc-mts', label: 'SSC MTS', match: ['mts'], subjects: SSC },
      { id: 'rrb-ntpc', label: 'RRB NTPC', match: ['ntpc'], subjects: SSC },
      { id: 'rrb-group-d', label: 'RRB Group D', match: ['group d'], subjects: SSC },
      {
        id: 'upsssc-pet',
        label: 'UPSSSC PET',
        match: ['pet', 'upsssc'],
        subjects: ['Reasoning Ability', 'Elementary Maths', 'History', 'Geography', 'Polity', 'Economy', 'General Science', 'Hindi Language', 'English Language', 'Current Affairs'],
      },
    ],
  },
  {
    group: 'UPSC / State PCS',
    presets: [
      { id: 'upsc-cse', label: 'UPSC CSE', match: ['upsc', 'cse', 'ias', 'civil services'], subjects: UPSC },
      { id: 'uppsc', label: 'UPPSC', match: ['uppsc', 'up pcs'], subjects: [...UPSC.slice(0, 6), 'State GK', 'CSAT'] },
      { id: 'bpsc', label: 'BPSC', match: ['bpsc', 'bihar'], subjects: [...UPSC.slice(0, 6), 'State GK', 'Answer Writing'] },
    ],
  },
  {
    group: 'GATE & Engineering',
    presets: [
      {
        id: 'gate-cs',
        label: 'GATE CS',
        match: ['gate'],
        subjects: ['DSA', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks', 'TOC', 'COA', 'Discrete Maths', 'Aptitude'],
      },
    ],
  },
  {
    group: 'NEET & JEE',
    presets: [
      { id: 'neet', label: 'NEET', match: ['neet'], subjects: ['Physics', 'Chemistry', 'Biology'] },
      { id: 'jee', label: 'JEE', match: ['jee', 'iit'], subjects: ['Physics', 'Chemistry', 'Maths'] },
    ],
  },
  {
    group: 'Teaching',
    presets: [
      {
        id: 'ctet',
        label: 'CTET',
        match: ['ctet', 'tet'],
        subjects: ['Child Development & Pedagogy', 'Maths', 'EVS', 'Hindi Language', 'English Language'],
      },
      {
        id: 'up-super-tet',
        label: 'UP Super TET',
        match: ['super tet'],
        subjects: ['Child Development & Pedagogy', 'Maths', 'Hindi Language', 'English Language', 'EVS', 'Current Affairs'],
      },
      {
        id: 'ugc-net',
        label: 'UGC NET',
        match: ['ugc', 'net'],
        subjects: ['Teaching & Research Aptitude', 'Subject Paper II', 'Current Affairs', 'Mock Test'],
      },
    ],
  },
  {
    group: 'MBA',
    presets: [{ id: 'cat', label: 'CAT', match: ['cat', 'mba'], subjects: ['QA', 'DILR', 'VARC'] }],
  },
  {
    group: 'Coding & Placement',
    presets: [
      {
        id: 'placement',
        label: 'Coding & Placement',
        match: ['placement', 'coding', 'interview', 'sde'],
        subjects: ['DSA', 'System Design', 'CS Fundamentals', 'Aptitude', 'Projects'],
      },
    ],
  },
];

export const ALL_PRESETS = EXAM_PRESETS.flatMap((g) => g.presets);

/** Exact label match, then token/fuzzy match against the exam name. */
export function findPreset(examName: string): ExamPreset | null {
  const q = examName.trim().toLowerCase();
  if (!q) return null;
  const exact = ALL_PRESETS.find((p) => p.label.toLowerCase() === q);
  if (exact) return exact;
  let best: { p: ExamPreset; score: number } | null = null;
  for (const p of ALL_PRESETS) {
    for (const m of [p.label.toLowerCase(), ...p.match]) {
      let score = 0;
      if (q.includes(m)) score = m.length * 2;
      else if (m.includes(q) && q.length >= 3) score = q.length;
      else {
        const qt = q.split(/[^a-z0-9]+/).filter(Boolean);
        const mt = m.split(/[^a-z0-9]+/).filter(Boolean);
        const hits = qt.filter((t) => t.length >= 2 && mt.includes(t)).length;
        score = hits * 3;
      }
      if (score > 0 && (!best || score > best.score)) best = { p, score };
    }
  }
  return best && best.score >= 3 ? best.p : null;
}

/* ------------------------------------------------------------------ */
/* Subject knowledge maps                                              */
/* ------------------------------------------------------------------ */

export interface SubjectInfo {
  icon: string;
  details: string;
  /** 2 = heavy/analytical (morning), 1 = normal, 0.5 = light (30-min rapid fire) */
  weight: number;
  category?: string;
}

/** Ordered: first matching keyword wins. */
const SUBJECT_RULES: { keys: string[]; info: SubjectInfo }[] = [
  { keys: ['pedagogy', 'teaching', 'child development', 'methodology'], info: { icon: 'GraduationCap', details: 'Pedagogy concepts, learning theories, revision', weight: 1 } },
  { keys: ['professional knowledge', '(pk)', ' pk'], info: { icon: 'Laptop', details: 'Core domain, concepts', weight: 2, category: 'TECHNICAL CORE' } },
  { keys: ['quant', 'qa', 'arithmetic', 'aptitude'], info: { icon: 'Sigma', details: 'High-focus problem sets, DI, Arithmetic', weight: 2 } },
  { keys: ['discrete'], info: { icon: 'Sigma', details: 'Sets, graphs, combinatorics, logic', weight: 2 } },
  { keys: ['math'], info: { icon: 'Sigma', details: 'Concept drills, problem sets, formulas', weight: 2 } },
  { keys: ['dilr', 'data interpretation'], info: { icon: 'ChartColumn', details: 'Sets, arrangements, caselets', weight: 2, category: 'BRAIN SPRINT' } },
  { keys: ['reason', 'logic', 'puzzle'], info: { icon: 'Brain', details: 'Puzzles, seating arrangement', weight: 2, category: 'BRAIN SPRINT' } },
  { keys: ['varc', 'english', 'verbal'], info: { icon: 'PenLine', details: 'Editorial, grammar, mock drills', weight: 1, category: 'LANGUAGE SKILL' } },
  { keys: ['hindi'], info: { icon: 'Languages', details: 'Grammar rules, passage reading, vocab', weight: 1, category: 'LANGUAGE SKILL' } },
  { keys: ['current affairs', 'current', ' gk', ' gs', '/gk', '/ gs', 'general awareness', 'state gk', 'static'], info: { icon: 'Newspaper', details: 'Daily current affairs capsules', weight: 0.5, category: 'RAPID FIRE' } },
  { keys: ['bank', 'finance', 'financial'], info: { icon: 'Landmark', details: 'Banking terms, schemes, RBI updates', weight: 1 } },
  { keys: ['polity', 'constitution'], info: { icon: 'Scale', details: 'Constitution, governance, judiciary', weight: 2 } },
  { keys: ['history'], info: { icon: 'Scroll', details: 'Ancient, medieval, modern, art & culture', weight: 1 } },
  { keys: ['geograph'], info: { icon: 'Globe', details: 'Physical, Indian & world geography, maps', weight: 1 } },
  { keys: ['econom'], info: { icon: 'IndianRupee', details: 'Macro basics, budget, survey, schemes', weight: 2 } },
  { keys: ['environment', 'ecology', 'evs'], info: { icon: 'Leaf', details: 'Ecology, biodiversity, climate', weight: 1 } },
  { keys: ['csat'], info: { icon: 'Calculator', details: 'Comprehension, numeracy, logic', weight: 1 } },
  { keys: ['answer writing', 'essay'], info: { icon: 'NotebookPen', details: 'Timed answers, structure, review', weight: 1 } },
  { keys: ['physics'], info: { icon: 'Atom', details: 'Mechanics, numericals, derivations', weight: 2 } },
  { keys: ['chemistry'], info: { icon: 'FlaskConical', details: 'Physical, organic, inorganic', weight: 2 } },
  { keys: ['biology', 'botany', 'zoology'], info: { icon: 'Dna', details: 'NCERT lines, diagrams, MCQs', weight: 1 } },
  { keys: ['science'], info: { icon: 'Microscope', details: 'Physics, chemistry, biology basics', weight: 1 } },
  { keys: ['system design'], info: { icon: 'Workflow', details: 'Scalability, trade-offs, case studies', weight: 2 } },
  { keys: ['dsa', 'data structure', 'algorithm', 'coding', 'programming'], info: { icon: 'Code', details: 'Problems, patterns, complexity', weight: 2 } },
  { keys: ['operating system', ' os'], info: { icon: 'Cpu', details: 'Processes, scheduling, memory, deadlocks', weight: 2 } },
  { keys: ['dbms', 'database', 'sql'], info: { icon: 'Database', details: 'ER model, SQL, normalisation, transactions', weight: 2 } },
  { keys: ['network'], info: { icon: 'Network', details: 'OSI/TCP-IP, routing, protocols', weight: 2 } },
  { keys: ['toc', 'theory of computation'], info: { icon: 'Binary', details: 'Automata, grammars, decidability', weight: 2 } },
  { keys: ['coa', 'architecture'], info: { icon: 'Cpu', details: 'Pipelining, cache, memory hierarchy', weight: 2 } },
  { keys: ['computer awareness', 'computer'], info: { icon: 'Monitor', details: 'Networking, DBMS, OS, MCQs', weight: 1, category: 'TECH & LOGIC' } },
  { keys: ['cs fundamentals', 'fundamentals'], info: { icon: 'Server', details: 'OS, DBMS, networks, OOP', weight: 1 } },
  { keys: ['project'], info: { icon: 'Rocket', details: 'Build, document, deploy', weight: 1 } },
  { keys: ['research'], info: { icon: 'Microscope', details: 'Research aptitude, methods, ICT', weight: 1 } },
  { keys: ['mock', 'test', 'pyq'], info: { icon: 'Timer', details: 'Timed full mock, analysis', weight: 1 } },
  { keys: ['revision', 'recap'], info: { icon: 'RotateCcw', details: 'Spaced revision, error log', weight: 1 } },
];

export function subjectInfo(name: string): SubjectInfo {
  const n = ` ${name.toLowerCase()}`;
  for (const r of SUBJECT_RULES) {
    if (r.keys.some((k) => n.includes(k))) return r.info;
  }
  return { icon: 'BookOpen', details: 'Concepts, notes, practice questions', weight: 1 };
}

export function isFinanceSubject(name: string): boolean {
  return /bank|financ/i.test(name);
}

/* ------------------------------------------------------------------ */
/* Breaks                                                              */
/* ------------------------------------------------------------------ */

export const BREAK_TAGS = ['BREAK', 'REST', 'RESET', 'LUNCH', 'PREP'];

/** Rotation for the short breaks inserted between study blocks. */
export const SHORT_BREAKS = [
  { tag: 'REST', icon: 'Pause', title: 'Screen/Book Break', details: 'Eye rest & stretching' },
  { tag: 'RESET', icon: 'RotateCcw', title: 'Quick Reset', details: '' },
  { tag: 'REST', icon: 'Pause', title: 'Mind Refresh', details: '' },
  { tag: 'PREP', icon: 'ClipboardList', title: 'Workspace Prep', details: '' },
  { tag: 'RESET', icon: 'Pause', title: 'Unwind', details: '' },
  { tag: 'BREAK', icon: 'Footprints', title: 'Stretch & Walk', details: 'Hydrate' },
];

export const CATEGORY_SUGGESTIONS = [
  'EARLY BIRD',
  'MORNING CORE',
  'TECHNICAL CORE',
  'AFTERNOON FOCUS',
  'POWER HOURS',
  'FINANCE 1',
  'TECH & LOGIC',
  'LANGUAGE SKILL',
  'EVENING SPRINT',
  'RAPID FIRE',
  'BRAIN SPRINT',
  'WRAP-UP',
];

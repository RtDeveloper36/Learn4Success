export type SlotKind = 'study' | 'break';
export type BreakTag = 'BREAK' | 'REST' | 'RESET' | 'LUNCH' | 'PREP' | (string & {});

export interface Slot {
  id: string;
  kind: SlotKind;
  /** "06:30" — 24h internal format, always */
  start: string;
  /** "08:30" */
  end: string;
  /** manual label, e.g. "2 HRS+" */
  durationOverride?: string;
  /** study only: "EARLY BIRD" */
  category?: string;
  /** "Quantitative Aptitude" | "Breakfast & Recharge" */
  title: string;
  /** sub-topics, or break note */
  details?: string;
  /** break only */
  breakTag?: BreakTag;
  /** HEX */
  color: string;
  /** lucide icon name, or null (hidden) */
  icon: string | null;
  column: 'auto' | 'left' | 'right';
  hidden?: boolean;
}

export interface Milestone {
  id: string;
  label: string;
  done: boolean;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
}

export interface PosterSections {
  header: boolean;
  kpi: boolean;
  footer: boolean;
  milestones: boolean;
  rail: boolean;
}

export interface PosterContent {
  examName: string;
  studentName: string;
  badgeText: string;
  badgeColor: string;
  showPulseDot: boolean;
  /** "DAILY MASTER" */
  titleMain: string;
  /** "STUDY SCHEDULE" */
  titleGradient: string;
  subtitle: string;
  kpiMode: 'auto' | 'manual';
  kpis: Kpi[];
  quoteLine1: string;
  quoteLine2: string;
  ruleTitle: string;
  ruleText: string;
  ruleHighlight: string;
  milestones: Milestone[];
  sections: PosterSections;
}

export interface ThemeColors {
  canvasBg: string;
  cardBg: string;
  border: string;
  text: string;
  muted: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
}

export type TemplateId = 'timeline' | 'editorial' | 'minimal';
export type Density = 'compact' | 'balanced' | 'spacious';
export type CardStyle = 'tinted' | 'outline' | 'solid';

export interface DesignSettings {
  template: TemplateId;
  themeId: string;
  custom: ThemeColors;
  bodyFont: string;
  displayFont: string;
  monoFont: string;
  columns: 1 | 2;
  density: Density;
  autoFit: boolean;
  timeFormat: '12h' | '24h';
  cardStyle: CardStyle;
  /** 0–20 */
  radius: number;
  showDotGrid: boolean;
  showColorWash: boolean;
  /** library seal on the poster (ignored while BRAND.posterLogo.locked is true) */
  logo: { show: boolean; size: number; position: 'top-right' | 'top-left' | 'top-center' };
}

export type BlockLength = 60 | 90 | 120;
export type BreakStyle = 'light' | 'balanced' | 'frequent';

/** Inputs of the Setup wizard. Every field is optional in spirit: blank strings mean "use defaults". */
export interface SetupInput {
  examName: string;
  studentName: string;
  startTime: string;
  endTime: string;
  subjects: string[];
  blockLength: BlockLength;
  breakStyle: BreakStyle;
  seed: number;
}

export interface Project {
  schemaVersion: 1;
  id: string;
  name: string;
  updatedAt: number;
  slots: Slot[];
  content: PosterContent;
  design: DesignSettings;
  setup: SetupInput;
  /** true once the user edits the schedule by hand (used to confirm before regenerating) */
  customized: boolean;
}

/** Result of the auto-fit measurement, shared by preview, export and print renders. */
export interface FitResult {
  /** density factor 0.60–1.25 applied to every poster size variable */
  k: number;
  /** final uniform scale applied only when k = 0.60 still overflows */
  scale: number;
  /** slot ids for the left & right column (2-column layout only) */
  split: [string[], string[]] | null;
  status: 'fits' | 'scaled' | 'overflow';
  /** natural content height in px at the chosen k */
  contentHeight: number;
}

export type Selection =
  | { type: 'slot'; id: string }
  | { type: 'header' }
  | { type: 'kpi' }
  | { type: 'footer' }
  | { type: 'milestones' }
  | null;

export type EditorTab = 'setup' | 'schedule' | 'headerFooter' | 'design' | 'export';

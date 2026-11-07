/**
 * Single source of truth for the library's branding.
 * To change the library name, logo or quotes, edit this file and replace the files in /public/brand/.
 */

import { withBase } from './base';

export type PosterLogoPosition = 'top-right' | 'top-left' | 'top-center';

export interface BrandConfig {
  name: string;
  shortName: string;
  tagline: string;
  /** primary logo: circular seal, transparent outside the circle */
  seal: string;
  /** original L4S logo (lime + white) — always shown on a dark background */
  logo: string;
  colors: { lime: string; limeDeep: string; ink: string; white: string };
  /** optional; when empty the field is hidden everywhere */
  address: string;
  /** optional; same rule */
  phone: string;
  posterLogo: {
    enabled: boolean;
    /** true = students cannot hide, move or resize the library logo (not even via JSON / share links) */
    locked: boolean;
    /** diameter in the 794px poster coordinate system (≈ 27.5mm on A4) */
    sizePx: number;
    position: PosterLogoPosition;
  };
  quotes: string[];
}

export const BRAND: BrandConfig = {
  name: 'Learn 4 Success',
  shortName: 'L4S',
  tagline: '24×7 Self-Study Library',
  seal: withBase('/brand/l4s-seal-badge.png'),
  logo: withBase('/brand/l4s-logo-color.png'),
  colors: { lime: '#9AFF01', limeDeep: '#5C9A00', ink: '#0A0A0A', white: '#FFFFFF' },
  address: '',
  phone: '',
  posterLogo: {
    enabled: true,
    locked: true,
    sizePx: 104,
    position: 'top-right',
  },
  quotes: [
    'A timetable turns ‘someday’ into today.',
    'Small hours, done daily, become big results.',
    'Discipline is choosing what you want most over what you want now.',
    'You don’t need more time. You need a plan for the time you have.',
    'Every slot you complete is a step closer to your selection.',
    'Consistency beats intensity. Show up, every single day.',
    'Your desk. Your plan. Your future.',
    'करो या मरो: जब बैठो, पूरी तरह पढ़ो।',
    'आज की मेहनत, कल की सफलता।',
    'समय की कद्र करो, सफलता तुम्हारी कद्र करेगी।',
    'जो रोज़ पढ़ता है, वही आगे बढ़ता है।',
    'Plan the day, or the day will plan you.',
  ],
};

/** Exams shown in the welcome-page marquee (chips open /studio/?exam=<name>). */
export const MARQUEE_EXAMS = [
  'SSC CGL',
  'IBPS PO',
  'SBI PO',
  'RRB NTPC',
  'UPSC CSE',
  'UPPSC',
  'CTET',
  'UP Super TET',
  'UPSSSC PET',
  'GATE CS',
  'NEET',
  'JEE',
  'CAT',
  'UGC NET',
];

/** Route of the editor. Use as-is with router.push / <Link>; wrap in withBase() for plain URLs. */
export const STUDIO_PATH = '/studio/';

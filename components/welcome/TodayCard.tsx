'use client';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useDocumentVisible, useNow } from './hooks';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function lineFor(h: number): string {
  if (h >= 5 && h < 12) return 'Good morning! The early hours are your power hours.';
  if (h >= 12 && h < 17) return 'Afternoon focus beats afternoon laziness.';
  if (h >= 17 && h < 22) return 'Evening sprint: finish what you started today.';
  return 'Rest well. Tomorrow’s plan starts tonight.';
}

/** One digit that flips (slides) when it changes. */
function Digit({ d, reduce }: { d: string; reduce: boolean }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden text-center align-top">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={d}
          className="absolute inset-0"
          initial={reduce ? { opacity: 0 } : { y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: '100%', opacity: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {d}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Live "Today" card: flipping clock, date, day-progress ring and a time-of-day nudge. */
export function TodayCard() {
  const reduce = useReducedMotion() ?? false;
  const visible = useDocumentVisible();
  const now = useNow(visible);

  const hh = now ? String(now.getHours()).padStart(2, '0') : '--';
  const mm = now ? String(now.getMinutes()).padStart(2, '0') : '--';
  const ss = now ? String(now.getSeconds()).padStart(2, '0') : '--';
  const minutes = now ? now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60 : 0;
  const frac = minutes / 1440;
  const left = Math.max(0, 1440 - Math.ceil(minutes));
  const date = now ? `${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}` : ' ';
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <section id="today" aria-label="Today" className="mx-auto w-full max-w-[1200px] scroll-mt-6 px-5">
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="l4s-glass mx-auto flex max-w-[760px] flex-col items-center gap-6 rounded-[28px] p-6 sm:flex-row sm:gap-8 sm:p-8"
      >
        <div className="relative grid size-[96px] shrink-0 place-items-center" role="img" aria-label={now ? `${Math.round(frac * 100)}% of today has passed` : 'Day progress'}>
          <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
            <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle cx="40" cy="40" r={R} fill="none" stroke="#9AFF01" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <span className="text-[18px] font-bold tabular-nums">{now ? `${Math.round(frac * 100)}%` : ''}</span>
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="text-[12px] font-semibold tracking-[0.18em] text-white/50 uppercase">Today · {date}</div>
          <div className="mt-1 font-mono-ui text-[44px] leading-none font-semibold tracking-[-0.02em] tabular-nums sm:text-[52px]" aria-live="off">
            {hh.split('').map((d, i) => (
              <Digit key={`h${i}`} d={d} reduce={reduce} />
            ))}
            <span className="mx-0.5 text-white/40">:</span>
            {mm.split('').map((d, i) => (
              <Digit key={`m${i}`} d={d} reduce={reduce} />
            ))}
            <span className="mx-0.5 text-white/40">:</span>
            {ss.split('').map((d, i) => (
              <Digit key={`s${i}`} d={d} reduce={reduce} />
            ))}
          </div>
          <p className="mt-3 text-[15px] text-white/80">{now ? lineFor(now.getHours()) : ' '}</p>
          <p className="mt-1 text-[14px] text-white/55">
            Hours left today:{' '}
            <strong className="font-semibold text-[#9AFF01]">{now ? `${Math.floor(left / 60)}h ${left % 60}m` : '—'}</strong>. Make every one count.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

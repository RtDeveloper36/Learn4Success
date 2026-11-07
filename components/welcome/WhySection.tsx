'use client';
import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { Compass, Repeat, Scale, TrendingUp } from 'lucide-react';

const CARDS = [
  { icon: Compass, title: 'Clarity', text: 'No more “what should I study now?” Every hour has a purpose.' },
  { icon: Repeat, title: 'Consistency', text: 'Same time, same desk, every day. That’s how habits and results are built.' },
  { icon: Scale, title: 'Balance', text: 'Every subject gets its fair share, and planned breaks keep your mind fresh.' },
  { icon: TrendingUp, title: 'Progress', text: 'Count your study hours and celebrate milestones: Day 1, Day 15, Day 30.' },
];

const STATS: { to: number; suffix: string; label: string }[] = [
  { to: 60, suffix: ' sec', label: 'to build your plan' },
  { to: 1, suffix: ' page', label: 'A4 print-ready' },
  { to: 24, suffix: '×7', label: 'library access' },
  { to: 100, suffix: '%', label: 'customizable' },
];

function CountUp({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      queueMicrotask(() => setV(to));
      return;
    }
    const c = animate(0, to, { duration: 1.4, ease: [0.2, 0.8, 0.2, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, to, reduce]);
  return (
    <span ref={ref} className="tabular-nums">
      {v}
      {suffix}
    </span>
  );
}

export function WhySection() {
  const reduce = useReducedMotion() ?? false;
  return (
    <section aria-labelledby="why-title" className="mx-auto w-full max-w-[1200px] px-5">
      <motion.div initial={{ opacity: 0, y: reduce ? 0 : 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }} className="mx-auto max-w-[760px] text-center">
        <h2 id="why-title" className="text-[30px] leading-[1.1] font-bold tracking-[-0.02em] text-balance sm:text-[40px]">
          Why every serious aspirant needs a timetable
        </h2>
        <p className="mt-5 text-[16px] leading-relaxed text-white/65 sm:text-[17px]">
          Preparation is a long journey, and most students don’t fall behind because they lack talent. They fall behind because their days have no structure. A clear timetable tells you exactly what to study, when to rest, and how far you’ve come. It removes daily confusion, protects your focus, and turns hard work into steady, visible progress.
        </p>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c, i) => (
          <motion.article
            key={c.title}
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: reduce ? 0 : i * 0.1 }}
            className="l4s-card group"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-[#9AFF01]/12 text-[#9AFF01] ring-1 ring-[#9AFF01]/25">
              <c.icon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.01em]">{c.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-white/65">{c.text}</p>
          </motion.article>
        ))}
      </div>

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/8 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-[#0A0A0A] px-4 py-6 text-center">
            <dt className="sr-only">{s.label}</dt>
            <dd>
              <div className="text-[30px] font-bold tracking-[-0.02em] text-[#9AFF01] sm:text-[36px]">
                <CountUp to={s.to} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-[13px] text-white/55">{s.label}</div>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

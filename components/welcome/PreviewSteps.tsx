'use client';
import { useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { createDefaultProject } from '@/lib/defaults';
import type { FitResult } from '@/lib/types';
import { Poster } from '@/components/poster/Poster';
import { FitProbe } from '@/components/poster/FitProbe';
import { useFinePointer } from './hooks';

const STEPS = [
  { title: 'Choose your exam', text: 'Or skip it, and we’ll build a balanced day for you.' },
  { title: 'Make it yours', text: 'Edit subjects, times, colors and icons.' },
  { title: 'Download & stick it', text: 'An A4 PDF for your desk at Learn 4 Success.' },
];

const W = 340;
const SCALE = W / 794;

/** A real (read-only) render of the default timetable, plus the 3 "How it works" steps. */
export function PreviewSteps() {
  const reduce = useReducedMotion() ?? false;
  const fine = useFinePointer();
  const project = useMemo(() => createDefaultProject('Preview', true), []);
  const [fit, setFit] = useState<FitResult>({ k: 0.85, scale: 1, split: null, status: 'fits', contentHeight: 0 });

  const card = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotY = useSpring(useTransform(mx, [-1, 1], [-9, 9]), { stiffness: 110, damping: 14 });
  const rotX = useSpring(useTransform(my, [-1, 1], [7, -7]), { stiffness: 110, damping: 14 });
  const onMove = (e: RPointerEvent) => {
    if (reduce || !fine || !card.current) return;
    const r = card.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const stepsRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: stepsRef, offset: ['start 85%', 'end 55%'] });
  const line = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  return (
    <section aria-labelledby="how-title" className="mx-auto grid w-full max-w-[1200px] items-center gap-14 px-5 md:grid-cols-[auto_1fr] md:gap-16 lg:gap-24">
      <FitProbe project={project} onFit={setFit} />
      <div className="flex justify-center [perspective:900px]" onPointerMove={onMove} onPointerLeave={() => { mx.set(0); my.set(0); }}>
        <motion.div
          ref={card}
          style={fine && !reduce ? { rotateX: rotX, rotateY: rotY } : undefined}
          animate={!fine && !reduce ? { y: [0, -8, 0] } : undefined}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative max-w-[calc(100vw-40px)] overflow-hidden rounded-[6px] bg-white shadow-[0_30px_80px_-20px_rgba(154,255,1,0.25),0_20px_60px_rgba(0,0,0,0.6)]"
          aria-label="Example A4 timetable"
          role="img"
        >
          <div style={{ width: W, height: 1123 * SCALE }} className="relative">
            <div className="pointer-events-none absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${SCALE})` }}>
              <Poster project={project} fit={fit} mode="thumb" />
            </div>
          </div>
        </motion.div>
      </div>

      <div>
        <h2 id="how-title" className="text-[30px] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[40px]">
          How it works
        </h2>
        <ol ref={stepsRef} className="relative mt-10 flex flex-col gap-10 pl-16">
          <span aria-hidden className="absolute top-5 bottom-5 left-[19px] w-[2px] rounded bg-white/10" />
          <motion.span aria-hidden className="absolute top-5 bottom-5 left-[19px] w-[2px] origin-top rounded bg-[#9AFF01] shadow-[0_0_10px_#9AFF01]" style={{ scaleY: reduce ? 1 : line }} />
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              className="relative"
              initial={{ opacity: 0, x: reduce ? 0 : 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: reduce ? 0 : i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <span className="absolute top-0 -left-16 grid size-10 place-items-center rounded-full bg-[#0A0A0A] text-[15px] font-bold text-[#9AFF01] ring-2 ring-[#9AFF01]">{i + 1}</span>
              <h3 className="text-[20px] font-semibold tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-white/65">{s.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

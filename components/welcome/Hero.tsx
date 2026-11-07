'use client';
import { useEffect, useMemo, useRef, type PointerEvent as RPointerEvent } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { ArrowRight, BookOpen, ChevronDown, Clock, GraduationCap, Lightbulb, PenLine, Target, RotateCcw } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { useDocumentVisible, useFinePointer, type SavedProfile, relTime } from './hooks';

const EASE = [0.2, 0.8, 0.2, 1] as const;
const LIME = BRAND.colors.lime;
const PARTICLE_ICONS = [BookOpen, Clock, PenLine, Target, Lightbulb, GraduationCap];

/** Deterministic particle layout (no Math.random → identical server & client render). */
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const r = (n: number) => ((Math.sin((i + 1) * 9301 + n * 49297) + 1) / 2) % 1;
  return {
    Icon: PARTICLE_ICONS[i % PARTICLE_ICONS.length],
    left: 4 + r(1) * 92,
    top: 8 + r(2) * 84,
    size: 18 + Math.round(r(3) * 16),
    opacity: 0.06 + r(4) * 0.04,
    duration: 14 + r(5) * 12,
    delay: r(6) * -20,
    depth: 0.4 + r(7) * 1.2,
  };
});

interface Props {
  saved: SavedProfile | null;
  sealRef: React.RefObject<HTMLDivElement | null>;
  leaving: boolean;
  onCreate: () => void;
  onContinue: () => void;
}

export function Hero({ saved, sealRef, leaving, onCreate, onContinue }: Props) {
  const reduce = useReducedMotion() ?? false;
  const fine = useFinePointer();
  const visible = useDocumentVisible();
  const heroRef = useRef<HTMLElement>(null);

  // Pointer → tilt (max 8°) and particle parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotY = useSpring(useTransform(mx, [-1, 1], [-8, 8]), { stiffness: 120, damping: 14 });
  const rotX = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 120, damping: 14 });
  const parX = useSpring(useTransform(mx, [-1, 1], [-14, 14]), { stiffness: 60, damping: 20 });
  const parY = useSpring(useTransform(my, [-1, 1], [-10, 10]), { stiffness: 60, damping: 20 });

  const onMove = (e: RPointerEvent) => {
    if (reduce || !fine || e.pointerType !== 'mouse') return;
    const r = heroRef.current!.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  // Phones: device orientation (only where the browser grants it without a prompt)
  useEffect(() => {
    if (reduce || fine) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      mx.set(Math.max(-1, Math.min(1, e.gamma / 30)));
      my.set(Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [reduce, fine, mx, my]);

  const words = useMemo(() => 'Plan your day. Own your preparation.'.split(' '), []);
  const anim = !reduce;
  const fade = (delay: number) =>
    anim
      ? { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE, delay } }
      : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, delay: 0.1 } };

  return (
    <section ref={heroRef} onPointerMove={onMove} className="relative isolate flex min-h-[100dvh] flex-col items-center overflow-hidden px-5 pt-[max(7vh,32px)] pb-24 text-center" aria-labelledby="hero-title">
      {/* Background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-1/2 h-[70vh] w-[min(1400px,140vw)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(154,255,1,0.16),transparent)]" />
        <div className="l4s-dots absolute inset-0" />
        <motion.div
          className="absolute -top-40 left-[-20%] h-[50vh] w-[140%] bg-[linear-gradient(100deg,transparent_10%,rgba(154,255,1,0.10)_35%,rgba(45,212,191,0.10)_55%,transparent_80%)] blur-3xl"
          animate={anim && visible ? { x: ['-6%', '6%'] } : undefined}
          transition={{ duration: 18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        {anim ? (
          <motion.div className="absolute inset-0" style={{ x: parX, y: parY }}>
            {PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                className="absolute text-white"
                style={{ left: `${p.left}%`, top: `${p.top}%`, opacity: p.opacity }}
                animate={visible ? { y: [0, -70 * p.depth], rotate: [0, i % 2 ? 12 : -12] } : undefined}
                transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <p.Icon size={p.size} strokeWidth={1.25} />
              </motion.span>
            ))}
          </motion.div>
        ) : null}
      </div>

      {/* Seal */}
      <div className="relative mt-2 [perspective:800px]">
        <motion.div style={anim && fine ? { rotateX: rotX, rotateY: rotY } : undefined} className="relative">
          {/* breathing glow */}
          <motion.div
            aria-hidden
            className="absolute inset-[-18%] -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(154,255,1,0.55),transparent)] blur-2xl"
            initial={{ opacity: 0 }}
            animate={anim ? { opacity: [0.35, 0.55, 0.35], scale: [1, 1.06, 1] } : { opacity: 0.4 }}
            transition={anim ? { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 } : { duration: 0.4 }}
          />
          {/* orbit ring: draws itself, then a slow dashed rotation with a satellite dot.
              Rotations run on HTML wrappers so they spin around the seal's centre. */}
          <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 size-[calc(100%+48px)] -translate-x-1/2 -translate-y-1/2">
            <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100">
              <motion.circle
                cx="50"
                cy="50"
                r="49.5"
                fill="none"
                stroke={LIME}
                strokeWidth="0.35"
                strokeLinecap="round"
                initial={anim ? { pathLength: 0, opacity: 0.9 } : { opacity: 0 }}
                animate={anim ? { pathLength: 1, opacity: 0 } : { opacity: 0 }}
                transition={{ pathLength: { duration: 1.3, ease: EASE, delay: 0.35 }, opacity: { duration: 0.6, delay: 1.7 } }}
              />
            </svg>
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={anim && visible ? { opacity: 1, rotate: 360 } : { opacity: reduce ? 0.6 : 1 }}
              transition={{ opacity: { duration: 0.6, delay: anim ? 1.6 : 0 }, rotate: { duration: 40, repeat: Infinity, ease: 'linear' } }}
            >
              <svg className="size-full overflow-visible" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="49.5" fill="none" stroke={LIME} strokeOpacity="0.55" strokeWidth="0.3" strokeDasharray="0.6 2.2" />
              </svg>
            </motion.div>
            {anim ? (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={visible ? { opacity: 1, rotate: [0, 360] } : { opacity: 1 }}
                transition={{ opacity: { duration: 0.6, delay: 1.7 }, rotate: { duration: 14, repeat: Infinity, ease: 'linear' } }}
              >
                <svg className="size-full overflow-visible" viewBox="0 0 100 100">
                  <circle cx="50" cy="0.5" r="2.6" fill={LIME} opacity="0.25" />
                  <circle cx="50" cy="0.5" r="1.1" fill={LIME} />
                </svg>
              </motion.div>
            ) : null}
          </div>
          {/* the exact seal */}
          <motion.div
            ref={sealRef}
            className="relative size-[168px] overflow-hidden rounded-full md:size-[220px] lg:size-[280px]"
            initial={anim ? { opacity: 0, scale: 0.85, filter: 'blur(16px)' } : { opacity: 0 }}
            animate={leaving ? { opacity: 0 } : anim ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 1 }}
            transition={leaving ? { duration: 0.01 } : anim ? { type: 'spring', stiffness: 70, damping: 14, mass: 0.9 } : { duration: 0.5 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- exact brand asset, fixed size, no optimisation in static export */}
            <img
              src={BRAND.seal}
              alt={`${BRAND.name} 24×7 Self-Study Library logo`}
              width={280}
              height={280}
              fetchPriority="high"
              decoding="async"
              draggable={false}
              className="size-full select-none"
            />
            {anim ? (
              <motion.span
                aria-hidden
                className="absolute inset-y-[-20%] left-0 w-1/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] mix-blend-overlay"
                initial={{ x: '-150%' }}
                animate={{ x: '420%' }}
                transition={{ duration: 1.1, ease: 'easeInOut', delay: 1.2 }}
              />
            ) : null}
          </motion.div>
        </motion.div>
      </div>

      {/* Copy */}
      <motion.p {...fade(0.5)} className="mt-12 text-[11px] font-semibold tracking-[0.22em] text-[#9AFF01] uppercase sm:text-[12px]">
        Learn 4 Success · 24×7 Self-Study Library
      </motion.p>
      <h1 id="hero-title" className="mt-4 max-w-[16ch] text-[34px] leading-[1.05] font-bold tracking-[-0.025em] text-balance sm:max-w-[20ch] md:text-[44px] lg:text-[52px]">
        {words.map((w, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={anim ? { opacity: 0, y: 18, filter: 'blur(6px)' } : { opacity: 0 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, ease: EASE, delay: anim ? 0.65 + i * 0.07 : 0.1 }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </h1>
      <motion.p {...fade(1.1)} className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-white/70 sm:text-[18px]">
        Build your personal study timetable in under a minute, then print it, stick it on your desk, and follow it every single day.
      </motion.p>

      <motion.div {...fade(1.3)} className="mt-9 flex w-full max-w-[560px] flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
        <button type="button" onClick={onCreate} className="l4s-cta group">
          <span className="l4s-cta-shimmer" aria-hidden />
          <span className="relative">Create My Timetable</span>
          <ArrowRight className="relative size-5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.25} aria-hidden />
        </button>
        {saved ? (
          <button type="button" onClick={onContinue} className="l4s-ghost">
            <RotateCcw className="size-4" strokeWidth={2} aria-hidden />
            <span className="flex flex-col items-start leading-tight">
              <span>Continue my timetable</span>
              <span className="text-[12px] font-normal text-white/55">
                {saved.name} · last edited {relTime(saved.updatedAt)}
              </span>
            </span>
          </button>
        ) : null}
      </motion.div>
      <motion.p {...fade(1.45)} className="mt-5 text-[13px] text-white/55">
        Free · No login · Print-ready A4 PDF · Works on any phone
      </motion.p>

      <motion.a
        href="#today"
        aria-label="Scroll to explore"
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/45 hover:text-white/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <span className="relative h-9 w-[22px] rounded-full border border-current">
          <motion.span
            className="absolute top-1.5 left-1/2 h-2 w-[3px] -translate-x-1/2 rounded-full bg-current"
            animate={anim ? { y: [0, 10, 0], opacity: [1, 0.2, 1] } : undefined}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </span>
        <ChevronDown className="size-4" strokeWidth={2} />
      </motion.a>
    </section>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { isHindi, useDocumentVisible } from './hooks';

const DURATION = 5000;

/** One quote at a time; cross-fade with blur every 5s, progress bar, dots/arrows/swipe, pause on hover/focus. */
export function QuoteStage() {
  const quotes = BRAND.quotes;
  const reduce = useReducedMotion() ?? false;
  const visible = useDocumentVisible();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const progress = useMotionValue(0);
  const swipe = useRef<number | null>(null);

  const go = (i: number) => {
    progress.set(0);
    setIndex(((i % quotes.length) + quotes.length) % quotes.length);
  };

  useEffect(() => {
    if (paused || !visible) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const p = progress.get() + (t - last) / DURATION;
      last = t;
      if (p >= 1) {
        progress.set(0);
        setIndex((i) => (i + 1) % quotes.length);
      } else progress.set(p);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, visible, progress, quotes.length]);

  const q = quotes[index];
  const hindi = isHindi(q);
  const words = q.split(' ');

  return (
    <section aria-label="Motivational quotes" className="mx-auto w-full max-w-[1200px] px-5">
      <div
        className="relative mx-auto flex min-h-[260px] max-w-[920px] flex-col items-center justify-center py-10 text-center sm:min-h-[300px]"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onPointerDown={(e) => (swipe.current = e.clientX)}
        onPointerUp={(e) => {
          if (swipe.current === null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        <span aria-hidden className="mb-4 font-serif text-[64px] leading-none text-[#9AFF01]/80">“</span>
        <div aria-live="polite" aria-atomic="true" className="relative w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.blockquote
              key={index}
              className="mx-auto max-w-[24ch] text-[26px] leading-[1.25] font-semibold tracking-[-0.015em] text-balance sm:max-w-[28ch] sm:text-[36px] lg:text-[42px]"
              style={hindi ? { fontFamily: 'var(--font-devanagari), var(--font-ui)' } : undefined}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduce ? { opacity: 1 } : { opacity: 0, y: -12, filter: 'blur(8px)' }}
              transition={{ duration: reduce ? 0 : 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {reduce
                ? q
                : words.map((w, i) => (
                    <motion.span key={i} className="inline-block" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.035, duration: 0.35 }}>
                      {w}
                      {i < words.length - 1 ? ' ' : ''}
                    </motion.span>
                  ))}
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="mt-8 h-[2px] w-40 overflow-hidden rounded-full bg-white/10" aria-hidden>
          <motion.div className="h-full origin-left bg-[#9AFF01]" style={{ scaleX: progress }} />
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous quote" className="hidden size-10 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white sm:grid">
            <ChevronLeft className="size-5" strokeWidth={2} />
          </button>
          <div className="flex flex-wrap justify-center gap-0.5" role="tablist" aria-label="Choose a quote">
            {quotes.map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Quote ${i + 1}`} onClick={() => go(i)} className="grid size-6 place-items-center">
                <span className={`block h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-5 bg-[#9AFF01]' : 'w-1.5 bg-white/25 hover:bg-white/50'}`} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go(index + 1)} aria-label="Next quote" className="hidden size-10 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white sm:grid">
            <ChevronRight className="size-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  );
}

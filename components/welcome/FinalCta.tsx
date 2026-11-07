'use client';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { BRAND } from '@/lib/brand';

export function FinalCta({ onCreate }: { onCreate: () => void }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <section aria-labelledby="cta-title" className="relative isolate w-full overflow-hidden px-5 py-24 text-center sm:py-32">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_50%_100%,rgba(154,255,1,0.22),transparent_70%)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-px bg-[linear-gradient(90deg,transparent,rgba(154,255,1,0.4),transparent)]" />
      <motion.div initial={{ opacity: 0, y: reduce ? 0 : 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }} className="mx-auto flex max-w-[760px] flex-col items-center">
        <h2 id="cta-title" className="text-[32px] leading-[1.08] font-bold tracking-[-0.025em] text-balance sm:text-[48px]">
          Your selection starts with today’s plan.
        </h2>
        <button type="button" onClick={onCreate} className="l4s-cta group mt-9 w-full sm:w-auto">
          <span className="l4s-cta-shimmer" aria-hidden />
          <span className="relative">Create My Timetable</span>
          <ArrowRight className="relative size-5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.25} aria-hidden />
        </button>
        <p lang="hi" className="mt-6 text-[20px] font-semibold text-[#9AFF01]" style={{ fontFamily: 'var(--font-devanagari), var(--font-ui)' }}>
          आज से शुरुआत करो।
        </p>
      </motion.div>
    </section>
  );
}

export function WelcomeFooter() {
  return (
    <footer className="border-t border-white/10 px-5 py-10">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- exact brand asset on dark background */}
          <img src={BRAND.logo} alt={`${BRAND.name} logo`} width={54} height={48} loading="lazy" decoding="async" className="h-12 w-auto" />
          <p className="text-[13px] text-white/60">
            © {BRAND.name} · {BRAND.tagline}
          </p>
        </div>
        {BRAND.address || BRAND.phone ? (
          <address className="text-[13px] text-white/55 not-italic">
            {BRAND.address ? <div>{BRAND.address}</div> : null}
            {BRAND.phone ? (
              <a href={`tel:${BRAND.phone.replace(/\s+/g, '')}`} className="hover:text-white">
                {BRAND.phone}
              </a>
            ) : null}
          </address>
        ) : null}
      </div>
    </footer>
  );
}

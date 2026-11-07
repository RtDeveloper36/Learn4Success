'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, MotionConfig, useReducedMotion } from 'motion/react';
import { BRAND, STUDIO_PATH } from '@/lib/brand';
import { withBase } from '@/lib/base';
import { Hero } from './Hero';
import { TodayCard } from './TodayCard';
import { QuoteStage } from './QuoteStage';
import { ExamMarquee } from './ExamMarquee';
import { WhySection } from './WhySection';
import { PreviewSteps } from './PreviewSteps';
import { FinalCta, WelcomeFooter } from './FinalCta';
import { useSavedProfile } from './hooks';

interface Flight {
  from: DOMRect;
  to: { x: number; y: number; size: number };
}

/** Where the 32px seal sits in the studio toolbar at this viewport size (mirrors ResponsiveShell). */
function toolbarLogoSpot(): { x: number; y: number; size: number } {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const twoPane = w >= 1024 || (w >= 900 && w > h);
  if (twoPane) return { x: 12 + 36 + 6, y: 12, size: 32 };
  if (w >= 768) return { x: 12, y: 12, size: 32 };
  return { x: 8, y: 10, size: 32 };
}

/** Learn 4 Success welcome page — the first screen students see. */
export function WelcomePage() {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const saved = useSavedProfile();
  const sealRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);

  // Shared links skip the welcome page and open the studio directly.
  useEffect(() => {
    const check = () => {
      if (/[#&](share|data)=/.test(location.hash)) location.replace(`${withBase(STUDIO_PATH)}${location.hash}`);
    };
    check();
    window.addEventListener('hashchange', check);
    router.prefetch(STUDIO_PATH);
    return () => window.removeEventListener('hashchange', check);
  }, [router]);

  // Always-dark page: match the overscroll / browser chrome area.
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = BRAND.colors.ink;
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  const go = useCallback(
    (href: string) => {
      if (leaving) return;
      try {
        sessionStorage.setItem('l4s:fromWelcome', '1');
      } catch {
        /* ignore */
      }
      setLeaving(true);
      const seal = sealRef.current;
      const inView = seal && seal.getBoundingClientRect().bottom > 0;
      if (!reduce && seal && inView) {
        setFlight({ from: seal.getBoundingClientRect(), to: toolbarLogoSpot() });
        setTimeout(() => router.push(href), 680);
      } else setTimeout(() => router.push(href), reduce ? 200 : 420);
    },
    [leaving, reduce, router],
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="l4s-welcome min-h-[100dvh] overflow-x-clip bg-[#0A0A0A] font-ui text-white antialiased">
        <motion.main animate={{ opacity: leaving ? 0 : 1 }} transition={{ duration: reduce ? 0.2 : 0.45, ease: [0.2, 0.8, 0.2, 1] }} className="flex flex-col gap-24 pb-4 sm:gap-32">
          <Hero saved={saved} sealRef={sealRef} leaving={!!flight} onCreate={() => go(STUDIO_PATH)} onContinue={() => go(STUDIO_PATH)} />
          <TodayCard />
          <QuoteStage />
          <ExamMarquee onPick={go} />
          <WhySection />
          <PreviewSteps />
          <div>
            <FinalCta onCreate={() => go(STUDIO_PATH)} />
            <WelcomeFooter />
          </div>
        </motion.main>

        {flight ? (
          // Shared-element feel: the seal shrinks and flies to the studio toolbar's logo spot.
          <motion.img
            src={BRAND.seal}
            alt=""
            aria-hidden
            className="pointer-events-none fixed z-[200] rounded-full"
            style={{ left: flight.from.left, top: flight.from.top, width: flight.from.width, height: flight.from.height, transformOrigin: 'top left' }}
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={{ x: flight.to.x - flight.from.left, y: flight.to.y - flight.from.top, scale: flight.to.size / flight.from.width }}
            transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 0.9 }}
          />
        ) : null}
      </div>
    </MotionConfig>
  );
}

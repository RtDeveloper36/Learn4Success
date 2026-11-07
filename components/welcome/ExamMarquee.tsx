'use client';
import { MARQUEE_EXAMS, STUDIO_PATH } from '@/lib/brand';

function Row({ items, reverse, onPick }: { items: string[]; reverse?: boolean; onPick: (href: string) => void }) {
  const chips = [...items, ...items];
  return (
    <div className="l4s-marquee">
      <div className={`l4s-marquee-track ${reverse ? 'l4s-reverse' : ''}`}>
        {chips.map((exam, i) => {
          const href = `${STUDIO_PATH}?exam=${encodeURIComponent(exam)}`;
          return (
            <a
              key={`${exam}-${i}`}
              href={href}
              aria-hidden={i >= items.length ? true : undefined}
              tabIndex={i >= items.length ? -1 : undefined}
              onClick={(e) => {
                e.preventDefault();
                onPick(href);
              }}
              className="l4s-chip"
            >
              <span className="size-1.5 rounded-full bg-[#9AFF01] shadow-[0_0_8px_#9AFF01]" aria-hidden />
              {exam}
            </a>
          );
        })}
      </div>
    </div>
  );
}

/** Two opposite-direction infinite rows of exam chips; a chip opens the studio pre-filled. */
export function ExamMarquee({ onPick }: { onPick: (href: string) => void }) {
  const half = Math.ceil(MARQUEE_EXAMS.length / 2);
  return (
    <section aria-labelledby="exams-title" className="w-full">
      <h2 id="exams-title" className="mx-auto mb-7 max-w-[30ch] px-5 text-center text-[18px] leading-snug font-medium text-white/80 sm:text-[20px]">
        Preparing for any of these? <span className="text-white">Your timetable is ready in one click.</span>
      </h2>
      <div className="flex flex-col gap-3">
        <Row items={MARQUEE_EXAMS.slice(0, half)} onPick={onPick} />
        <Row items={MARQUEE_EXAMS.slice(half)} reverse onPick={onPick} />
      </div>
    </section>
  );
}

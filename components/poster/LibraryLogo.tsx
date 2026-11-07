'use client';
import { BRAND } from '@/lib/brand';
import { useSealSrc } from '@/lib/seal';

/**
 * The exact library seal (never redrawn or recoloured). Fixed px size in the 794px poster
 * coordinate system; on dark poster themes a thin lime ring separates the black seal from
 * the background.
 */
export function LibraryLogo({ size, dark }: { size: number; dark: boolean }) {
  const src = useSealSrc();
  return (
    // eslint-disable-next-line @next/next/no-img-element -- must be a plain <img> so html-to-image embeds it
    <img
      src={src}
      width={size}
      height={size}
      alt={`${BRAND.name} ${BRAND.tagline} logo`}
      className="p-seal"
      data-dark={dark ? 'true' : 'false'}
      draggable={false}
      decoding="sync"
      style={{ width: size, height: size }}
    />
  );
}

/** Slim brand strip used when the header section is switched off, so every timetable stays branded. */
export function BrandStrip({ dark, position }: { dark: boolean; position: 'top-right' | 'top-left' | 'top-center' }) {
  return (
    <div className="p-brandstrip" data-pos={position}>
      <LibraryLogo size={72} dark={dark} />
      <div className="p-brandstrip-text">
        <div className="p-brandstrip-name">{BRAND.name} Library</div>
        <div className="p-brandstrip-tag">{BRAND.tagline}</div>
      </div>
    </div>
  );
}

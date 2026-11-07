'use client';
import { createContext, useContext } from 'react';
import type { BreakpointInfo } from '@/hooks/useBreakpoint';

/** Shared breakpoint info so popovers can become sheets on phones & tablets. */
export const LayoutContext = createContext<Pick<BreakpointInfo, 'bp' | 'stacked' | 'touch' | 'small'>>({
  bp: 'laptop',
  stacked: false,
  touch: false,
  small: false,
});

export const useLayout = () => useContext(LayoutContext);

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

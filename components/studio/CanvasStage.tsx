'use client';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, CircleCheck, Copy, Pencil, Trash2, TriangleAlert } from 'lucide-react';
import { useProjectStore } from '@/lib/store';
import { useUI } from '@/lib/ui';
import { PALETTE } from '@/lib/presets';
import { PAGE_H, PAGE_W } from '@/lib/autofit';
import { deleteSlot, duplicateSlot } from '@/lib/actions';
import type { PosterContent, Selection, Slot } from '@/lib/types';
import { useFitZoom } from '@/hooks/useFitZoom';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { Poster } from '@/components/poster/Poster';
import { cx } from '@/components/ui/layout-context';

interface InlineEdit {
  field: string;
  value: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
}

interface Props {
  /** 'width' on phones/tablet portrait, 'page' on laptops and up */
  fitMode: 'width' | 'page';
  maxFitZoom?: number;
  padding?: number;
  /** phone: tapping a card opens the bottom sheet at half height */
  onSelectOpenEditor?: boolean;
}

function readField(field: string): string {
  const p = useProjectStore.getState().project;
  const [scope, a, b] = field.split('.');
  if (scope === 'content') return String(p.content[a as keyof PosterContent] ?? '');
  const slot = p.slots.find((s) => s.id === a);
  return slot ? String(slot[b as keyof Slot] ?? '') : '';
}

function writeField(field: string, value: string) {
  const st = useProjectStore.getState();
  const [scope, a, b] = field.split('.');
  if (scope === 'content') st.setContent({ [a]: value } as Partial<PosterContent>);
  else st.updateSlot(a, { [b]: b === 'category' ? value.toUpperCase() : value } as Partial<Slot>);
}

export function CanvasStage({ fitMode, maxFitZoom = 1.5, padding = 32 }: Props) {
  const project = useProjectStore((s) => s.project);
  const fit = useUI((s) => s.fit);
  const selection = useUI((s) => s.selection);
  const zoomMode = useUI((s) => s.zoomMode);
  const manualZoom = useUI((s) => s.zoom);
  const select = useUI((s) => s.select);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const pageH = fit.status === 'overflow' ? Math.max(PAGE_H, fit.contentHeight + 40) : PAGE_H;
  const fitZoom = useFitZoom(scrollRef, fitMode, { maxZoom: maxFitZoom, padding });
  const z = zoomMode === 'fit' ? fitZoom : manualZoom;
  const [edit, setEdit] = useState<InlineEdit | null>(null);
  const [menu, setMenu] = useState<{ sel: Selection; x: number; y: number } | null>(null);

  // keep the toolbar % in sync while in Fit mode
  useEffect(() => {
    if (zoomMode === 'fit') useUI.setState({ zoom: fitZoom });
  }, [fitZoom, zoomMode]);

  const getZoom = useCallback(() => useUI.getState().zoom, []);
  const setZoomAnchored = useCallback((nz: number, anchor?: { x: number; y: number }) => {
    const el = scrollRef.current;
    const before = useUI.getState().zoom;
    const clamped = Math.min(2, Math.max(0.25, nz));
    useUI.getState().setZoom(clamped);
    if (el && anchor) {
      const rect = el.getBoundingClientRect();
      const ax = anchor.x - rect.left + el.scrollLeft;
      const ay = anchor.y - rect.top + el.scrollTop;
      const r = clamped / before;
      requestAnimationFrame(() => {
        el.scrollLeft = ax * r - (anchor.x - rect.left);
        el.scrollTop = ay * r - (anchor.y - rect.top);
      });
    }
  }, []);
  const onDoubleTap = useCallback(() => {
    const ui = useUI.getState();
    if (ui.zoomMode === 'fit') ui.setZoom(1);
    else ui.setFitZoom();
  }, []);
  usePinchZoom(scrollRef, { getZoom, setZoom: setZoomAnchored, onDoubleTap });

  const onSelect = useCallback(
    (sel: Selection) => {
      setMenu(null);
      select(sel, { focus: !!sel });
      // Phones/tablets: keep the tapped card visible above the editor sheet.
      if (sel && fitMode === 'width') {
        requestAnimationFrame(() => {
          const sc = scrollRef.current;
          const el = sc?.querySelector<HTMLElement>('[data-selected="true"]');
          if (!sc || !el) return;
          const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
          sc.scrollTo({ top: Math.max(0, top - 24), behavior: 'smooth' });
        });
      }
    },
    [select, fitMode],
  );

  const onInlineEdit = useCallback(
    (field: string, el: HTMLElement) => {
      const host = sheetRef.current;
      if (!host) return;
      const hr = host.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      setEdit({
        field,
        value: readField(field),
        left: r.left - hr.left,
        top: r.top - hr.top,
        width: Math.max(r.width + 24, 160),
        height: r.height,
        fontSize: parseFloat(cs.fontSize) * z,
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
      });
    },
    [z],
  );

  const onContextMenu = useCallback(
    (sel: Selection, x: number, y: number) => {
      select(sel);
      setMenu({ sel, x, y });
    },
    [select],
  );

  const commit = () => {
    if (edit) writeField(edit.field, edit.value);
    setEdit(null);
  };
  const onEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEdit(null);
  };

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  const slotSel = menu?.sel?.type === 'slot' ? project.slots.find((s) => s.id === (menu.sel as { id: string }).id) : null;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} className="canvas-bg scroll-thin absolute inset-0 overflow-auto overscroll-contain" onClick={(e) => e.target === e.currentTarget && select(null)}>
        <div className="flex min-h-full min-w-max" style={{ padding }} onClick={(e) => e.target === e.currentTarget && select(null)}>
          <div className={cx('relative shrink-0', fitMode === 'width' ? 'mx-auto mb-auto' : 'm-auto')} style={{ width: PAGE_W * z, height: pageH * z }}>
            <div ref={sheetRef} className="paper-shadow absolute top-0 left-0 origin-top-left" style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${z})` }}>
              <Poster project={project} fit={fit} mode="preview" selection={selection} onSelect={onSelect} onInlineEdit={onInlineEdit} onContextMenu={onContextMenu} />
              {edit ? (
                <input
                  autoFocus
                  aria-label="Edit text"
                  data-inline-edit
                  value={edit.value}
                  onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                  onBlur={commit}
                  onKeyDown={onEditKey}
                  onFocus={(e) => e.target.select()}
                  className="absolute z-10 rounded-[4px] bg-white px-1 text-[#0f172a] shadow-[0_0_0_2px_#0071e3,0_8px_24px_rgba(0,0,0,0.18)] outline-none"
                  style={{
                    left: edit.left / z - 4,
                    top: edit.top / z - 2,
                    width: edit.width / z,
                    height: Math.max(edit.height / z + 4, 24),
                    fontSize: edit.fontSize / z,
                    fontFamily: edit.fontFamily,
                    fontWeight: edit.fontWeight as React.CSSProperties['fontWeight'],
                  }}
                />
              ) : null}
            </div>
            {fit.status === 'overflow' ? (
              <div className="pointer-events-none absolute right-0 left-0 border-t-2 border-dashed border-danger" style={{ top: PAGE_H * z }}>
                <span className="absolute -top-6 right-1 rounded bg-danger px-1.5 py-0.5 text-[10px] font-semibold text-white">Page end</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      </div>

      {/* status bar sits BELOW the canvas so it never covers the A4 sheet */}
      <div className="hairline-t no-scrollbar flex h-9 shrink-0 items-center gap-1.5 overflow-x-auto bg-app px-3">
        <span className="shrink-0 rounded-full bg-fill-2 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-ink-2">A4 · 210 × 297 mm</span>
        <FitIndicator />
      </div>

      {menu && typeof document !== 'undefined'
        ? createPortal(
            <div
              role="menu"
              className="fixed z-[75] min-w-[200px] rounded-xl bg-surface p-1 shadow-[0_0_0_0.5px_var(--hairline-strong),var(--shadow-lg)] animate-pop-in"
              style={{ left: Math.min(menu.x, window.innerWidth - 216), top: Math.min(menu.y, window.innerHeight - 220) }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MenuItem icon={<Pencil />} label="Edit" onClick={() => { select(menu.sel, { focus: true }); setMenu(null); }} />
              {slotSel ? (
                <>
                  <MenuItem icon={<Copy />} label="Duplicate" onClick={() => { duplicateSlot(slotSel.id); setMenu(null); }} />
                  <div className="px-2.5 pt-1.5 pb-1 text-[11px] text-ink-3">Change colour</div>
                  <div className="grid grid-cols-6 gap-1 px-2 pb-1.5">
                    {PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        role="menuitem"
                        aria-label={c.name}
                        onClick={() => {
                          useProjectStore.getState().updateSlot(slotSel.id, { color: c.hex });
                          setMenu(null);
                        }}
                        className="size-6 rounded-full transition-transform hover:scale-110"
                        style={{ background: c.hex, boxShadow: slotSel.color === c.hex ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${c.hex}` : undefined }}
                      />
                    ))}
                  </div>
                  <div className="my-1 h-px bg-hairline" />
                  <MenuItem icon={<Trash2 />} label="Delete" danger onClick={() => { deleteSlot(slotSel.id); setMenu(null); }} />
                </>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={cx('flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] hover:bg-accent hover:text-white [&_svg]:size-4 [&_svg]:stroke-[1.75]', danger && 'text-danger')}>
      {icon}
      {label}
    </button>
  );
}

export function FitIndicator() {
  const fit = useUI((s) => s.fit);
  const columns = useProjectStore((s) => s.project.design.columns);
  if (fit.status === 'fits')
    return (
      <span className="inline-flex shrink-0 whitespace-nowrap bg-fill-2 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-success-ink" role="status">
        <CircleCheck className="size-3.5" strokeWidth={2} /> Fits on 1 page
      </span>
    );
  if (fit.status === 'scaled')
    return (
      <span className="inline-flex shrink-0 whitespace-nowrap bg-fill-2 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-warning-ink" role="status" title="Too many slots: try the 2-column layout">
        <TriangleAlert className="size-3.5" strokeWidth={2} /> Auto-scaled {Math.round(fit.scale * 100)}%{columns === 1 ? ' · Too many slots: try the 2-column layout' : ''}
      </span>
    );
  return (
    <span className="inline-flex shrink-0 whitespace-nowrap bg-fill-2 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-danger" role="status">
      <CircleAlert className="size-3.5" strokeWidth={2} /> Overflow — turn on Auto-Fit
    </span>
  );
}

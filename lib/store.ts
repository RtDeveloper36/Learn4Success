'use client';
/**
 * Project store: the active project (tracked by zundo for undo/redo), the profile library,
 * and persistence to localStorage (zustand `persist`, debounced, zod-validated, skipHydration).
 */
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { DesignSettings, PosterContent, Project, SetupInput, Slot, SlotKind } from './types';
import { createBlankProject, createDefaultProject, defaultSetup, uid } from './defaults';
import { CURRENT_SCHEMA, STORAGE_KEY, parsePersisted } from './storage';
import { chainTimes, makeBreak, makeStudy } from './schedule';
import { addMinutes, durationMinutes, toMinutes } from './time';
import type { GenerateResult } from './generator';
import { THEMES } from './presets';

/* ------------------------------------------------------------------ */
/* Save status (separate tiny store so typing does not re-render all)  */
/* ------------------------------------------------------------------ */

export const useSaveStatus = create<{ status: 'saved' | 'saving'; corrupted: boolean }>(() => ({
  status: 'saved',
  corrupted: false,
}));

/** localStorage wrapper whose writes are debounced by 400 ms. */
function createDebouncedStorage(delay = 400): StateStorage {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { name: string; value: string } | null = null;
  const flush = () => {
    if (!pending) return;
    try {
      localStorage.setItem(pending.name, pending.value);
    } catch {
      /* quota exceeded or blocked — keep working in memory */
    }
    pending = null;
    useSaveStatus.setState({ status: 'saved' });
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  }
  return {
    getItem: (name) => {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      pending = { name, value };
      useSaveStatus.setState({ status: 'saving' });
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        /* ignore */
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export interface ProjectState {
  project: Project;
  /** every saved profile; the active one is kept in sync on persist */
  library: Project[];
  hydrated: boolean;

  updateProject: (fn: (p: Project) => Project, opts?: { customized?: boolean }) => void;
  setContent: (patch: Partial<PosterContent>) => void;
  setSections: (patch: Partial<PosterContent['sections']>) => void;
  setDesign: (patch: Partial<DesignSettings>) => void;
  setSetup: (patch: Partial<SetupInput>) => void;

  setSlots: (slots: Slot[], opts?: { customized?: boolean }) => void;
  updateSlot: (id: string, patch: Partial<Slot>) => void;
  setSlotTime: (id: string, field: 'start' | 'end', value: string, chain: 'all' | 'next' | null) => void;
  addSlot: (afterId: string | null, kind: SlotKind) => string;
  duplicateSlot: (id: string) => string | null;
  deleteSlot: (id: string) => void;
  moveSlot: (id: string, dir: -1 | 1) => void;
  reorderSlots: (fromId: string, toId: string) => void;

  applyGenerated: (res: GenerateResult) => void;
  loadDefault: () => void;
  clearAll: () => void;

  renameProject: (name: string) => void;
  saveAsNew: (name?: string) => string;
  duplicateProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
  switchProfile: (id: string) => void;
  importProject: (p: Project) => void;
  renameProfile: (id: string, name: string) => void;
}

const initialProject = createDefaultProject('Karo-Ya-Maro Master', true);

const syncLibrary = (library: Project[], project: Project): Project[] => {
  const i = library.findIndex((p) => p.id === project.id);
  if (i < 0) return [...library, project];
  const next = library.slice();
  next[i] = project;
  return next;
};

/** Signed minute difference between two clock times, choosing the shortest direction. */
const signedDelta = (from: string, to: string) => {
  const d = toMinutes(to) - toMinutes(from);
  return ((d + 720 + 1440) % 1440) - 720;
};

export const useProjectStore = create<ProjectState>()(
  persist(
    temporal(
      (set, get) => {
        const touch = (p: Project, customized?: boolean): Project => ({
          ...p,
          updatedAt: Date.now(),
          customized: customized ? true : p.customized,
        });
        const mutate = (fn: (p: Project) => Project, customized?: boolean) =>
          set((s) => {
            const project = touch(fn(s.project), customized);
            return { project, library: syncLibrary(s.library, project) };
          });
        const mutateSlots = (fn: (slots: Slot[]) => Slot[]) => mutate((p) => ({ ...p, slots: fn(p.slots) }), true);

        return {
          project: initialProject,
          library: [initialProject],
          hydrated: false,

          updateProject: (fn, opts) => mutate(fn, opts?.customized),
          setContent: (patch) => mutate((p) => ({ ...p, content: { ...p.content, ...patch } })),
          setSections: (patch) =>
            mutate((p) => ({ ...p, content: { ...p.content, sections: { ...p.content.sections, ...patch } } })),
          setDesign: (patch) => mutate((p) => ({ ...p, design: { ...p.design, ...patch } })),
          setSetup: (patch) => mutate((p) => ({ ...p, setup: { ...p.setup, ...patch } })),

          setSlots: (slots, opts) => mutate((p) => ({ ...p, slots }), opts?.customized ?? true),
          updateSlot: (id, patch) => mutateSlots((slots) => slots.map((s) => (s.id === id ? { ...s, ...patch } : s))),
          setSlotTime: (id, field, value, chain) =>
            mutateSlots((slots) => {
              const cur = slots.find((s) => s.id === id);
              if (!cur) return slots;
              const next = slots.map((s) => (s.id === id ? { ...s, [field]: value } : s));
              if (field === 'end' && chain) return chainTimes(next, id, signedDelta(cur.end, value), chain);
              return next;
            }),
          addSlot: (afterId, kind) => {
            const slots = get().project.slots;
            const idx = afterId ? slots.findIndex((s) => s.id === afterId) : slots.length - 1;
            const prev = idx >= 0 ? slots[idx] : null;
            const start = prev ? prev.end : get().project.setup.startTime || '06:30';
            const len = kind === 'break' ? 10 : 60;
            const slot = kind === 'break' ? makeBreak(start, addMinutes(start, len)) : makeStudy(start, addMinutes(start, len));
            mutateSlots((list) => {
              const at = afterId ? list.findIndex((s) => s.id === afterId) + 1 : list.length;
              const out = list.slice();
              out.splice(at, 0, slot);
              return out;
            });
            return slot.id;
          },
          duplicateSlot: (id) => {
            const src = get().project.slots.find((s) => s.id === id);
            if (!src) return null;
            const len = durationMinutes(src.start, src.end);
            const copy: Slot = { ...src, id: uid('slot'), start: src.end, end: addMinutes(src.end, len) };
            mutateSlots((list) => {
              const out = list.slice();
              out.splice(list.findIndex((s) => s.id === id) + 1, 0, copy);
              return out;
            });
            return copy.id;
          },
          deleteSlot: (id) => mutateSlots((list) => list.filter((s) => s.id !== id)),
          moveSlot: (id, dir) =>
            mutateSlots((list) => {
              const i = list.findIndex((s) => s.id === id);
              const j = i + dir;
              if (i < 0 || j < 0 || j >= list.length) return list;
              const out = list.slice();
              [out[i], out[j]] = [out[j], out[i]];
              return out;
            }),
          reorderSlots: (fromId, toId) =>
            mutateSlots((list) => {
              const from = list.findIndex((s) => s.id === fromId);
              const to = list.findIndex((s) => s.id === toId);
              if (from < 0 || to < 0 || from === to) return list;
              const out = list.slice();
              const [item] = out.splice(from, 1);
              out.splice(to, 0, item);
              return out;
            }),

          applyGenerated: (res) =>
            mutate((p) => ({
              ...p,
              slots: res.slots,
              content: { ...p.content, ...res.contentPatch },
              customized: false,
            })),
          loadDefault: () =>
            mutate((p) => {
              const d = createDefaultProject(p.name);
              return { ...d, id: p.id, name: p.name, customized: false };
            }),
          clearAll: () =>
            mutate((p) => {
              const b = createBlankProject(p.name);
              return { ...b, id: p.id, name: p.name, design: p.design, setup: defaultSetup(), customized: false };
            }),

          renameProject: (name) => mutate((p) => ({ ...p, name })),
          renameProfile: (id, name) =>
            set((s) => {
              if (id === s.project.id) {
                const project = { ...s.project, name };
                return { project, library: syncLibrary(s.library, project) };
              }
              return { library: s.library.map((p) => (p.id === id ? { ...p, name } : p)) };
            }),
          saveAsNew: (name) => {
            const s = get();
            const copy: Project = {
              ...structuredClone(s.project),
              id: uid('proj'),
              name: name || `${s.project.name} copy`,
              updatedAt: Date.now(),
            };
            set({ project: copy, library: [...syncLibrary(s.library, s.project), copy] });
            useProjectStore.temporal.getState().clear();
            return copy.id;
          },
          duplicateProfile: (id) =>
            set((s) => {
              const lib = syncLibrary(s.library, s.project);
              const src = lib.find((p) => p.id === id);
              if (!src) return {};
              const copy = { ...structuredClone(src), id: uid('proj'), name: `${src.name} copy`, updatedAt: Date.now() };
              return { library: [...lib, copy] };
            }),
          deleteProfile: (id) => {
            const s = get();
            let library = syncLibrary(s.library, s.project).filter((p) => p.id !== id);
            if (library.length === 0) library = [createDefaultProject()];
            if (id === s.project.id) {
              set({ library, project: library[0] });
              useProjectStore.temporal.getState().clear();
            } else set({ library });
          },
          switchProfile: (id) => {
            const s = get();
            const library = syncLibrary(s.library, s.project);
            const target = library.find((p) => p.id === id);
            if (!target || id === s.project.id) return;
            set({ library, project: target });
            useProjectStore.temporal.getState().clear();
          },
          importProject: (p) => {
            const s = get();
            const library = [...syncLibrary(s.library, s.project), p];
            set({ library, project: p });
            useProjectStore.temporal.getState().clear();
          },
        };
      },
      {
        limit: 100,
        partialize: (s) => ({ project: s.project }),
        equality: (a, b) => a.project === b.project,
        // Group rapid typing into one undo step: record only the state before a burst of edits.
        handleSet: (handleSet) => {
          let timer: ReturnType<typeof setTimeout> | null = null;
          return (...args: Parameters<typeof handleSet>) => {
            if (timer === null) handleSet(...args);
            else clearTimeout(timer);
            timer = setTimeout(() => {
              timer = null;
            }, 450);
          };
        },
      },
    ),
    {
      name: STORAGE_KEY,
      version: CURRENT_SCHEMA,
      skipHydration: true,
      storage: createJSONStorage(() => createDebouncedStorage(400)),
      partialize: (s) => ({ activeId: s.project.id, projects: syncLibrary(s.library, s.project) }),
      migrate: (persisted) => persisted,
      merge: (persisted, current) => {
        if (persisted === undefined || persisted === null) return { ...current, hydrated: true };
        const data = parsePersisted(persisted);
        if (!data) {
          useSaveStatus.setState({ corrupted: true });
          return { ...current, hydrated: true };
        }
        const projects = data.projects as Project[];
        const project = projects.find((p) => p.id === data.activeId) ?? projects[0];
        return { ...current, project, library: projects, hydrated: true };
      },
    },
  ),
);

/** Call once after mount: loads saved data, then clears undo history so hydration is not undoable. */
export async function hydrateStore(): Promise<void> {
  await useProjectStore.persist.rehydrate();
  if (!useProjectStore.getState().hydrated) useProjectStore.setState({ hydrated: true });
  useProjectStore.temporal.getState().clear();
}

export const themeIds = THEMES.map((t) => t.id);

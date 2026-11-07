'use client';
/** User-level actions shared by tabs, toolbar, command palette and keyboard shortcuts. */
import type { Project, TemplateId } from './types';
import { useProjectStore } from './store';
import { confirmDialog, toast, useUI } from './ui';
import { generateTimetable } from './generator';
import { encodeShareHash } from './storage';
import { STUDIO_PATH } from './brand';
import { withBase } from './base';
import { createDefaultProject } from './defaults';
import { exportJson, exportPdf, exportPng, printPoster } from './export';

const store = () => useProjectStore.getState();

function restoreWithToast(message: string, before: Project) {
  toast(message, {
    action: {
      label: 'Undo',
      run: () => store().updateProject(() => before),
    },
  });
}

/** Generate (or shuffle) from the Setup inputs. Confirms before replacing a hand-edited schedule. */
export async function runGenerate(shuffle = false): Promise<void> {
  const { project } = store();
  if (project.customized && project.slots.length > 0) {
    const ok = await confirmDialog({
      title: 'Replace your edited schedule?',
      message: 'You have customised the current timetable. Generating will replace all slots (you can undo right after).',
      confirmLabel: shuffle ? 'Shuffle' : 'Generate',
    });
    if (!ok) return;
  }
  const before = structuredClone(store().project);
  const seed = shuffle ? (project.setup.seed || 0) + 1 : project.setup.seed;
  if (shuffle) store().setSetup({ seed });
  const res = generateTimetable({ ...store().project.setup, seed });
  store().applyGenerated(res);
  useUI.getState().select(null);
  const src =
    res.subjectSource === 'preset' ? ` using ${res.presetLabel} subjects` : res.subjectSource === 'custom' ? ' from your subjects' : '';
  restoreWithToast(`${shuffle ? 'New variation' : 'Timetable generated'}${src}`, before);
  res.warnings.forEach((w) => toast(w, { duration: 5000 }));
}

/** Welcome-page exam chip: pre-fill the exam in Setup and generate immediately (with Undo). */
export function generateForExam(examName: string): void {
  // Never overwrite a hand-edited timetable: open the exam plan as a new profile instead.
  if (store().project.customized) store().importProject(createDefaultProject(`${examName} Timetable`));
  else store().renameProject(`${examName} Timetable`);
  const before = structuredClone(store().project);
  store().setSetup({ examName, subjects: [], seed: 0 });
  const res = generateTimetable({ ...store().project.setup, examName, subjects: [], seed: 0 });
  store().applyGenerated(res);
  useUI.getState().set({ tab: 'setup' });
  const src = res.presetLabel ? ` with ${res.presetLabel} subjects` : '';
  restoreWithToast(`${examName} timetable generated${src}`, before);
}

export async function loadDefaultTemplate(): Promise<void> {
  const before = structuredClone(store().project);
  if (before.customized) {
    const ok = await confirmDialog({
      title: 'Load the default template?',
      message: 'This replaces the schedule, header and footer with the default “Karo-Ya-Maro” master timetable.',
      confirmLabel: 'Load default',
    });
    if (!ok) return;
  }
  store().loadDefault();
  restoreWithToast('Default Karo-Ya-Maro template loaded', before);
}

export async function clearAll(): Promise<void> {
  const ok = await confirmDialog({
    title: 'Clear everything?',
    message: 'All slots, milestones and setup inputs will be removed so you can start from a blank page.',
    confirmLabel: 'Clear All',
    destructive: true,
  });
  if (!ok) return;
  const before = structuredClone(store().project);
  store().clearAll();
  useUI.getState().select(null);
  restoreWithToast('Cleared — blank timetable', before);
}

export function deleteSlot(id: string): void {
  const before = structuredClone(store().project);
  const slot = before.slots.find((s) => s.id === id);
  store().deleteSlot(id);
  const ui = useUI.getState();
  if (ui.selection?.type === 'slot' && ui.selection.id === id) ui.select(null);
  restoreWithToast(`Deleted “${slot?.title || 'slot'}”`, before);
}

export function duplicateSlot(id: string): void {
  const newId = store().duplicateSlot(id);
  if (newId) useUI.getState().select({ type: 'slot', id: newId }, { focus: true });
}

export function addSlot(kind: 'study' | 'break', afterId?: string | null): void {
  const sel = useUI.getState().selection;
  const anchor = afterId !== undefined ? afterId : sel?.type === 'slot' ? sel.id : null;
  const id = store().addSlot(anchor, kind);
  useUI.getState().select({ type: 'slot', id }, { focus: true });
}

export function applyTemplate(template: TemplateId): void {
  const s = store();
  if (template === 'editorial') {
    s.setDesign({ template, themeId: 'midnight-slate', columns: 2, cardStyle: 'tinted' });
    s.setSections({ kpi: true, header: true, rail: false });
  } else if (template === 'minimal') {
    s.setDesign({ template, themeId: 'clean-paper', columns: 1, cardStyle: 'outline', showColorWash: false });
    s.setSections({ rail: true });
  } else {
    s.setDesign({ template, themeId: 'clean-paper', columns: 1, cardStyle: 'tinted', showColorWash: true, showDotGrid: true });
    s.setSections({ kpi: false, rail: true });
  }
}

export async function copyShareLink(): Promise<void> {
  const url = `${location.origin}${withBase(STUDIO_PATH)}${encodeShareHash(store().project)}`;
  try {
    await navigator.clipboard.writeText(url);
    toast('Share link copied', { tone: 'success' });
  } catch {
    window.prompt('Copy this link', url);
  }
}

export const doExportPdf = () => exportPdf(store().project);
export const doExportPng = () => exportPng(store().project);
export const doExportJson = () => exportJson(store().project);

/** Shows the print tip first (unless dismissed with “Don't show again”). */
export function doPrint(): void {
  const ui = useUI.getState();
  if (!ui.printTipDismissed) ui.set({ printTipOpen: true });
  else printPoster();
}

/** Auto-save is continuous; ⌘S forces a write and confirms it. */
export function saveProfile(): void {
  store().updateProject((p) => ({ ...p }));
  toast('Profile saved', { tone: 'success' });
}

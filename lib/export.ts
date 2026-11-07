'use client';
/**
 * Export engine: A4 PDF, Ultra-HD PNG, JSON, print.
 *
 * Always captures a dedicated off-screen 794 × 1123 node rendered by <ExportHost> with
 * <Poster mode="export"> — never the zoomed preview — so the output is identical on phone
 * and desktop. html-to-image and jsPDF are loaded lazily on first use.
 */
import type { Project } from './types';
import { exportFilename } from './schedule';
import { getTheme } from './presets';
import { projectToJson } from './storage';
import { toast, useExportProgress, useUI } from './ui';
import { PAGE_H, PAGE_W } from './autofit';
import { BRAND } from './brand';
import { decodeImages, loadSealDataUrl } from './seal';

/* ------------------------------------------------------------------ */
/* Off-screen node registry                                            */
/* ------------------------------------------------------------------ */

let exportNode: HTMLElement | null = null;
let waiters: ((el: HTMLElement) => void)[] = [];

export function registerExportNode(el: HTMLElement | null) {
  exportNode = el;
  if (el) {
    waiters.forEach((w) => w(el));
    waiters = [];
  }
}

function waitForExportNode(timeout = 5000): Promise<HTMLElement> {
  if (exportNode) return Promise.resolve(exportNode);
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Export node did not mount')), timeout);
    waiters.push((el) => {
      clearTimeout(t);
      resolve(el);
    });
  });
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/* ------------------------------------------------------------------ */
/* Download helpers (with iOS fallbacks)                               */
/* ------------------------------------------------------------------ */

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  if (isIOS()) {
    const file = new File([blob], filename, { type: blob.type });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? 'application/octet-stream';
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/* ------------------------------------------------------------------ */
/* Rasterise                                                           */
/* ------------------------------------------------------------------ */

async function renderImage(project: Project, format: 'png' | 'jpeg'): Promise<string> {
  const setStep = (step: 'fonts' | 'render' | 'build' | 'done') => useExportProgress.setState({ step });
  setStep('fonts');
  await document.fonts.ready;
  // The seal must be an in-memory data URL and fully decoded before capture.
  await loadSealDataUrl().catch(() => undefined);
  const node = await waitForExportNode();
  await nextFrame();
  await nextFrame();
  await decodeImages(node);

  setStep('render');
  const htmlToImage = await import('html-to-image');
  const theme = getTheme(project.design.themeId, project.design.custom);
  const options = {
    pixelRatio: 3,
    width: PAGE_W,
    height: PAGE_H,
    cacheBust: true,
    backgroundColor: theme.canvasBg,
    style: { transform: 'none', left: '0', top: '0', margin: '0' },
    quality: 0.92,
  };
  const fontEmbedCSS = await htmlToImage.getFontEmbedCSS(node, options);
  const render = () =>
    format === 'png'
      ? htmlToImage.toPng(node, { ...options, fontEmbedCSS })
      : htmlToImage.toJpeg(node, { ...options, fontEmbedCSS });
  // Render twice and keep the second result: works around blank first renders in Safari/iOS.
  await render();
  return render();
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

let busy = false;

async function withProgress(kind: 'pdf' | 'png', fn: () => Promise<void>, retry: () => void) {
  if (busy) return;
  busy = true;
  useExportProgress.setState({ active: true, kind, step: 'fonts', error: null });
  try {
    await fn();
    useExportProgress.setState({ step: 'done' });
    await new Promise((r) => setTimeout(r, 450));
    toast('Your timetable is ready. Print it and stick it at your desk! 💪', { tone: 'success', duration: 4500 });
  } catch (e) {
    console.error(e);
    toast(`Export failed — ${(e as Error).message || 'unknown error'}`, {
      tone: 'error',
      action: { label: 'Retry', run: retry },
    });
  } finally {
    useExportProgress.setState({ active: false, kind: null, error: null });
    busy = false;
  }
}

export function exportPdf(project: Project): Promise<void> {
  const quality = useUI.getState().exportQuality;
  return withProgress(
    'pdf',
    async () => {
      const data = await renderImage(project, quality);
      useExportProgress.setState({ step: 'build' });
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      pdf.addImage(data, quality === 'png' ? 'PNG' : 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      const c = project.content;
      pdf.setProperties({
        title: [c.examName, c.titleMain, c.titleGradient].filter(Boolean).join(' · ') || 'Study Timetable',
        author: c.studentName || 'Student',
        subject: c.examName || 'Study timetable',
        creator: `${BRAND.name} Library · Timetable Studio`,
        keywords: `${BRAND.name}, ${BRAND.tagline}, timetable, study plan, A4`,
      });
      const blob = pdf.output('blob');
      await downloadBlob(blob, exportFilename(c, 'pdf'));
    },
    () => void exportPdf(project),
  );
}

export function exportPng(project: Project): Promise<void> {
  return withProgress(
    'png',
    async () => {
      const data = await renderImage(project, 'png');
      useExportProgress.setState({ step: 'build' });
      await downloadBlob(dataUrlToBlob(data), exportFilename(project.content, 'png'));
    },
    () => void exportPng(project),
  );
}

export async function exportJson(project: Project): Promise<void> {
  const blob = new Blob([projectToJson(project)], { type: 'application/json' });
  await downloadBlob(blob, exportFilename(project.content, 'json'));
  toast('Project JSON downloaded', { tone: 'success' });
}

/** Opens the system print dialog; <PrintHost> mounts the 210 × 297 mm print root on `beforeprint`. */
export function printPoster(): void {
  window.print();
}

# Timetable Studio · Learn 4 Success Library

Built for **Learn 4 Success**, a 24×7 self-study library. Students open the site, see the animated
welcome page (`/`), tap **Create My Timetable**, and land in the studio (`/studio/`).

A smart study-timetable generator and **A4 poster studio**. Open it and a complete, print-ready
"Karo-Ya-Maro" master timetable is already on the canvas. Generate a new one from an exam preset
(or from nothing at all), customise every element live, then download a pixel-perfect
**single-page A4 PDF** (210 × 297 mm, 300 DPI), an Ultra-HD PNG (2382 × 3369 px), or print a vector A4 page.

Fully static and client-only (Next.js `output: 'export'`), ready for Netlify.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in ./out (zero TypeScript / ESLint errors)
npm run lint
npm start          # serves ./out locally
```

Requires Node 20+.

## Deploy to Netlify

**Option A: drag and drop.** Run `npm run build`, then drag the `out/` folder onto
<https://app.netlify.com/drop>.

**Option B: Git.** Push this repo and choose "Import from Git" in Netlify. `netlify.toml` already
sets `npm run build`, publish dir `out` and Node 20, so nothing else needs configuring.

## Branding (Learn 4 Success)

To change the library name, logo or quotes, edit `lib/brand.ts` and replace the files in `/public/brand/`.

- `lib/brand.ts` holds the name, tagline, colours, optional address and phone (hidden while empty),
  the rotating welcome-page quotes, and the poster-logo settings.
- `public/brand/l4s-seal-badge.png` is the circular seal (primary logo). It appears on every
  timetable: in the preview, PDF, PNG and print.
- `public/brand/l4s-logo-color.png` is the original logo, used in the welcome-page footer, and
  `favicon-32.png`, `apple-touch-icon.png` and `og-image.png` are generated from these two.
- `posterLogo.locked: true` stops students from hiding, moving or resizing the seal, including
  through JSON imports or share links. Set it to `false` to enable the Design → Library Logo controls.

### Routes

- `/` is the welcome page: animated seal hero, live clock, rotating quotes, exam marquee, why-section,
  live poster preview and how-it-works. It uses `motion`, which loads only on this page.
- `/studio/` is the editor. `/studio/?exam=SSC%20CGL` pre-fills that exam and generates a timetable.
- Share links (`/studio/#share=…`, or `#data=…` on any route) open the shared timetable directly.

## Features

- **Smart generator** (`lib/generator.ts`): pure and deterministic. If every field is blank you get
  the exact default 18-slot schedule. Exam presets cover IBPS/SBI/RBI, SSC/RRB, UPSC/PCS, GATE,
  NEET/JEE, CTET/Super TET/UGC NET, CAT and placements. It adds anchored meal breaks, 10/15-minute
  rests, puts heavy subjects in the morning and RAPID FIRE slots in the evening, always ends with a
  wrap-up, supports windows that cross midnight, and has a "Shuffle variation" button.
- **Full CRUD schedule**: drag-and-drop reordering (mouse, touch long-press, keyboard), swipe
  actions on phones, auto-chained times, overlap/gap/out-of-window validation, a "Fill with break"
  button for gaps, and bulk recolour/sort/fill actions.
- **Click-to-edit canvas**: click a card to open it in the editor, double-click text to edit it
  in place, right-click for a context menu.
- **3 templates × 6 themes, plus custom colours**: Timeline (the reference look), Editorial
  two-column and Minimal Print. You can also choose fonts, density, card style, radius, texture
  toggles and 12h/24h time.
- **Auto-fit to one A4 page** (`lib/autofit.ts`): a hidden measurement node and a binary search
  over a density factor between 0.60 and 1.25, with the two-column split balanced by measured
  height. It handles 4 to 30+ slots.
- **Export** (`lib/export.ts`): always captures a dedicated off-screen 794 × 1123 node, so a PDF
  made on a phone is identical to one made on a desktop. It renders twice to avoid Safari's blank
  first render. On iOS it falls back to the Web Share API or a new tab.
- **Persistence**: localStorage autosave (debounced, zod-validated, with schema migrations),
  multiple profiles, JSON import/export, compressed share links, and 100-step undo/redo that
  groups rapid typing into one step.
- **Responsive**: phone layout with a bottom tab bar and a draggable sheet, tablet layout with a
  bottom panel, laptop two-pane, desktop three-pane with an inspector, and an ultrawide compare
  view. App light/dark mode, ⌘K command palette and a full set of keyboard shortcuts (press `?`).

## Fonts

All fonts are self-hosted from npm (`@fontsource`) and bundled at build time: Plus Jakarta Sans,
Inter, Poppins, Space Grotesk, JetBrains Mono, Noto Sans Devanagari, Anton and Oswald. Because they
are same-origin files, `html-to-image` can embed them into exports with no CORS problems, and the
build never needs network access to Google Fonts. Every poster font stack ends with
`var(--font-devanagari)`, so Hindi (करो या मरो) renders correctly everywhere, including in PDFs.

## Project structure

```
app/                 layout (fonts, metadata), page, globals.css (tokens, poster CSS, @page/print)
components/poster/   Poster (pure renderer), templates/, StudyCard, BreakRow, header/KPI/footer/milestones
components/editor/   Setup, Schedule, SlotEditor, Header & Footer, Design, Export tabs
components/studio/   Toolbar, Sidebar, TabNav, CanvasStage, Inspector, CompareView, MobileBar,
                     BottomSheet, CommandPalette, ResponsiveShell, Hosts (measure/export/print), Shortcuts
components/ui/       Button, Input, TextArea, Select, SegmentedControl, Switch, Slider, Stepper,
                     TimePicker, ColorPicker, IconPicker, Popover, Dialog, Sheet, Toast, Tooltip, …
hooks/               useBreakpoint, useFitZoom, usePinchZoom, useVisualViewport
lib/                 types, defaults, presets, generator, schedule, time, autofit, export,
                     storage, store, ui, actions, icons
```

## Printing tips

For an exact A4 page from the Print button: set **Margins: None**, turn off **Headers & footers**
and turn on **Background graphics**. Choosing "Save as PDF" in the print dialog produces a vector PDF.

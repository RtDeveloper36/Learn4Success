import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
/* Fonts are self-hosted from npm (@fontsource) and bundled at build time: same-origin files,
   so html-to-image can embed them into exports without CORS problems. */
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource-variable/inter/wght.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fontsource-variable/space-grotesk/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '@fontsource-variable/noto-sans-devanagari/wght.css';
import '@fontsource/anton/400.css';
import '@fontsource-variable/oswald/wght.css';
import './globals.css';

const title = 'Timetable Studio · Learn 4 Success Library';
const description =
  'Learn 4 Success 24×7 Self-Study Library — build your personal study timetable in under a minute, then print a perfect A4 PDF for your desk.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.URL ?? 'http://localhost:3000'),
  title,
  description,
  applicationName: 'Timetable Studio',
  icons: {
    icon: [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title,
    description,
    type: 'website',
    siteName: 'Learn 4 Success · Timetable Studio',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Learn 4 Success 24×7 Self-Study Library seal' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
};

/** Applies the saved app theme before first paint to avoid a light/dark flash. */
const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem('timetable-studio:pref:appTheme')||'"system"');var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Script id="app-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import {
  Bricolage_Grotesque,
  Plus_Jakarta_Sans,
  Source_Serif_4,
  Space_Mono,
} from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-brutal',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Presentasi Interaktif',
  description:
    'Web presentasi interaktif dengan canvas bebas, kartu dropdown, popup modal, tema Brutalis & Auditor, ekspor HTML mandiri, dan Asisten AI.',
  openGraph: {
    title: 'Presentasi Interaktif',
    description:
      'Web presentasi interaktif dengan canvas bebas, kartu dropdown, popup modal, tema Brutalis & Auditor, ekspor HTML mandiri, dan Asisten AI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Presentasi Interaktif',
    description:
      'Web presentasi interaktif dengan canvas bebas, kartu dropdown, popup modal, tema Brutalis & Auditor, ekspor HTML mandiri, dan Asisten AI.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      data-theme="brutal"
      className={`${bricolage.variable} ${jakarta.variable} ${sourceSerif.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

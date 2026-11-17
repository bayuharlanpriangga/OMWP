import type { Metadata } from 'next';
import {
  Bricolage_Grotesque,
  Chakra_Petch,
  IBM_Plex_Sans,
  JetBrains_Mono,
  Lora,
  Orbitron,
  Plus_Jakarta_Sans,
  Rajdhani,
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

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-astro-display',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-orias-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hacker',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-orias-serif',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-cyber-display',
  display: 'swap',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-cyber-body',
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
    'Web presentasi interaktif dengan canvas bebas, kartu dropdown, popup modal, tema Default, Brutalis, Auditor, Cyberpunk, Hacker & Astronomi, ekspor HTML mandiri, dan Orias AI.',
  openGraph: {
    title: 'Presentasi Interaktif',
    description:
      'Web presentasi interaktif dengan canvas bebas, kartu dropdown, popup modal, tema Default, Brutalis, Auditor, Cyberpunk, Hacker & Astronomi, ekspor HTML mandiri, dan Orias AI.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Presentasi Interaktif',
    description:
      'Web presentasi interaktif dengan canvas bebas, kartu dropdown, popup modal, tema Default, Brutalis, Auditor, Cyberpunk, Hacker & Astronomi, ekspor HTML mandiri, dan Orias AI.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      data-theme="default"
      className={`${bricolage.variable} ${chakraPetch.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} ${lora.variable} ${orbitron.variable} ${rajdhani.variable} ${jakarta.variable} ${sourceSerif.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

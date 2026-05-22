import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Orbitron } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

const orbitron = Orbitron({
  variable: '--font-orbitron',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://suture.edycu.dev'),
  title: {
    default: 'Suture — Your pipelines heal themselves',
    template: '%s | Suture',
  },
  description:
    'Autonomous AI agent that detects broken Fivetran syncs caused by schema drift and self-heals in under 60 seconds.',
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'Suture — Your pipelines heal themselves',
    description:
      'Autonomous AI agent that detects broken Fivetran syncs caused by schema drift and self-heals in under 60 seconds.',
    url: 'https://suture.edycu.dev',
    siteName: 'Suture',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Suture — Autonomous Pipeline Healing' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suture — Your pipelines heal themselves',
    description:
      'Autonomous AI agent that detects broken Fivetran syncs caused by schema drift and self-heals in under 60 seconds.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0e1a] text-[#f1f5f9] flex flex-col">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://suture.edycu.dev'),
  title: 'Suture — Your pipelines heal themselves',
  description: 'Autonomous AI agent that detects broken Fivetran syncs caused by schema drift and self-heals the pipeline.',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Suture — Your pipelines heal themselves',
    description: 'Autonomous AI agent that detects broken Fivetran syncs caused by schema drift and self-heals the pipeline.',
    url: 'https://suture.edycu.dev',
    siteName: 'Suture',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Suture',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suture — Your pipelines heal themselves',
    description: 'Autonomous AI agent that detects broken Fivetran syncs caused by schema drift and self-heals the pipeline.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

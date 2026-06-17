import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastContainer } from '../components/ui/toast'
import PwaSetup from '../components/pwa-setup'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchr.com.ng';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#059669',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Pitchr — AI Proposals for Nigerian Freelancers',
    template: '%s — Pitchr',
  },
  description: 'Pitchr — AI proposals for Nigerian freelancers. Write winning Upwork and Fiverr proposals in 30 seconds. No subscription needed. Pay as you go.',
  keywords: ['AI proposals', 'Upwork proposals', 'Fiverr proposals', 'freelance proposal generator', 'Nigerian freelancers', 'proposal writer', 'AI cover letter', 'freelance tools Nigeria'],
  authors: [{ name: 'Pitchr' }],
  creator: 'Pitchr',
  publisher: 'Pitchr',
  category: 'AI Proposal Generator',
  manifest: '/manifest.json',
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/images/P.png',
    apple: '/icons/icon-192x192.png',
    shortcut: '/images/P.png',
  },
  openGraph: {
    siteName: 'Pitchr',
    type: 'website',
    locale: 'en_NG',
    title: 'Pitchr — AI Proposals for Nigerian Freelancers',
    description: 'Write winning Upwork and Fiverr proposals in 30 seconds. No templates, no clichés. Pay as you go from ₦500.',
    url: SITE_URL,
    images: [
      {
        url: '/images/P.png',
        width: 512,
        height: 512,
        alt: 'Pitchr',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pitchr',
    creator: '@pitchr',
    title: 'Pitchr — AI Proposals for Nigerian Freelancers',
    description: 'Write winning Upwork and Fiverr proposals in 30 seconds. Pay as you go from ₦500.',
    images: ['/images/P.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('pitchr_theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`
        }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {children}
        <PwaSetup />
        <ToastContainer />
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '../components/ui/toast'
import PwaSetup from '../components/pwa-setup'

export const metadata: Metadata = {
  title: 'Pitchr - AI Proposals for Nigerian Freelancers',
  description: 'Pitchr — AI proposals for Nigerian freelancers. Write winning Upwork and Fiverr proposals in 30 seconds. No subscription needed. Pay as you go.',
  manifest: '/manifest.json',
  themeColor: '#059669',
  icons: {
    icon: '/images/P.png',
  },
}

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

'use client';
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useUserStore } from '../../store/userStore'
import { useSessionStore } from '../../store/sessionStore'
import ThemeToggle from '../../components/ui/theme-toggle'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/proposals', label: 'Proposals', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/dashboard/subscription', label: 'Plan', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { firstName } = useUserStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 dark:from-background dark:via-background dark:to-background">
      <header className="bg-white/80 dark:bg-background/80 backdrop-blur-sm border-b border-brand-100 dark:border-brand-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/images/P.png" alt="Pitchr logo" width={22} height={22} className="rounded" />
              <span className="text-lg font-bold text-brand-600 tracking-tight">Pitchr</span>
            </Link>
            <span className="hidden sm:block text-sm text-muted-foreground">
              {firstName ? `${firstName}'s workspace` : 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/session" className="inline-flex items-center gap-1.5 bg-brand-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span className="hidden sm:inline">New Proposal</span>
            </Link>
            <button
              onClick={() => {
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signout`, { method: 'POST', credentials: 'include' });
                useSessionStore.getState().clearSession();
                window.location.href = '/auth/login';
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
            <ThemeToggle className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:shadow-md hover:border-brand-300 transition-all shrink-0" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <nav className="flex gap-1 mb-8 overflow-x-auto pb-2">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-brand-50 dark:hover:bg-brand-900/50'
                }`}
              >
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={icon}/>
                </svg>
                {label}
              </Link>
            )
          })}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  )
}

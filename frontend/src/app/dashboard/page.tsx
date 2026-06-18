'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '../../store/userStore';
import { useSessionStore } from '../../store/sessionStore';
import { fetchActiveSession } from '../../lib/api';

interface Proposal {
  id: string;
  job_description: string;
  platform: string;
  created_at: string;
}

export default function DashboardPage() {
  const { firstName, lastName, email, subscriptionTier, proposalCount, proposalLimit, setUser } = useUserStore();
  const { plan: sessionPlan, expiresAt, proposalsUsed, proposalsLimit } = useSessionStore();
  const [recentProposals, setRecentProposals] = useState<Proposal[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, { credentials: 'include' }).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/proposals`, { credentials: 'include' }).then(r => r.json()),
      fetchActiveSession(),
    ]).then(([userData, proposalsData, session]) => {
      if (cancelled) return;
      if (userData.user) {
        const u = userData.user;
        setUser(u.id, u.email, u.first_name || null, u.last_name || null, u.subscription_tier, u.proposal_count_this_month || 0, u.proposal_limit_this_month || 0, u.billing_period);
      }
      if (session) {
        const s = useSessionStore.getState();
        s.setSession(session.token, session.plan, session.expiresAt, session.proposalsLimit);
      }
      setRecentProposals((proposalsData.proposals || []).slice(0, 5));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [setUser]);

  const displayName = firstName
    ? `${firstName}${lastName ? ` ${lastName}` : ''}`
    : email?.split('@')[0] || 'Freelancer';

  const hasSession = sessionPlan && expiresAt && Date.now() < expiresAt;
  const hasSubscription = subscriptionTier !== 'free';
  const sessionRemaining = hasSession ? proposalsLimit - proposalsUsed : 0;
  const subRemaining = hasSubscription && proposalLimit > 0 ? proposalLimit - proposalCount : -1;

  const tierColors: Record<string, string> = {
    free: 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300',
    starter: 'bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300',
    pro: 'bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300',
  };

  const sessionColors = 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300';

  const activePlanLabel = hasSubscription
    ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1) + ' Plan'
    : hasSession
    ? `${sessionPlan === 'flash' ? 'Flash' : 'Power'} Session`
    : 'Free';

  const activePlanColor = hasSubscription
    ? tierColors[subscriptionTier] || tierColors.free
    : hasSession
    ? sessionColors
    : tierColors.free;

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {displayName}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {hasSession ? `${sessionRemaining} proposals remaining in your session` : hasSubscription ? proposalLimit > 0 ? `${subRemaining} proposals remaining this month` : 'Unlimited proposals this month' : `${proposalCount} proposals generated this month`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/50 flex items-center justify-center shrink-0">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Proposals</p>
              <p className="text-2xl font-bold text-foreground">{proposalCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${hasSession ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-teal-50 dark:bg-teal-900/30'}`}>
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${hasSession ? 'text-indigo-600' : 'text-teal-600'}`}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Plan</p>
              <p className={`text-sm font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${activePlanColor}`}>
                {activePlanLabel}
              </p>
              {hasSession && (
                <p className="text-xs text-muted-foreground mt-1">{sessionRemaining} / {proposalsLimit} left</p>
              )}
              {hasSubscription && (
                <p className="text-xs text-muted-foreground mt-1">
                  {proposalLimit > 0 ? `${subRemaining} / ${proposalLimit} left this month` : 'Unlimited'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Usage</p>
              {proposalLimit > 0 ? (
                <div className="mt-1">
                  <p className="text-sm font-medium">
                    {proposalCount} / {proposalLimit}
                  </p>
                  <div className="w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (proposalCount / proposalLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-lg font-bold text-foreground">
                  {proposalCount}
                  <span className="text-xs text-muted-foreground font-normal ml-1">used</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/session"
          className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-5 text-white hover:from-brand-700 hover:to-brand-800 transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">Generate a Proposal</p>
              <p className="text-brand-100 text-sm mt-1">Start at ₦500 — no subscription needed</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/subscription"
          className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 hover:border-brand-200 dark:hover:border-brand-600 transition-all shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground text-lg">
                {hasSubscription || hasSession ? 'Manage Plan' : 'Get a Plan'}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {hasSubscription ? 'Sessions from ₦500 or change plan' : 'Sessions from ₦500, unlimited from ₦1,500/mo'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Proposals */}
      <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-brand-50 dark:border-brand-800 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent Proposals</h2>
          <Link href="/dashboard/proposals" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
            View all
          </Link>
        </div>
        {recentProposals.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/50 flex items-center justify-center mx-auto mb-3">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">No proposals yet</p>
            <Link href="/session" className="text-brand-600 text-sm font-medium hover:text-brand-700 mt-1 inline-block">
              Generate your first proposal
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-brand-50 dark:divide-brand-800">
            {recentProposals.map((p) => (
              <div key={p.id} className="px-5 py-3 hover:bg-brand-50/50 dark:hover:bg-brand-900/30 transition-colors">
                <p className="text-sm text-foreground truncate">{p.job_description}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-medium capitalize">
                    {p.platform}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

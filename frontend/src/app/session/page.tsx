'use client';
import { useEffect, useState, FormEvent, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSessionStore } from '../../store/sessionStore';
import { useUserStore } from '../../store/userStore';
import { useToastStore } from '../../store/toastStore';
import { useSession } from '../../hooks/useSession';
import { useCopy } from '../../hooks/useCopy';
import { generateProposal, initSessionPayment, fetchActiveSession } from '../../lib/api';
import { Button } from '../../components/ui/button';
import SessionTimer from '../../components/session-timer';
import ThemeToggle from '../../components/ui/theme-toggle';
import { AxiosError } from 'axios';

export default function SessionPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [platform, setPlatform] = useState('upwork');
  const [length, setLength] = useState('standard');
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [pricingTab, setPricingTab] = useState<'session' | 'monthly'>('session');
  const [billingTab, setBillingTab] = useState<'monthly' | 'annual'>('monthly');
  const [profileText, setProfileText] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const { token } = useSessionStore();
  const { hydrated, isValid, remaining } = useSession();
  const subscriptionTier = useUserStore((s) => s.subscriptionTier);
  const proposalLimit = useUserStore((s) => s.proposalLimit);
  const proposalCount = useUserStore((s) => s.proposalCount);
  const setUser = useUserStore((s) => s.setUser);
  const addToast = useToastStore((s) => s.addToast);
  const { copy } = useCopy();
  const profileDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const hasSubscription = subscriptionTier !== 'free';
  const canGenerate = isValid || hasSubscription;

  const displayRemaining = !hydrated
    ? null
    : token
      ? remaining
      : proposalLimit === 0
        ? Infinity
        : Math.max(0, proposalLimit - proposalCount);

  useEffect(() => {
    const stored = localStorage.getItem('pitchr_profile');
    if (stored) {
      try { setProfileText(JSON.parse(stored)); } catch {}
    }
    let cancelled = false;
    Promise.all([
      fetch('/api/user', { credentials: 'include' }),
      fetchActiveSession(),
    ]).then(async ([userRes, session]) => {
      if (cancelled) return;
      if (userRes.ok) {
        const data = await userRes.json();
        if (data.user) {
          const u = data.user;
          setUser(
            u.id, u.email, u.first_name || null, u.last_name || null,
            u.subscription_tier, u.proposal_count_this_month, u.proposal_limit_this_month
          );
          if (u.profile_text) {
            setProfileText(u.profile_text);
            localStorage.setItem('pitchr_profile', JSON.stringify(u.profile_text));
          }
        }
      } else {
        addToast('Failed to load user data', 'error');
      }
      if (session) {
        useSessionStore.getState().setSession(session.token, session.plan, session.expiresAt, session.proposalsLimit, session.proposalsUsed);
      }
    }).catch(() => {
      if (!cancelled) addToast('Connection error', 'error');
    });
    return () => { cancelled = true; };
  }, [setUser, addToast]);

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (!canGenerate) {
      setShowPricing(true);
      return;
    }
    setLoading(true);
    try {
      const result = await generateProposal({
        job_description: jobDescription,
        platform,
        length,
        session_token: token || undefined,
        profile_text: profileText || undefined,
      });
      setProposal(result.proposal);
      if (token) {
        useSessionStore.getState().incrementUsed();
      }
      addToast('Proposal generated successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof AxiosError ? err.response?.data?.message : 'Failed to generate proposal';
      addToast(message || 'Failed to generate proposal', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(planName: string) {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/init-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName.toLowerCase(), billing_period: billingTab }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.payment_link) {
        window.location.href = data.payment_link;
      } else {
        addToast(data.message || 'Failed to initiate subscription', 'error');
      }
    } catch {
      addToast('Connection error', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuySession(plan: 'flash' | 'power') {
    const userEmail = useUserStore.getState().email || '';
    try {
      const result = await initSessionPayment(plan, userEmail);
      window.location.href = result.payment_link;
    } catch (err: unknown) {
      const message = err instanceof AxiosError ? err.response?.data?.message : 'Payment failed';
      addToast(message || 'Payment failed', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50 dark:from-background dark:via-background dark:to-background">
      {/* Header */}
      <header className="bg-white/80 dark:bg-background/80 backdrop-blur-sm border-b border-brand-100 dark:border-brand-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/P.png" alt="Pitchr" width={20} height={20} className="rounded" />
              <span className="font-bold text-brand-600">Pitchr</span>
            </Link>
            <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {canGenerate && hydrated && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                  <span className="text-muted-foreground">
                    {displayRemaining === Infinity ? 'Unlimited' : `${displayRemaining} proposal${displayRemaining !== 1 ? 's' : ''} remaining`}
                  </span>
                </div>
                {token && (
                  <>
                    <span className="text-muted-foreground/30">|</span>
                    <SessionTimer />
                  </>
                )}
              </div>
            )}
            <ThemeToggle className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:shadow-md hover:border-brand-300 transition-all shrink-0" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {!showPricing ? (
          <>
            {/* Session Active Banner */}
            {canGenerate && hydrated && (
              <div className="mb-6 p-4 bg-brand-50 dark:bg-brand-900/50 border border-brand-100 dark:border-brand-800 rounded-xl text-sm text-brand-800 dark:text-brand-200 flex items-center gap-3">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600 shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                {displayRemaining === Infinity ? 'Unlimited proposals' : `${displayRemaining} proposal${displayRemaining !== 1 ? 's' : ''} left`}
              </div>
            )}

            {/* Proposal Form */}
            <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-6 shadow-sm">
              <h1 className="text-xl font-semibold text-foreground mb-1">Generate Proposal</h1>
              <p className="text-sm text-muted-foreground mb-6">Paste a job description and get a winning proposal</p>

              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Freelancer Profile */}
                <div className="border border-brand-100 dark:border-brand-800 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-brand-50/50 dark:hover:bg-brand-900/30 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      Your Profile
                      {profileText.trim() ? (
                        <span className="text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/50 px-2 py-0.5 rounded-full">Profile saved</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Optional</span>
                      )}
                    </span>
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {profileOpen && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Paste your freelancer profile — experience, key skills, notable results with numbers, and background. The AI uses this to personalize your proposals.
                      </p>
                       <textarea
                         value={profileText}
                         onChange={(e) => {
                           setProfileText(e.target.value);
                           if (profileDebounceRef.current) clearTimeout(profileDebounceRef.current);
                           profileDebounceRef.current = setTimeout(() => {
                             localStorage.setItem('pitchr_profile', JSON.stringify(e.target.value));
                           }, 300);
                         }}
                        className="w-full h-28 p-3 border border-input rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand-500 transition-shadow text-sm bg-white dark:bg-card"
                        placeholder="4 years React/Node.js developer. Cut load times 85% for a fintech. Built dashboards used by 500+ daily users..."
                      />
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {profileText.length}/5000
                        </span>
                        {!profileText.trim() && (
                          <span className="text-xs text-amber-600">Results with numbers make proposals more convincing</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full h-40 p-3 border border-input rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand-500 transition-shadow text-sm bg-white dark:bg-card"
                    placeholder="Paste the job description from Upwork or Fiverr..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Platform</label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand-500 transition-shadow bg-white dark:bg-card"
                    >
                      <option value="upwork">Upwork</option>
                      <option value="fiverr">Fiverr</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Length</label>
                    <select
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full p-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand-500 transition-shadow bg-white dark:bg-card"
                    >
                      <option value="short">Short</option>
                      <option value="standard">Standard</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg aria-hidden="true" className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Generating...
                    </span>
                  ) : canGenerate ? 'Generate Proposal' : 'Unlock Proposal — Purchase Session'}
                </Button>
              </form>
            </div>

            {/* Proposal Output */}
            {proposal && (
              <div className="mt-6 bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                    </svg>
                    <h3 className="font-semibold text-foreground">Your Proposal</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copy(proposal, 'Proposal copied')}>
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setProposal('')}>
                      New
                    </Button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80 font-sans bg-muted/30 rounded-lg p-4 border border-border">
                  {proposal}
                </pre>
              </div>
            )}
          </>
        ) : (
          /* Pricing Modal */
          <div className="max-w-lg mx-auto py-8">
            <button
              onClick={() => setShowPricing(false)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to form
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">Unlock Proposal Generation</h2>
              <p className="text-muted-foreground text-sm mt-1">Choose a plan to start generating proposals</p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              <button
                onClick={() => setPricingTab('session')}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  pricingTab === 'session' ? 'bg-brand-600 text-white shadow-sm' : 'bg-muted text-muted-foreground'
                }`}
              >
                Session
              </button>
              <button
                onClick={() => setPricingTab('monthly')}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  pricingTab === 'monthly' ? 'bg-brand-600 text-white shadow-sm' : 'bg-muted text-muted-foreground'
                }`}
              >
                Monthly
              </button>
            </div>

            {pricingTab === 'session' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Flash</p>
                  <p className="text-3xl font-bold text-foreground">₦500</p>
                  <p className="text-xs text-muted-foreground mb-3">5 proposals · 30 min</p>
                  <ul className="text-xs text-muted-foreground space-y-1.5 mb-5 flex-1 list-disc list-inside">
                    <li>5 AI proposals written from your job</li>
                    <li>Upwork & Fiverr optimized formats</li>
                    <li>Results in under 30 seconds</li>
                  </ul>
                    <Button className="w-full" variant="secondary" onClick={() => handleBuySession('flash')}>
                      Get Flash
                    </Button>
                  </div>
                  <div className="bg-white dark:bg-card border-2 border-brand-500 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-3 py-0.5 rounded-full font-medium">
                      Popular
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Power</p>
                    <p className="text-3xl font-bold text-foreground">₦1,200</p>
                    <p className="text-xs text-muted-foreground mb-3">20 proposals · 4 hours</p>
                    <ul className="text-xs text-muted-foreground space-y-1.5 mb-5 flex-1 list-disc list-inside">
                      <li>20 AI proposals tailored to each job</li>
                      <li>Re-spin for different hooks and angles</li>
                      <li>Upwork & Fiverr optimized formats</li>
                      <li>Priority generation speed</li>
                      <li>4-hour window — use at your pace</li>
                    </ul>
                    <Button className="w-full" onClick={() => handleBuySession('power')}>
                      Get Power
                    </Button>
                  </div>
                </div>
            ) : (
              <div>
                <div className="flex items-center justify-center mb-6">
                  <div className="inline-flex bg-muted rounded-lg p-0.5">
                    <button onClick={() => setBillingTab('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${billingTab === 'monthly' ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Monthly</button>
                    <button onClick={() => setBillingTab('annual')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${billingTab === 'annual' ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Annual</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { plan: 'Starter', price: billingTab === 'annual' ? '₦15k' : '₦1.5k', annualNote: 'Save ₦3,000', features: ['30 proposals written from your profile', 'Upwork & Fiverr optimized', 'Re-spin for fresh angles', 'Email support'], subLabel: billingTab === 'annual' ? '/yr' : '/mo' },
                    { plan: 'Pro', price: billingTab === 'annual' ? '₦35k' : '₦3.5k', annualNote: 'Save ₦7,000', features: ['Unlimited proposals — no caps', 'All platforms supported', 'Priority speed', 'Priority support'], subLabel: billingTab === 'annual' ? '/yr' : '/mo' },
                  ].map(({ plan, price, annualNote, features, subLabel }) => (
                    <div key={plan} className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{plan}</p>
                      <p className="text-xl font-bold mt-1 text-foreground">{price}<span className="text-xs font-normal text-muted-foreground">{subLabel}</span></p>
                      {billingTab === 'annual' && <p className="text-xs text-brand-600 font-medium">{annualNote}</p>}
                      <ul className="text-xs text-muted-foreground mt-3 space-y-1.5 text-left list-disc list-inside">
                        {features.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                      <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => handleSubscribe(plan)} disabled={loading}>Subscribe</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

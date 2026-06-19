'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSessionStore } from '../../../store/sessionStore';
import { useToastStore } from '../../../store/toastStore';
import { useUserStore } from '../../../store/userStore';

interface Plan {
  id: string;
  name: string;
  price?: string;
  monthlyPrice?: string;
  annualPrice?: string;
  annualNote?: string;
  label?: string;
  annualLabel?: string;
  proposals: string;
  features: string[];
  popular?: boolean;
}

const SESSION_PLANS: Plan[] = [
  {
    id: 'flash',
    name: 'Flash Session',
    price: '₦500',
    label: 'one-time',
    proposals: '5 proposals',
    features: ['5 AI proposals written from your job', 'Upwork & Fiverr optimized formats', 'Results in under 30 seconds', '30-minute access window'],
  },
  {
    id: 'power',
    name: 'Power Session',
    price: '₦1,200',
    label: 'one-time',
    proposals: '20 proposals',
    features: ['20 AI proposals tailored to each job', 'Re-spin for different hooks and angles', 'Upwork & Fiverr optimized formats', 'Priority generation speed', '4-hour window — use at your pace'],
    popular: true,
  },
];

const SUBSCRIPTION_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: '₦1,500',
    annualPrice: '₦15,000',
    annualNote: 'Save ₦3,000',
    label: 'per month',
    annualLabel: 'per year',
    proposals: '30 proposals/month',
    features: ['30 AI proposals written from your profile', 'Upwork & Fiverr optimized formats', 'Re-spin any proposal for a fresh angle', 'Email support', 'Save ₦3,000 with annual billing'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: '₦3,500',
    annualPrice: '₦35,000',
    annualNote: 'Save ₦7,000',
    label: 'per month',
    annualLabel: 'per year',
    proposals: 'Unlimited proposals',
    features: ['Unlimited proposals — zero caps', 'All freelance platforms supported', 'Priority speed — fastest generation', 'Priority support — replies within hours', 'Save ₦7,000 with annual billing'],
    popular: true,
  },
];

const SESSION_IDS = SESSION_PLANS.map(p => p.id);
const SUBSCRIPTION_IDS = SUBSCRIPTION_PLANS.map(p => p.id);

function SubscriptionInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const subscriptionTier = useUserStore((s) => s.subscriptionTier);

  const reference = searchParams.get('reference');
  const hasRef = typeof reference === 'string' && reference.length > 0;

  const [tab, setTab] = useState<'session' | 'monthly'>('session');
  const [billingTab, setBillingTab] = useState<'monthly' | 'annual'>('monthly');
  const [selected, setSelected] = useState('flash');
  const [buying, setBuying] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [payStatus, setPayStatus] = useState<'processing' | 'session_ok' | 'sub_ok' | 'error' | null>(hasRef ? 'processing' : null);
  const [payError, setPayError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10;

  useEffect(() => {
    if (reference) return;
    (async () => {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (!res.ok) {
          addToast('Please sign in to continue', 'info');
          router.push('/auth/login');
          return;
        }
      } catch {
        router.push('/auth/login');
      }
    })();
  }, [reference, router, addToast]);

  useEffect(() => {
    if (!reference) return;

    const isFlash = reference.startsWith('PROP_flash');
    const isPower = reference.startsWith('PROP_power');
    const isSub = reference.startsWith('PROP_SUB_');

    if (!isFlash && !isPower && !isSub) {
      setPayStatus('error');
      setPayError('Invalid payment reference.');
      return;
    }

    (async () => {
      // Retry up to 10 times with 3s delay (~30s max) for payment verification
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 3000));
        try {
        if (isFlash || isPower) {
          const res = await fetch('/api/sessions/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference }),
            credentials: 'include',
          });
          const data = await res.json();

          if (res.ok) {
            useSessionStore.getState().setSession(data.token, data.plan, data.expiresAt, data.limit);
            setPayStatus('session_ok');
            addToast('Session activated!', 'success');
          } else {
            const msg = data.message || 'Payment could not be verified.';
            const isPending = msg.toLowerCase().includes('pending');
            if (isPending && attempt < MAX_RETRIES - 1) {
              setRetryCount(attempt + 1);
              continue;
            }
            setPayError(msg);
            setPayStatus('error');
          }
          return;
        }

        if (isSub) {
          const res = await fetch('/api/payments/confirm-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference }),
            credentials: 'include',
          });
          const data = await res.json();

          if (res.ok) {
            if (data.user) {
              const u = data.user;
              setUser(
                u.id, u.email, u.first_name || null, u.last_name || null,
                u.subscription_tier, u.proposal_count_this_month, u.proposal_limit_this_month, u.billing_period
              );
            }
            setPayStatus('sub_ok');
            addToast('Subscription activated!', 'success');
          } else {
            const msg = data.message || 'Payment could not be verified.';
            const isPending = msg.toLowerCase().includes('pending');
            if (isPending && attempt < MAX_RETRIES - 1) {
              setRetryCount(attempt + 1);
              continue;
            }
            setPayError(msg);
            setPayStatus('error');
          }
        }
        return;
        } catch {
          if (attempt < MAX_RETRIES - 1) {
            setRetryCount(attempt + 1);
            continue;
          }
          setPayError('Connection error verifying payment.');
          setPayStatus('error');
        }
      }
    })();
  }, [reference, router, addToast, setUser]);

  function handleTabChange(newTab: 'session' | 'monthly') {
    setTab(newTab);
    const ids = newTab === 'session' ? SESSION_IDS : SUBSCRIPTION_IDS;
    if (!ids.includes(selected)) setSelected(ids[0]);
  }

  async function handleBuySession(plan: string) {
    setBuying(plan);
    try {
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, { credentials: 'include' });
      const userData = await userRes.json();
      const email = userData.user?.email;
      if (!email) { router.push('/auth/login'); return; }

      const payRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/init-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email }),
        credentials: 'include',
      });
      const payData = await payRes.json();
      if (payData.payment_link) window.location.href = payData.payment_link;
    } catch {
      addToast('Failed to initiate payment', 'error');
    } finally {
      setBuying(null);
    }
  }

  async function handleSubscribe(plan: string) {
    setBuying(plan);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/init-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing_period: billingTab }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.payment_link) window.location.href = data.payment_link;
    } catch {
      addToast('Failed to initiate subscription', 'error');
    } finally {
      setBuying(null);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Cancel your subscription? You will lose access at the end of the current billing period.')) return;
    setCancelling(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/cancel-subscription`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        addToast('Subscription cancelled', 'success');
        clearUser();
      } else {
        addToast('Failed to cancel subscription', 'error');
      }
    } catch {
      addToast('Connection error', 'error');
    } finally {
      setCancelling(false);
    }
  }

  // --- Payment confirmation states ---

  if (payStatus === 'processing') {
    return (
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-8 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
          <svg aria-hidden="true" className="animate-spin h-7 w-7 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Verifying your payment...</h2>
        <p className="text-sm text-muted-foreground">Please wait while we confirm your payment with Flutterwave.{retryCount > 0 ? ` (Attempt ${retryCount}/${MAX_RETRIES})` : ''}</p>
      </div>
    );
  }

  if (payStatus === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Payment Not Confirmed</h2>
        <p className="text-sm text-muted-foreground mb-6">{payError || 'Your payment could not be verified. If you were charged, contact support.'}</p>
        <button
          onClick={() => { setPayStatus(null); setPayError(''); }}
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (payStatus === 'session_ok') {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-8 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Session Activated!</h2>
        <p className="text-sm text-muted-foreground mb-6">Your session is ready. Head to the proposal generator to start.</p>
        <button
          onClick={() => router.push('/session')}
          className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors"
        >
          Start Generating
        </button>
      </div>
    );
  }

  if (payStatus === 'sub_ok') {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-8 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Subscription Active!</h2>
        <p className="text-sm text-muted-foreground mb-6">Your plan is now live — start generating winning proposals.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // --- Normal plans view ---

  const plans = tab === 'session' ? SESSION_PLANS : SUBSCRIPTION_PLANS;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Choose Your Plan</h1>
        <p className="text-sm text-muted-foreground mt-1">Pick the plan that works best for your freelance business</p>
      </div>

      {/* Toggle */}
      <div className="flex gap-1 mb-8 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => handleTabChange('session')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'session' ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Session
        </button>
        <button
          onClick={() => { handleTabChange('monthly'); setBillingTab('monthly'); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'monthly' ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Billing toggle (monthly only) */}
      {tab === 'monthly' && (
        <div className="flex gap-1 mb-8 p-1 bg-muted rounded-lg w-fit">
          <button
            onClick={() => setBillingTab('monthly')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              billingTab === 'monthly' ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingTab('annual')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              billingTab === 'annual' ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white dark:bg-card border rounded-xl p-6 flex flex-col transition-all cursor-pointer ${
              selected === plan.id
                ? 'border-brand-500 ring-1 ring-brand-500 shadow-md'
                : 'border-brand-100 hover:border-brand-200 hover:shadow-sm'
            } ${plan.popular ? 'relative' : ''}`}
            onClick={() => setSelected(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-4 py-0.5 rounded-full font-medium">
                Most Popular
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{plan.name}</p>
              {tab === 'session' ? (
                <>
                  <p className="text-3xl font-bold mt-2 text-foreground">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.label}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{plan.proposals}</p>
                </>
              ) : billingTab === 'annual' ? (
                <>
                  <p className="text-3xl font-bold mt-2 text-foreground">
                    {plan.annualPrice}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.annualLabel}</span>
                  </p>
                  <p className="text-xs text-brand-600 font-medium mt-0.5">{plan.annualNote}</p>
                  <p className="text-xs text-muted-foreground mt-1">{plan.proposals}</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold mt-2 text-foreground">
                    {plan.monthlyPrice}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.label}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{plan.proposals}</p>
                </>
              )}
            </div>

            <div className="flex-1 mb-6">
              <ul className="space-y-2.5">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-foreground/80">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-500 mt-0.5 shrink-0">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <button
              disabled={buying === plan.id || (tab === 'monthly' && subscriptionTier !== 'free')}
              onClick={(e) => {
                e.stopPropagation();
                if (tab === 'session') handleBuySession(plan.id);
                else if (subscriptionTier === 'free') handleSubscribe(plan.id);
              }}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === 'monthly' && subscriptionTier !== 'free'
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : selected === plan.id
                    ? 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md active:scale-[0.98] disabled:opacity-60'
                    : 'bg-white dark:bg-card text-foreground border border-input hover:bg-brand-50 dark:hover:bg-brand-900/50 hover:border-brand-200 active:scale-[0.98] disabled:opacity-60'
              }`}
            >
              {buying === plan.id ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Processing...
                </span>
              ) : tab === 'monthly' && subscriptionTier !== 'free' ? (
                'Cancel current plan first'
              ) : (
                tab === 'session' ? `Buy ${plan.name}` : `Subscribe to ${plan.name}`
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Cancel Subscription */}
      {subscriptionTier !== 'free' && (
        <div className="mt-10 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground mb-2">Manage Subscription</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You are currently on the <strong className="text-foreground capitalize">{subscriptionTier}</strong> plan.
          </p>
          <button
            onClick={handleCancelSubscription}
            disabled={cancelling}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
          >
            {cancelling ? 'Cancelling...' : 'Cancel subscription'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <SubscriptionInner />
    </Suspense>
  );
}

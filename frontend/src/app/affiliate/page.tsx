'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AffiliateStats {
  code: string;
  marketer_name: string;
  type: string;
  rate: number;
  signups: number;
  total_revenue: number;
  commission_owed: number;
}

const HOW_IT_WORKS = [
  { step: '01', title: 'Share your link', desc: 'Send your unique referral link to freelancers who need help writing proposals.' },
  { step: '02', title: 'They sign up and pay', desc: 'When someone creates an account through your link and makes a payment, you earn.' },
  { step: '03', title: 'Get paid your commission', desc: 'Affiliates earn 5%. Marketers earn 10%. Track your earnings anytime.' },
];

export default function AffiliatePage() {
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setStats(null);
    try {
      const res = await fetch(`/api/affiliate/${code.trim().toLowerCase()}`);
      if (res.ok) {
        setStats(await res.json());
      } else {
        setError('Referral code not found. Check and try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!stats) return;
    const link = `https://pitchr.com.ng?ref=${stats.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ─── NAV ─── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/P.png" alt="Pitchr logo" width={22} height={22} className="rounded" />
            <span className="font-bold text-lg tracking-tight text-brand-600">Pitchr</span>
          </Link>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-24 md:pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            Affiliate Program
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15] mb-4">
            Earn while you share.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Share Pitchr with freelancers. When they sign up and pay through your link, you earn a commission on every naira they spend. No caps, no limits.
          </p>
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Affiliates earn 5%
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Marketers earn 10%
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Track earnings anytime
            </span>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-16 md:py-20 bg-muted/50 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-2">How it works</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Three steps to earning.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-bold mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CHECK EARNINGS ─── */}
      <section id="check" className="py-16 md:py-20">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Check your earnings</h2>
            <p className="text-sm text-muted-foreground">Enter your referral code to see your signups, revenue, and commission.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your referral code"
                className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand-500 bg-white dark:bg-card"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          {stats && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground">{stats.marketer_name}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${stats.type === 'marketer' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'}`}>
                    {stats.type === 'marketer' ? 'Marketer' : 'Affiliate'} · {stats.rate}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Code: {stats.code}</p>

                <div className="flex items-center gap-2 p-3 bg-muted/60 rounded-lg">
                  <code className="text-xs text-foreground truncate flex-1 select-all">pitchr.com.ng?ref={stats.code}</code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-card border border-border rounded-xl p-4 text-center">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <p className="text-xl font-bold text-foreground">{stats.signups}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Signups</p>
                </div>
                <div className="bg-white dark:bg-card border border-border rounded-xl p-4 text-center">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <p className="text-xl font-bold text-foreground">₦{stats.total_revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Revenue</p>
                </div>
                <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-xl p-4 text-center">
                  <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-800/50 text-brand-700 dark:text-brand-300 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  </div>
                  <p className="text-xl font-bold text-brand-700 dark:text-brand-300">₦{stats.commission_owed.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Commission</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── BECOME AFFILIATE CTA ─── */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-brand-600 to-brand-700">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Want to become an affiliate?</h2>
          <p className="text-brand-100 mb-6">If you know freelancers who need help writing winning proposals, you can earn every time they sign up and pay. Reach out and we will set you up with your own referral code.</p>
          <a
            href="mailto:hello@pitchr.com.ng?subject=Affiliate%20Enquiry"
            className="inline-flex items-center gap-2 bg-white text-brand-700 px-6 py-3 rounded-xl text-sm font-medium hover:bg-brand-50 transition-all shadow-lg"
          >
            Contact Us to Get Started
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-card border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
          <p>&copy; 2026 Pitchr. Built in Lagos, Nigeria.</p>
        </div>
      </footer>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSessionStore } from '../store/sessionStore';
import ThemeToggle from '../components/ui/theme-toggle';
import JsonLd from './json-ld';

function IconSparkles({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M20 16c-2 1-3 3-3 5 0-2-1-4-3-5 2-1 3-3 3-5 0 2 1 4 3 5z"/><path d="M5 13c1 .5 1.5 1.5 1.5 2.5 0-1 .5-2 1.5-2.5-1-.5-1.5-1.5-1.5-2.5 0 1-.5 2-1.5 2.5z"/></svg>;
}
function IconBolt({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function IconDoc({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}
function IconCheck({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IconStar({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function IconClock({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function IconUsers({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconChevronRight({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function IconQuote({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>;
}
function IconRefresh({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
}
function IconBan({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
}
function IconSend({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
}

const FEATURES = [
  { icon: IconSparkles, title: 'AI Built for Upwork & Fiverr', desc: 'Knows the difference between a Fiverr gig pitch and an Upwork cover letter. Writes the right length, tone, and structure for each platform.' },
  { icon: IconDoc, title: 'Writes From Your Real Profile', desc: 'Pulls from your actual experience, not generic templates. Every proposal sounds like you, not like ChatGPT.' },
  { icon: IconBolt, title: '30 Seconds, Not 30 Minutes', desc: 'Paste a job description, pick your platform, and get a ready-to-send proposal. Edit if you want, or send as-is.' },
  { icon: IconRefresh, title: 'Re-Spin Until It Hits', desc: 'Don\u2019t like the angle? Hit re-spin for a different hook, approach, or close. No extra charge.' },
  { icon: IconBan, title: 'No Templates, No Cliches', desc: 'Never starts with \u201CI am passionate\u201D or \u201Clook no further.\u201D Every proposal opens with a specific insight from the job.' },
  { icon: IconClock, title: 'Pay as You Go or Subscribe', desc: 'Try with a single session at \u20A6500. Upgrade to monthly if you\u2019re serious. No lock-in, no surprise charges.' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Paste the listing', desc: 'Copy the job description from Upwork, Fiverr, or anywhere else. Tell us which platform.', icon: IconDoc },
  { step: '02', title: 'AI writes the proposal', desc: 'Pitchr builds the hook, the fit, the approach, and the close using AI and your profile.', icon: IconSparkles },
  { step: '03', title: 'Send and win', desc: 'Review, edit if needed, and send. Land more clients without spending hours writing.', icon: IconSend },
];

const PRICING_SESSION = [
  { name: 'Flash', price: '500', features: ['5 AI proposals written from your job', 'Upwork & Fiverr optimized formats', 'Results in under 30 seconds', '30-minute access window'], badge: null, featured: false },
  { name: 'Power', price: '1,200', features: ['20 AI proposals tailored to each job', 'Re-spin for different hooks and angles', 'Upwork & Fiverr optimized formats', 'Priority generation speed', '4-hour window — use at your pace'], badge: 'Best value', featured: true },
];

const PRICING_MONTHLY = [
  { name: 'Starter', price: '1,500', annualPrice: '15,000', annualNote: 'Save ₦3,000', features: ['30 proposals written from your profile', 'Upwork & Fiverr optimized formats', 'Re-spin any proposal for a fresh angle', 'Email support', 'Save ₦3,000 with annual billing'], badge: null, featured: false },
  { name: 'Pro', price: '3,500', annualPrice: '35,000', annualNote: 'Save ₦7,000', features: ['Unlimited proposals — zero caps', 'All freelance platforms supported', 'Priority speed — fastest generation', 'Priority support — replies within hours', 'Save ₦7,000 with annual billing'], badge: 'Most popular', featured: true },
];

const TESTIMONIALS = [
  { initials: 'AO', name: 'Adaeze O.', role: 'Backend Developer, Lagos', text: 'My reply rate went from one in twenty to one in eight. Same jobs, same rate, different proposal.' },
  { initials: 'CU', name: 'Chidi U.', role: 'Product Designer, Abuja', text: 'I used to spend 45 minutes on every proposal. Now I spend 30 seconds and get better results.' },
  { initials: 'FN', name: 'Fatima N.', role: 'Content Writer, Kano', text: 'Tried it once, got an interview the same day. I haven\u2019t written a proposal from scratch since.' },
];

const FAQS = [
  { q: 'Will clients know this is AI-written?', a: 'Pitchr writes from your real profile and experience, not a template. Always review before sending. If a line doesn\u2019t sound like you, change it.' },
  { q: 'How is this different from ChatGPT?', a: 'ChatGPT doesn\u2019t know how Upwork and Fiverr work. It doesn\u2019t know the character limits, the platform differences, or your work history. Pitchr does, every time.' },
  { q: 'Can I cancel a monthly plan?', a: 'Yes, anytime from your dashboard. You keep access until the end of your paid period.' },
  { q: 'What payment methods are accepted?', a: 'Flutterwave, card, bank transfer, and USSD. Everything in naira. No dollar card needed.' },
  { q: 'Do I need an account to try it?', a: 'Yes. Create a free account, then purchase a session (\u20A6500) or subscribe monthly. Your proposals and payment history are saved to your account.' },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tab, setTab] = useState<'session' | 'monthly'>('session');
  const [billingTab, setBillingTab] = useState<'monthly' | 'annual'>('monthly');
  const token = useSessionStore((s) => s.token);
  const hydrated = useSessionStore((s) => s.hydrated);
  const rehydrate = useSessionStore((s) => s.rehydrate);
  const hasSession = hydrated && token !== null;
  const searchParams = useSearchParams();

  useEffect(() => { setMounted(true); rehydrate(); }, [rehydrate]);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.trim()) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `pitchr_ref=${ref.trim().toLowerCase()}; expires=${expires}; path=/; SameSite=Lax`;
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-background">
      <JsonLd />
      {/* ─── NAV ─── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight text-brand-600">Pitchr</Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/auth/login" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>
            <Link href="/auth/login" className="md:hidden text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            {!mounted ? (
                <Link href="#pricing" className="inline-flex items-center gap-1.5 bg-brand-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-700 transition-all shadow-sm">
                  Try It Now <IconChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : hasSession ? (
                <Link href="/session" className="inline-flex items-center gap-1.5 bg-brand-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-700 transition-all shadow-sm">
                  Continue <IconChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link href="#pricing" className="inline-flex items-center gap-1.5 bg-brand-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-700 transition-all shadow-sm">
                  Try It Now <IconChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            <ThemeToggle className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:shadow-md hover:border-brand-300 transition-all shrink-0" />
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-2">
          <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">Features</Link>
          <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">How It Works</Link>
          <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">Pricing</Link>
          <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2">FAQ</Link>
        </div>
      )}

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 dark:bg-brand-900/30 dark:text-brand-300">
              <IconSparkles className="w-4 h-4" />
              Tailored AI Proposal Generator for Freelancers
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.08] mb-6">
              Write proposals that<br />actually get replies.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Paste a job description. Get a winning proposal written specifically for Upwork or Fiverr. 
              No templates, no cliches, no wasted connects. <strong className="text-foreground">30 seconds.</strong>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!mounted ? (
                <Link href="#pricing" className="inline-flex items-center gap-2 bg-brand-600 text-white px-7 py-3.5 rounded-xl text-base font-medium hover:bg-brand-700 transition-all shadow-md hover:shadow-lg">
                  Generate a Proposal <IconChevronRight className="w-4 h-4" />
                </Link>
              ) : hasSession ? (
                <Link href="/session" className="inline-flex items-center gap-2 bg-brand-600 text-white px-7 py-3.5 rounded-xl text-base font-medium hover:bg-brand-700 transition-all shadow-md hover:shadow-lg">
                  Continue Generating <IconChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="#pricing" className="inline-flex items-center gap-2 bg-brand-600 text-white px-7 py-3.5 rounded-xl text-base font-medium hover:bg-brand-700 transition-all shadow-md hover:shadow-lg">
                  Generate a Proposal <IconChevronRight className="w-4 h-4" />
                </Link>
              )}
              <Link href="#features" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                See how it works <IconChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><IconCheck className="w-3.5 h-3.5 text-brand-500" /> Create a free account</span>
              <span className="flex items-center gap-1.5"><IconCheck className="w-3.5 h-3.5 text-brand-500" /> Pay as you go</span>
              <span className="flex items-center gap-1.5"><IconCheck className="w-3.5 h-3.5 text-brand-500" /> Naira only</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF BAND ─── */}
      <section className="border-y border-border bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><IconStar className="w-4 h-4 text-amber-400 fill-amber-400" /> Used by freelancers across Nigeria</span>
            <span className="flex items-center gap-2"><IconUsers className="w-4 h-4 text-brand-500" /> 500+ proposals generated</span>
            <span className="flex items-center gap-2"><IconClock className="w-4 h-4 text-brand-500" /> Average setup: 30 seconds</span>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Built for how freelancers actually win.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Every feature is designed around one goal: getting you more replies.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4 dark:bg-brand-900/30">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 md:py-28 bg-muted/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Three steps to your next win.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-5 shadow-md">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-sm font-bold mb-3 dark:bg-brand-900/30 dark:text-brand-300">
                  {step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Simple, transparent pricing.</h2>
            <p className="text-lg text-muted-foreground">No lock-in. No hidden fees. Pay only for what you need.</p>
          </div>
          <div className="flex items-center justify-center mb-10">
            <div className="inline-flex bg-muted rounded-lg p-1">
              <button onClick={() => setTab('session')} className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === 'session' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Session</button>
              <button onClick={() => { setTab('monthly'); setBillingTab('monthly'); }} className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Monthly</button>
            </div>
          </div>
          {mounted && hasSession ? (
            <div className="max-w-lg mx-auto text-center bg-card border border-brand-500 rounded-xl p-8 shadow-sm">
              <div className="w-14 h-14 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 dark:bg-brand-900/30">
                <IconCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Session Active</h3>
              <p className="text-sm text-muted-foreground mb-6">You already have an active session. Head to the generator to keep going.</p>
              <Link href="/session" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition-all">
                Go to Generator <IconChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : tab === 'session' ? (
            <div className="max-w-xl mx-auto">
              <p className="text-center text-sm text-muted-foreground mb-6">Sign in to get started. You&apos;ll be redirected to our secure checkout.</p>
              <div className="grid md:grid-cols-2 gap-6">
                {PRICING_SESSION.map(({ name, price, features, badge, featured }) => (
                  <div key={name} className={`rounded-xl p-6 border relative ${featured ? 'border-brand-500 ring-1 ring-brand-500 bg-card' : 'border-border bg-card'}`}>
                    {badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-medium px-3 py-0.5 rounded-full">{badge}</span>}
                    <p className="text-sm text-muted-foreground font-medium mb-1">{name}</p>
                    <p className="text-3xl font-bold text-foreground mb-1"><span className="text-lg font-medium text-muted-foreground">₦</span>{price}</p>
                    <ul className="text-sm text-muted-foreground mb-5 space-y-1 list-disc list-inside">
                      {features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                    <Link href="/auth/login" className="block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-all bg-brand-600 text-white hover:bg-brand-700">
                      Sign In to Get {name}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-center mb-8">
                <div className="inline-flex bg-muted rounded-lg p-1">
                  <button onClick={() => setBillingTab('monthly')} className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${billingTab === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Monthly</button>
                  <button onClick={() => setBillingTab('annual')} className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${billingTab === 'annual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Annual</button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto">
                {PRICING_MONTHLY.map(({ name, price, annualPrice, annualNote, features, badge, featured }) => (
                  <div key={name} className={`rounded-xl p-6 border relative ${featured ? 'border-brand-500 ring-1 ring-brand-500 bg-card' : 'border-border bg-card'}`}>
                    {badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-medium px-3 py-0.5 rounded-full">{badge}</span>}
                    <p className="text-sm text-muted-foreground font-medium mb-1">{name}</p>
                    <p className="text-3xl font-bold text-foreground mb-1">
                      <span className="text-lg font-medium text-muted-foreground">₦</span>
                      {billingTab === 'annual' ? annualPrice : price}
                      <span className="text-sm font-medium text-muted-foreground">{billingTab === 'annual' ? '/yr' : '/mo'}</span>
                    </p>
                    {billingTab === 'annual' && (
                      <p className="text-xs text-brand-600 font-medium mt-0.5">{annualNote}</p>
                    )}
                    <ul className="text-sm text-muted-foreground mb-5 mt-3 space-y-1 list-disc list-inside">
                      {features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                    <Link href="/dashboard/subscription" className="block w-full text-center bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-all">Start {name}</Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground mt-6 font-mono">flutterwave · card · ussd · bank transfer · naira only</p>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 md:py-28 bg-muted/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">Proof</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Freelancers are winning with Pitchr.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ initials, name, role, text }) => (
              <div key={initials} className="bg-card border border-border rounded-xl p-6 relative">
                <IconQuote className="w-8 h-8 text-brand-100 absolute top-4 right-4 dark:text-brand-900/30" />
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold mb-4">{initials}</div>
                <p className="text-sm text-card-foreground leading-relaxed mb-4">&ldquo;{text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Questions? Answered.</h2>
          </div>
          <div className="space-y-0">
            {FAQS.map(({ q, a }, i) => (
              <details key={i} className="group border-b border-border last:border-b-0">
                <summary className="flex items-center justify-between py-5 cursor-pointer text-sm font-medium text-foreground hover:text-brand-600 transition-colors list-none">
                  {q}
                  <IconChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <p className="pb-5 text-sm text-muted-foreground leading-relaxed -mt-2">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-brand-600 to-brand-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to win more clients?</h2>
          <p className="text-lg text-brand-100 mb-8 max-w-lg mx-auto">Create a free account and generate your first proposal in 30 seconds.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!mounted ? (
              <Link href="#pricing" className="inline-flex items-center gap-2 bg-white text-brand-700 px-7 py-3.5 rounded-xl text-base font-medium hover:bg-brand-50 transition-all shadow-lg">
                Generate a Proposal — ₦500 <IconChevronRight className="w-4 h-4" />
              </Link>
            ) : hasSession ? (
              <Link href="/session" className="inline-flex items-center gap-2 bg-white text-brand-700 px-7 py-3.5 rounded-xl text-base font-medium hover:bg-brand-50 transition-all shadow-lg">
                Back to Generator <IconChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link href="#pricing" className="inline-flex items-center gap-2 bg-white text-brand-700 px-7 py-3.5 rounded-xl text-base font-medium hover:bg-brand-50 transition-all shadow-lg">
                Generate a Proposal — ₦500 <IconChevronRight className="w-4 h-4" />
              </Link>
            )}
            <Link href="#faq" className="inline-flex items-center gap-1 text-brand-100 hover:text-white text-sm font-medium transition-colors">Learn more</Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-foreground font-bold text-lg">Pitchr</span>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/auth/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; 2026 Pitchr. Built in Lagos, Nigeria.</p>
            <p>flutterwave · card · ussd · bank transfer</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

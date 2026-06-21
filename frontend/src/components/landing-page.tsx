'use client';
import React, { useEffect, useState, useRef } from 'react';
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

function Typewriter({ phrases, className }: { phrases: string[]; className?: string }) {
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const current = phrases[phraseIdx];
    const lastPhrase = phraseIdx === phrases.length - 1;

    if (phase === 'typing') {
      if (charCount < current.length) {
        const t = setTimeout(() => setCharCount(c => c + 1), 60);
        return () => clearTimeout(t);
      }
      const hold = lastPhrase ? 3000 : 2000;
      const t = setTimeout(() => setPhase('pausing'), hold);
      return () => clearTimeout(t);
    }

    if (phase === 'pausing') {
      const t = setTimeout(() => setPhase('deleting'), 400);
      return () => clearTimeout(t);
    }

    if (phase === 'deleting') {
      if (charCount > 0) {
        const t = setTimeout(() => setCharCount(c => c - 1), 30);
        return () => clearTimeout(t);
      }
      const nextIdx = lastPhrase ? 0 : phraseIdx + 1;
      const t = setTimeout(() => { setPhraseIdx(nextIdx); setPhase('typing'); setCharCount(0); }, 200);
      return () => clearTimeout(t);
    }
  }, [phase, charCount, phraseIdx, phrases]);

  return (
    <span className={className}>
      {phrases[phraseIdx].slice(0, charCount)}
      <span className="inline-block w-[2px] h-[0.85em] bg-brand-500 animate-pulse align-middle ml-0.5" />
    </span>
  );
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AnimatedSection({ children, className, delay = 0, id }: { children: React.ReactNode; className?: string; delay?: number; id?: string }) {
  const { ref, visible } = useInView();
  return (
    <section ref={ref as React.RefObject<HTMLElement>} id={id} className={`${className || ''} ${visible ? 'animate-section' : 'opacity-0'}`} style={visible ? { animationDelay: `${delay}s` } : undefined}>
      {children}
    </section>
  );
}

function AnimatedFooter({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <footer ref={ref as React.RefObject<HTMLElement>} className={`${className || ''} ${visible ? 'animate-section' : 'opacity-0'}`} style={visible ? { animationDelay: `${delay}s` } : undefined}>
      {children}
    </footer>
  );
}

function FadeItem({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView(0.05);
  const baseStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : 'translateY(28px)',
    transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
  };
  if (className) {
    return <div ref={ref as React.RefObject<HTMLDivElement>} className={className} style={baseStyle}>{children}</div>;
  }
  return <span ref={ref as React.RefObject<HTMLSpanElement>} style={{ display: 'inline-block', ...baseStyle }}>{children}</span>;
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [heroReady, setHeroReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tab, setTab] = useState<'session' | 'monthly'>('session');
  const [billingTab, setBillingTab] = useState<'monthly' | 'annual'>('monthly');
  const token = useSessionStore((s) => s.token);
  const hydrated = useSessionStore((s) => s.hydrated);
  const rehydrate = useSessionStore((s) => s.rehydrate);
  const hasSession = hydrated && token !== null;
  const searchParams = useSearchParams();

  useEffect(() => { setMounted(true); rehydrate(); }, [rehydrate]);
  useEffect(() => { const t = setTimeout(() => setHeroReady(true), 100); return () => clearTimeout(t); }, []);

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
            <div className="animate-fade-up delay-200 inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 dark:bg-brand-900/30 dark:text-brand-300">
              <IconSparkles className="w-4 h-4" />
              Tailored AI Proposal Generator for Freelancers
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.08] mb-6">
              {heroReady ? (
                <Typewriter phrases={[
                  'Tired of not getting clients?',
                  'Sick of wasting connects?',
                  'Done with templates that sound fake?',
                  'Write proposals that actually get replies.',
                ]} />
              ) : (
                <span className="invisible">Write proposals that actually get replies.</span>
              )}
            </h1>
            <p className="animate-fade-up delay-300 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Paste a job description. Get a winning proposal written specifically for Upwork or Fiverr. 
              No templates, no cliches, no wasted connects. <strong className="text-foreground">30 seconds.</strong>
            </p>
            <div className="animate-fade-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
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
      <AnimatedSection className="border-y border-border bg-muted/50" delay={0.3}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <FadeItem delay={0}><span className="flex items-center gap-2"><IconStar className="w-4 h-4 text-amber-400 fill-amber-400" /> Used by freelancers across Nigeria</span></FadeItem>
            <FadeItem delay={0.12}><span className="flex items-center gap-2"><IconUsers className="w-4 h-4 text-brand-500" /> 1 in 8 reply rate (avg is 1 in 20)</span></FadeItem>
            <FadeItem delay={0.24}><span className="flex items-center gap-2"><IconClock className="w-4 h-4 text-brand-500" /> Average setup: 30 seconds</span></FadeItem>
          </div>
        </div>
      </AnimatedSection>

      {/* ─── BEFORE / AFTER DEMO ─── */}
      <AnimatedSection className="py-20 md:py-28 bg-muted/30 dark:bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <FadeItem delay={0}><p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">See the difference</p></FadeItem>
            <FadeItem delay={0.08}><h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Not all proposals are created equal.</h2></FadeItem>
            <FadeItem delay={0.16}><p className="text-lg text-muted-foreground max-w-2xl mx-auto">Below is a real Upwork job. On the left: a typical proposal. On the right: what Pitchr writes.</p></FadeItem>
          </div>

          <FadeItem delay={0.25} className="bg-card border border-border rounded-xl p-5 mb-8 max-w-3xl mx-auto">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sample Job (Upwork)</p>
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">Looking for a React developer to build a dashboard</span><br />
              We need a dashboard with real time charts, user management, and role based access. Must have experience with Recharts and Next.js. Budget: $2,000. Timeline: 3 weeks.
            </p>
          </FadeItem>

          <div className="grid md:grid-cols-2 gap-6">
            <FadeItem delay={0.35} className="bg-card border border-border border-l-4 border-l-red-500 dark:border-l-red-400 rounded-xl p-6 relative">
              <span className="absolute -top-3 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Typical Freelancer</span>
              <div className="mt-2 space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Dear Sir/Madam,<br /><br />
                  I am writing to express my interest in your project. I have read your job description and I am confident that I can handle this project effectively. I am a hardworking and dedicated freelancer with 5 years of experience. I have strong communication skills and I always deliver on time. Please check my profile for more details. I am passionate about this project and I look forward to hearing from you soon.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs bg-red-100 dark:bg-red-400/15 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-medium">Generic opener</span>
                  <span className="text-xs bg-red-100 dark:bg-red-400/15 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-medium">No specifics</span>
                  <span className="text-xs bg-red-100 dark:bg-red-400/15 text-red-700 dark:text-red-300 px-2 py-0.5 rounded font-medium">Zero platform knowledge</span>
                </div>
              </div>
            </FadeItem>
            <FadeItem delay={0.45} className="bg-card border border-border border-l-4 border-l-brand-500 dark:border-l-brand-400 rounded-xl p-6 relative">
              <span className="absolute -top-3 left-4 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">Pitchr</span>
              <div className="mt-2 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">
                  Your dashboard needs Recharts specifically. I noticed you mentioned it in the job post. I recently shipped a Next.js admin panel with Recharts that handles 10k data points in real time. For role based access, I typically implement middleware level guards in Next.js that prevent unauthorized route access before any component renders. <br /><br />
                  I can deliver the full dashboard in 3 weeks. I would start with the chart layer and RBAC system since those are the backbone, then build the user management UI around them. Happy to share the admin panel I mentioned as a reference.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs bg-brand-100 dark:bg-brand-400/15 text-brand-700 dark:text-brand-200 px-2 py-0.5 rounded font-medium">Specific tech reference</span>
                  <span className="text-xs bg-brand-100 dark:bg-brand-400/15 text-brand-700 dark:text-brand-200 px-2 py-0.5 rounded font-medium">Proven experience</span>
                  <span className="text-xs bg-brand-100 dark:bg-brand-400/15 text-brand-700 dark:text-brand-200 px-2 py-0.5 rounded font-medium">Clear timeline</span>
                  <span className="text-xs bg-brand-100 dark:bg-brand-400/15 text-brand-700 dark:text-brand-200 px-2 py-0.5 rounded font-medium">No fluff</span>
                </div>
              </div>
            </FadeItem>
          </div>

          <FadeItem delay={0.55}><div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">Pitchr reads the job, references your skills, and writes like you in 30 seconds.</p>
          </div></FadeItem>
        </div>
      </AnimatedSection>

      {/* ─── FEATURES ─── */}
      <AnimatedSection id="features" className="py-20 md:py-28" delay={0.4}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <FadeItem delay={0}><p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">Features</p></FadeItem>
            <FadeItem delay={0.1}><h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Built for how freelancers actually win.</h2></FadeItem>
            <FadeItem delay={0.2}><p className="text-lg text-muted-foreground max-w-2xl mx-auto">Every feature is designed around one goal: getting you more replies.</p></FadeItem>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <FadeItem key={title} delay={0.3 + i * 0.1} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4 dark:bg-brand-900/30">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </FadeItem>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── HOW IT WORKS ─── */}
      <AnimatedSection id="how-it-works" className="py-20 md:py-28 bg-muted/70" delay={0.5}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <FadeItem delay={0}><p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">How It Works</p></FadeItem>
            <FadeItem delay={0.1}><h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Three steps to your next win.</h2></FadeItem>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }, i) => (
              <FadeItem key={step} delay={0.2 + i * 0.12} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-5 shadow-md">
                  <Icon className="w-7 h-7" />
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-sm font-bold mb-3 dark:bg-brand-900/30 dark:text-brand-300">
                  {step}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </FadeItem>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── PRICING ─── */}
      <AnimatedSection id="pricing" className="py-20 md:py-28" delay={0.6}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <FadeItem delay={0}><p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">Pricing</p></FadeItem>
            <FadeItem delay={0.08}><h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Simple, transparent pricing.</h2></FadeItem>
            <FadeItem delay={0.16}><p className="text-lg text-muted-foreground">No lock-in. No hidden fees. Pay only for what you need.</p></FadeItem>
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
      </AnimatedSection>

      {/* ─── TESTIMONIALS ─── */}
      <AnimatedSection className="py-20 md:py-28 bg-muted/70" delay={0.5}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <FadeItem delay={0}><p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">Proof</p></FadeItem>
            <FadeItem delay={0.08}><h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Freelancers are winning with Pitchr.</h2></FadeItem>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ initials, name, role, text }, i) => (
              <FadeItem key={initials} delay={0.2 + i * 0.12} className="bg-card border border-border rounded-xl p-6 relative">
                <IconQuote className="w-8 h-8 text-brand-100 absolute top-4 right-4 dark:text-brand-900/30" />
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold mb-4">{initials}</div>
                <p className="text-sm text-card-foreground leading-relaxed mb-4">&ldquo;{text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </FadeItem>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── FAQ ─── */}
      <AnimatedSection id="faq" className="py-20 md:py-28" delay={0.5}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <FadeItem delay={0}><p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-3">FAQ</p></FadeItem>
            <FadeItem delay={0.08}><h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Questions? Answered.</h2></FadeItem>
          </div>
          <div className="space-y-0">
            {FAQS.map(({ q, a }, i) => (
              <FadeItem key={i} delay={0.2 + i * 0.08}>
                <details className="group border-b border-border last:border-b-0">
                  <summary className="flex items-center justify-between py-5 cursor-pointer text-sm font-medium text-foreground hover:text-brand-600 transition-colors list-none">
                    {q}
                    <IconChevronRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="pb-5 text-sm text-muted-foreground leading-relaxed -mt-2">{a}</p>
                </details>
              </FadeItem>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─── FINAL CTA ─── */}
      <AnimatedSection className="py-20 md:py-28 bg-gradient-to-br from-brand-600 to-brand-700" delay={0.5}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeItem delay={0}><h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to win more clients?</h2></FadeItem>
          <FadeItem delay={0.1}><p className="text-lg text-brand-100 mb-8 max-w-lg mx-auto">Create a free account and generate your first proposal in 30 seconds.</p></FadeItem>
          <FadeItem delay={0.2}><div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
          </div></FadeItem>
        </div>
      </AnimatedSection>

      {/* ─── FOOTER ─── */}
      <AnimatedFooter className="bg-card border-t border-border py-12" delay={0.5}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeItem delay={0}><div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-foreground font-bold text-lg">Pitchr</span>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/auth/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            </div>
          </div></FadeItem>
          <FadeItem delay={0.15}><div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; 2026 Pitchr. Built in Lagos, Nigeria.</p>
            <p>flutterwave · card · ussd · bank transfer</p>
          </div></FadeItem>
        </div>
      </AnimatedFooter>
    </main>
  );
}

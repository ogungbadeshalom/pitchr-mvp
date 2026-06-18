'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../../../components/ui/button';
import { useToastStore } from '../../../store/toastStore';
import { useUserStore } from '../../../store/userStore';
import { useSessionStore } from '../../../store/sessionStore';
import { initSuperTokens } from '../../../lib/supertokens';
import { getAuthorisationURLWithQueryParamsAndSetState } from 'supertokens-web-js/recipe/thirdparty';
import { fetchActiveSession } from '../../../lib/api';
import ThemeToggle from '../../../components/ui/theme-toggle';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const setUser = useUserStore((s) => s.setUser);
  const setSession = useSessionStore((s) => s.setSession);

  async function handleGoogleSignIn() {
    initSuperTokens();
    try {
      const authUrl = await getAuthorisationURLWithQueryParamsAndSetState({
        thirdPartyId: 'google',
        frontendRedirectURI: `${window.location.origin}/auth/callback`,
        redirectURIOnProviderDashboard: `${window.location.origin}/auth/callback`,
      });
      window.location.href = authUrl;
    } catch {
      addToast('Failed to start Google sign-in', 'error');
    }
  }

  function validateField(name: string, value: string) {
    if (!value.trim()) {
      setFieldErrors((p) => ({ ...p, [name]: 'This field is required' }));
      return false;
    }
    if (name === 'email' && !EMAIL_REGEX.test(value)) {
      setFieldErrors((p) => ({ ...p, email: 'Enter a valid email address' }));
      return false;
    }
    if (name === 'password' && value.length < 6) {
      setFieldErrors((p) => ({ ...p, password: 'Password must be at least 6 characters' }));
      return false;
    }
    setFieldErrors((p) => ({ ...p, [name]: '' }));
    return true;
  }

  function handleBlur(name: string, value: string) {
    validateField(name, value);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const emailValid = validateField('email', email);
    const passValid = validateField('password', password);
    if (!emailValid || !passValid) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          const u = data.user;
          setUser(u.id, u.email, u.first_name || null, u.last_name || null, u.subscription_tier, u.proposal_count_this_month || 0, u.proposal_limit_this_month || 0);
        }
        fetchActiveSession().then(s => { if (s) setSession(s.token, s.plan, s.expiresAt, s.proposalsLimit); }).catch(() => {});
        router.push('/dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 relative">
      <ThemeToggle className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-background border border-border shadow-sm flex items-center justify-center hover:shadow-md hover:border-brand-300 transition-all" />
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/images/P.png" alt="Pitchr logo" width={24} height={24} className="rounded" />
            <span className="text-2xl font-bold text-brand-600 tracking-tight">Pitchr</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-card border border-brand-100 dark:border-brand-800 rounded-xl p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-center mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                onBlur={(e) => handleBlur('email', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow bg-white dark:bg-card ${
                  fieldErrors.email ? 'border-red-400 focus:border-red-500' : 'border-input focus:border-brand-500'
                }`}
                placeholder="you@example.com"
                required
              />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                  onBlur={(e) => handleBlur('password', e.target.value)}
                  className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow bg-white dark:bg-card ${
                    fieldErrors.password ? 'border-red-400 focus:border-red-500' : 'border-input focus:border-brand-500'
                  }`}
                  placeholder="Enter your password"
                  required
                />
                {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 gap-2">
              Sign In
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-input rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          No account?{' '}
          <Link href="/auth/signup" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
